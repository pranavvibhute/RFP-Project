from __future__ import annotations

import hashlib
from dataclasses import dataclass

from app.core.config import settings
from app.core.exceptions import SummarizationError
from app.prompts.analysis import ANALYSIS_PROMPT, ANALYSIS_RESPONSE_SCHEMA, ANALYSIS_SYSTEM_INSTRUCTION
from app.schemas.ai_analysis import AIAnalysisSchema
from app.services.ai.chunking import chunk_text, truncate_text
from app.services.ai.embeddings import embedding_service
from app.services.ai.providers import ModelResponse, build_provider
from app.services.ai.vector_store import RetrievalHit, document_store
from app.core.logging import get_logger

logger = get_logger("services.ai.intelligence")



@dataclass(frozen=True)
class DocumentAnalysisResult:
    analysis: AIAnalysisSchema
    provider: str
    model: str
    used_fallback: bool
    confidence_score: float
    retrieval_hits: list[RetrievalHit]
    raw_response: dict


class DocumentIntelligenceService:
    """Runs retrieval-assisted analysis with a primary LLM and Gemini fallback."""

    def analyze(self, document_text: str, filename: str) -> DocumentAnalysisResult:
        if not document_text or not document_text.strip():
            raise SummarizationError("No text provided to analyze.")

        prompt_text = truncate_text(document_text.strip(), settings.AI_MAX_PROMPT_CHARS)
        chunks = chunk_text(
            prompt_text,
            chunk_size=settings.RAG_CHUNK_SIZE,
            overlap=settings.RAG_CHUNK_OVERLAP,
        )

        document_id = self._document_id(filename=filename, text=prompt_text)
        retrieval_hits: list[RetrievalHit] = []

        if chunks:
            chunk_vectors = embedding_service.embed_texts([chunk.text for chunk in chunks])
            document_store.upsert_document(
                document_id=document_id,
                filename=filename,
                chunks=chunks,
                embeddings=chunk_vectors,
            )

            query_vector = embedding_service.embed_query(self._build_retrieval_query(filename, prompt_text))
            retrieval_hits = document_store.search(
                document_id=document_id,
                query_vector=query_vector,
                limit=settings.RAG_TOP_K,
            )

        prompt = self._build_prompt(filename=filename, document_text=prompt_text, hits=retrieval_hits)

        primary_provider = self._resolve_provider(settings.AI_PRIMARY_PROVIDER)
        fallback_provider = self._resolve_provider(settings.AI_FALLBACK_PROVIDER)

        if primary_provider.provider_name == fallback_provider.provider_name:
            fallback_provider = None

        primary_attempt = None
        primary_error = None

        try:
            primary_attempt = self._run_provider(
                provider=primary_provider,
                prompt=prompt,
                fallback_attempt=False,
                retrieval_hits=retrieval_hits,
            )
        except Exception as exc:
            primary_error = exc

        # Determine if we should fallback (due to error, low confidence, or missing data)
        should_fallback = False
        if primary_error is not None:
            should_fallback = True
        elif primary_attempt is not None:
            should_fallback = self._should_fallback(
                primary_attempt.analysis, 
                retrieval_hits, 
                primary_attempt.confidence_score
            )

        if should_fallback:
            if fallback_provider is not None:
                logger.warning(
                    "Primary provider (%s) failed or was low confidence. Falling back to %s. Primary error: %s",
                    primary_provider.provider_name,
                    fallback_provider.provider_name,
                    primary_error,
                )
                try:
                    fallback_attempt = self._run_provider(
                        provider=fallback_provider,
                        prompt=prompt,
                        fallback_attempt=True,
                        retrieval_hits=retrieval_hits,
                    )
                    return fallback_attempt
                except Exception as exc:
                    raise SummarizationError(f"Fallback provider failed: {exc}") from exc
            else:
                if primary_error:
                    raise SummarizationError(f"Primary provider failed and no fallback is configured: {primary_error}") from primary_error

        if primary_error:
            raise SummarizationError(f"Primary provider failed and no fallback is configured: {primary_error}") from primary_error

        return primary_attempt

    def _run_provider(
        self,
        *,
        provider,
        prompt: str,
        fallback_attempt: bool,
        retrieval_hits: list[RetrievalHit],
    ) -> DocumentAnalysisResult:
        try:
            response = provider.generate(
                prompt=prompt,
                system_instruction=ANALYSIS_SYSTEM_INSTRUCTION,
                response_schema=ANALYSIS_RESPONSE_SCHEMA,
            )
            
            # Clean up markdown code block wrapper if present
            raw_text = response.text.strip() if response.text else ""
            if raw_text.startswith("```"):
                import re
                match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_text)
                if match:
                    raw_text = match.group(1).strip()
                    
            analysis = AIAnalysisSchema.model_validate_json(raw_text)

        except Exception as exc:
            if fallback_attempt:
                raise SummarizationError(f"Fallback provider failed: {exc}") from exc
            raise SummarizationError(f"Primary provider failed: {exc}") from exc

        confidence_score = self._estimate_confidence(analysis, prompt, provider.provider_name)
        return DocumentAnalysisResult(
            analysis=analysis,
            provider=provider.provider_name,
            model=provider.model_name,
            used_fallback=fallback_attempt,
            confidence_score=confidence_score,
            retrieval_hits=retrieval_hits,
            raw_response={
                "provider": provider.provider_name,
                "model": provider.model_name,
                "response_text": response.text,
                "response": response.raw if isinstance(response.raw, dict) else None,
            },
        )

    def _resolve_provider(self, name: str):
        try:
            return build_provider(name)
        except SummarizationError:
            if name.lower() == settings.AI_PRIMARY_PROVIDER.lower():
                return build_provider(settings.AI_FALLBACK_PROVIDER)
            raise

    def _should_fallback(
        self,
        analysis: AIAnalysisSchema,
        retrieval_hits: list[RetrievalHit],
        confidence_score: float,
    ) -> bool:
        if confidence_score < settings.AI_FALLBACK_CONFIDENCE_THRESHOLD:
            return True

        if not retrieval_hits:
            return True

        if not analysis.requirements or not analysis.risks:
            return True

        return False

    def _estimate_confidence(self, analysis: AIAnalysisSchema, prompt: str, provider_name: str) -> float:
        score = 0.55
        score += 0.08 if analysis.executive_summary.strip() else 0.0
        score += 0.08 if analysis.opportunity_summary.strip() else 0.0
        score += 0.08 if analysis.requirements else 0.0
        score += 0.08 if analysis.risks else 0.0
        score += 0.05 if analysis.evaluation_criteria else 0.0
        score += 0.04 if analysis.important_risks else 0.0
        score += 0.03 if analysis.issuing_organization else 0.0
        score += 0.04 if provider_name == "gemini" else 0.0
        if len(prompt) > 40000:
            score -= 0.05
        return max(0.0, min(0.99, round(score, 2)))

    def _build_prompt(self, *, filename: str, document_text: str, hits: list[RetrievalHit]) -> str:
        retrieved_sections = []
        for hit in hits:
            retrieved_sections.append(
                f"[Chunk {hit.chunk_index} | score={hit.score:.3f}]\n{hit.text}"
            )

        prompt_body = (
            f"Filename: {filename}\n\n"
            f"Retrieved context:\n{chr(10).join(retrieved_sections) if retrieved_sections else 'No retrieval hits available.'}"
        )
        return ANALYSIS_PROMPT.format(document=prompt_body)

    def _build_retrieval_query(self, filename: str, document_text: str) -> str:
        preview = document_text[:2000]
        return (
            f"Analyze RFP {filename} for requirements, deadlines, evaluation criteria, risks, and issuing organization. "
            f"Relevant excerpt: {preview}"
        )

    def _document_id(self, *, filename: str, text: str) -> str:
        digest = hashlib.sha1(f"{filename}:{text}".encode("utf-8")).hexdigest()
        return digest


document_intelligence_service = DocumentIntelligenceService()
