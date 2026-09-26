from __future__ import annotations

from typing import Any
from app.services.ai.agents.base_agent import BaseAgent

DOC_PARSING_SYSTEM_INSTRUCTION = """You are the Document Parsing Agent for BidWise AI.
Your sole responsibility is to extract high-level document metadata, project overview, executive summary, submission deadlines, and the issuing organization from RFP/tender documents.
Do not hallucinate dates or details. If not specified, return null or empty lists.
Return valid JSON matching the schema."""

DOC_PARSING_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "executive_summary": {"type": "STRING", "description": "2-4 sentence summary of what the RFP is asking for"},
        "opportunity_summary": {"type": "STRING", "description": "Brief summary of the business and contract opportunity"},
        "submission_deadline": {"type": "STRING", "description": "Primary proposal submission deadline date and time"},
        "issuing_organization": {"type": "STRING", "description": "Name of the issuer/client organization"}
    },
    "required": ["executive_summary", "opportunity_summary"]
}


class DocParsingAgent(BaseAgent):
    """Specialized agent powered by Google Gemini 2.5 Flash for high-throughput document ingestion."""

    def __init__(
        self,
        primary_provider: str = "gemini",
        primary_model: str | None = None,
        fallback_provider: str = "openrouter",
    ) -> None:
        super().__init__(
            name="DocParsingAgent",
            primary_provider=primary_provider,
            primary_model=primary_model,
            fallback_provider=fallback_provider,
        )

    def parse(self, filename: str, document_text: str, context_chunks: str = "") -> dict[str, Any]:
        prompt = f"""RFP Document: {filename}

Context / Key Excerpts:
{context_chunks if context_chunks else document_text[:15000]}

Extract the executive summary, opportunity summary, submission deadline, and issuing organization."""
        data, provider, model = self.run_inference(
            prompt=prompt,
            system_instruction=DOC_PARSING_SYSTEM_INSTRUCTION,
            response_schema=DOC_PARSING_SCHEMA,
            temperature=0.1,
        )
        data["_agent_meta"] = {"agent": self.name, "provider": provider, "model": model}
        return data
