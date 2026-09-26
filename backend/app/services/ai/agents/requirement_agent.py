from __future__ import annotations

from typing import Any
from app.services.ai.agents.base_agent import BaseAgent

REQUIREMENT_SYSTEM_INSTRUCTION = """You are the Requirement Analysis Agent for BidWise AI.
Your sole job is to extract technical, security, compliance, operational, and financial requirements from RFP documents.
Categorize each requirement into one of: 'Mandatory', 'Technical', 'Security', 'Operational', or 'Financial'.
Assign priority as: 'High', 'Medium', or 'Low'.
Extract official evaluation criteria if present.
Return valid JSON matching the schema."""

REQUIREMENT_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "requirements": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "category": {"type": "STRING", "description": "e.g. Mandatory, Technical, Security, Operational, Financial"},
                    "priority": {"type": "STRING", "description": "High, Medium, Low"},
                    "requirement": {"type": "STRING", "description": "Specific, verbatim or concise requirement statement"}
                },
                "required": ["category", "priority", "requirement"]
            }
        },
        "evaluation_criteria": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "List of evaluation criteria and percentage weightings if specified"
        }
    },
    "required": ["requirements"]
}


class RequirementAnalysisAgent(BaseAgent):
    """Specialized agent powered by Qwen 2.5 (OpenRouter) for structured taxonomy & requirement categorization."""

    def __init__(
        self,
        primary_provider: str = "qwen",
        primary_model: str | None = "qwen/qwen-2.5-72b-instruct",
        fallback_provider: str = "gemini",
    ) -> None:
        super().__init__(
            name="RequirementAnalysisAgent",
            primary_provider=primary_provider,
            primary_model=primary_model,
            fallback_provider=fallback_provider,
        )

    def analyze(self, filename: str, document_text: str, context_chunks: str = "") -> dict[str, Any]:
        prompt = f"""RFP Document: {filename}

Context / Key Excerpts:
{context_chunks if context_chunks else document_text[:15000]}

Identify all mandatory, technical, and operational requirements along with official evaluation criteria."""
        data, provider, model = self.run_inference(
            prompt=prompt,
            system_instruction=REQUIREMENT_SYSTEM_INSTRUCTION,
            response_schema=REQUIREMENT_SCHEMA,
            temperature=0.1,
        )
        data["_agent_meta"] = {"agent": self.name, "provider": provider, "model": model}
        return data
