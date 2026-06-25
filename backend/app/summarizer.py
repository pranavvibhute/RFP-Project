"""
summarizer.py
F2: Executive Summary — Gemini-powered generation.

Takes raw extracted RFP text and produces a structured executive
summary matching the PRD's F2 spec:
  Project Overview, Key Requirements, Deadlines,
  Evaluation Criteria, Important Risks
"""

from __future__ import annotations

import json
import os

from google import genai
from pydantic import BaseModel, Field

MAX_CHARS_FOR_PROMPT = 200_000  # rough safety cap; Gemini 2.5 Flash has a large context window


class Deadline(BaseModel):
    label: str = Field(description="What the deadline is for, e.g. 'Submission Deadline'")
    date_or_detail: str = Field(description="The date or detail as stated in the document")


class ExecutiveSummary(BaseModel):
    project_overview: str = Field(description="2-4 sentence summary of what the RFP is asking for")
    key_requirements: list[str] = Field(description="Bullet list of the most important requirements")
    deadlines: list[Deadline] = Field(description="All deadlines mentioned (submission, Q&A, site visit, etc.)")
    evaluation_criteria: list[str] = Field(description="How the issuer says they will evaluate bids")
    important_risks: list[str] = Field(description="Notable risks: ambiguity, tight timelines, unusual terms, etc.")
    issuing_organization: str | None = Field(
        default=None, description="Name of the customer/organization issuing this RFP, if identifiable"
    )


SYSTEM_INSTRUCTION = """You are an expert bid/proposal analyst for BidWise AI.
You read RFPs, RFQs, and Tenders and extract accurate, decision-useful information for a Bid Manager
who has NOT read the full document and needs to decide whether to pursue it.

Rules:
- Only state what is actually in the document. Do not invent requirements, dates, or criteria.
- If a field has no information in the document, return an empty list (for lists) or null (for issuing_organization).
- Be concise and specific. Prefer exact figures, dates, and named certifications over vague language.
- "Important Risks" means things that could hurt a bid decision: unrealistic deadlines, ambiguous scope,
  unusual penalty clauses, mandatory certifications, single-bidder suspicion, incomplete information, etc.
- Output must be valid JSON matching the provided schema. No prose outside the JSON.
"""


class SummarizationError(Exception):
    """Raised when Gemini fails to produce a usable summary."""


def _get_client() -> genai.Client:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise SummarizationError(
            "GEMINI_API_KEY is not set."
        )
    return genai.Client(api_key=api_key)


EXECUTIVE_SUMMARY_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "project_overview": {
            "type": "STRING",
            "description": "2-4 sentence summary of what the RFP is asking for"
        },
        "key_requirements": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Bullet list of the most important requirements"
        },
        "deadlines": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "label": {
                        "type": "STRING",
                        "description": "What the deadline is for, e.g. 'Submission Deadline'"
                    },
                    "date_or_detail": {
                        "type": "STRING",
                        "description": "The date or detail as stated in the document"
                    }
                },
                "required": ["label", "date_or_detail"]
            },
            "description": "All deadlines mentioned (submission, Q&A, site visit, etc.)"
        },
        "evaluation_criteria": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "How the issuer says they will evaluate bids"
        },
        "important_risks": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Notable risks: ambiguity, tight timelines, unusual terms, etc."
        },
        "issuing_organization": {
            "type": "STRING",
            "description": "Name of the customer/organization issuing this RFP, if identifiable",
        }
    },
    "required": [
        "project_overview",
        "key_requirements",
        "deadlines",
        "evaluation_criteria",
        "important_risks"
    ]
}


def generate_executive_summary(rfp_text: str, filename: str = "document") -> ExecutiveSummary:
    """
    Send extracted RFP text to Gemini and return a structured ExecutiveSummary.
    Raises SummarizationError on API failure or unparseable output.
    """
    if not rfp_text or not rfp_text.strip():
        raise SummarizationError("No text provided to summarize.")

    text_for_prompt = rfp_text[:MAX_CHARS_FOR_PROMPT]
    truncated = len(rfp_text) > MAX_CHARS_FOR_PROMPT

    model_name = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
    client = _get_client()

    user_prompt = f"""Document: {filename}
{"(NOTE: document was truncated due to length — analyze what is provided)" if truncated else ""}

--- RFP TEXT START ---
{text_for_prompt}
--- RFP TEXT END ---

Produce the executive summary now, as JSON matching the schema."""

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=user_prompt,
            config={
                "system_instruction": SYSTEM_INSTRUCTION,
                "response_mime_type": "application/json",
                "response_schema": EXECUTIVE_SUMMARY_SCHEMA,
                "temperature": 0.2,
            },
        )
    except Exception as e:
        raise SummarizationError(f"Gemini API call failed: {e}") from e

    raw_text = response.text
    if not raw_text:
        raise SummarizationError("Gemini returned an empty response.")

    try:
        data = json.loads(raw_text)
        return ExecutiveSummary.model_validate(data)
    except (json.JSONDecodeError, ValueError) as e:
        raise SummarizationError(
            f"Could not parse Gemini output as valid ExecutiveSummary JSON: {e}\nRaw: {raw_text[:500]}"
        ) from e
