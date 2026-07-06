from __future__ import annotations

import json

from app.core.exceptions import SummarizationError
from app.prompts.analysis import (
    SYSTEM_INSTRUCTION,
    EXECUTIVE_SUMMARY_SCHEMA,
    build_user_prompt,
)
from app.schemas.analysis import ExecutiveSummary
from app.services.ai.client import gemini_client

MAX_CHARS_FOR_PROMPT = 200_000


def generate_executive_summary(
    rfp_text: str,
    filename: str = "document",
) -> ExecutiveSummary:
    """
    Generate a structured executive summary from extracted RFP text.
    """

    if not rfp_text or not rfp_text.strip():
        raise SummarizationError("No text provided to summarize.")

    truncated = len(rfp_text) > MAX_CHARS_FOR_PROMPT
    text_for_prompt = rfp_text[:MAX_CHARS_FOR_PROMPT]

    user_prompt = build_user_prompt(
        filename=filename,
        rfp_text=text_for_prompt,
        truncated=truncated,
    )

    try:
        response = gemini_client.generate(
            prompt=user_prompt,
            system_instruction=SYSTEM_INSTRUCTION,
            response_schema=EXECUTIVE_SUMMARY_SCHEMA,
        )
    except Exception as e:
        raise SummarizationError(f"Gemini API call failed: {e}") from e

    if not response.text:
        raise SummarizationError("Gemini returned an empty response.")

    try:
        return ExecutiveSummary.model_validate_json(response.text)

    except Exception as e:
        raise SummarizationError(
            f"Failed to parse Gemini response.\n\n"
            f"Raw Response:\n{response.text[:500]}"
        ) from e