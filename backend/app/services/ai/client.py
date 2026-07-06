from __future__ import annotations

from google import genai

from app.core.config import settings
from app.core.exceptions import SummarizationError


class GeminiClient:
    """
    Wrapper around the Gemini SDK.

    This class is responsible ONLY for communicating with Gemini.
    It does not know anything about RFPs, prompts, or schemas.
    """

    def __init__(self) -> None:
        if not settings.GEMINI_API_KEY:
            raise SummarizationError("GEMINI_API_KEY is not configured.")

        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model = settings.GEMINI_MODEL

    def generate(
        self,
        *,
        prompt: str,
        system_instruction: str,
        response_schema: dict,
        temperature: float = 0.2,
    ):
        return self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config={
                "system_instruction": system_instruction,
                "response_mime_type": "application/json",
                "response_schema": response_schema,
                "temperature": temperature,
            },
        )


gemini_client = GeminiClient()