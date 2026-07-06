import json

from app.services.ai.client import gemini_client
from app.prompts.analysis import (
    ANALYSIS_PROMPT,
    ANALYSIS_SYSTEM_INSTRUCTION,
    ANALYSIS_RESPONSE_SCHEMA,
)
from app.schemas.ai_analysis import AIAnalysisSchema
from app.core.exceptions import SummarizationError


class AIAnalysisService:
    """
    Orchestrates the AI analysis using Gemini.
    Translates raw text into structured JSON validated by AIAnalysisSchema.
    """

    def analyze(self, document_text: str) -> AIAnalysisSchema:
        if not document_text or not document_text.strip():
            raise SummarizationError("No text provided to analyze.")

        # Build prompt by formatting placeholder
        prompt = ANALYSIS_PROMPT.format(document=document_text)

        try:
            response = gemini_client.generate(
                prompt=prompt,
                system_instruction=ANALYSIS_SYSTEM_INSTRUCTION,
                response_schema=ANALYSIS_RESPONSE_SCHEMA,
            )
        except Exception as e:
            raise SummarizationError(f"Gemini API call failed during analysis: {e}") from e

        if not response.text:
            raise SummarizationError("Gemini returned an empty response during analysis.")

        try:
            return AIAnalysisSchema.model_validate_json(response.text)
        except Exception as e:
            raise SummarizationError(
                f"Failed to parse Gemini analysis response: {e}\nRaw Response: {response.text[:500]}"
            ) from e


ai_analysis_service = AIAnalysisService()