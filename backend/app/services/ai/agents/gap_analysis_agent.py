from __future__ import annotations

import json
from typing import Any
from app.services.ai.agents.base_agent import BaseAgent

GAP_SYSTEM_INSTRUCTION = """You are the Gap Analysis Agent for BidWise AI.
You evaluate extracted RFP requirements against the bidding organization's profile and capabilities (Org Info).
Identify:
1. Capabilities that strongly match.
2. Capability or compliance gaps where the bidding organization is missing certifications, skills, or capacity.
Return valid JSON matching the schema."""

GAP_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "matched_capabilities": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "List of RFP requirements that our organization clearly fulfills"
        },
        "critical_gaps": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "List of requirements that represent a capability gap or missing certification"
        },
        "gap_assessment_summary": {
            "type": "STRING",
            "description": "2-3 sentence overview of organizational fit"
        }
    },
    "required": ["matched_capabilities", "critical_gaps", "gap_assessment_summary"]
}


class GapAnalysisAgent(BaseAgent):
    """Specialized agent powered by Google Gemini 2.5 Flash for organizational capability gap analysis."""

    def __init__(
        self,
        primary_provider: str = "gemini",
        primary_model: str | None = None,
        fallback_provider: str = "openrouter",
        fallback_model: str | None = None,
    ) -> None:
        super().__init__(
            name="GapAnalysisAgent",
            primary_provider=primary_provider,
            primary_model=primary_model,
            fallback_provider=fallback_provider,
            fallback_model=fallback_model,
        )

    def analyze(
        self,
        requirements: list[dict] | None = None,
        org_info: dict | None = None,
        *,
        context_str: str | None = None,
        document_text: str | None = None,
    ) -> dict[str, Any]:
        if requirements:
            req_content = json.dumps(requirements[:15], indent=2)
        elif context_str:
            req_content = f"Extracted RFP Key Sections & Scope:\n{context_str[:2500]}"
        elif document_text:
            req_content = f"RFP Document Excerpt:\n{document_text[:2500]}"
        else:
            req_content = "General Enterprise IT & Services RFP"

        prompt = f"""Target RFP Requirements & Scope:
{req_content}

Bidding Organization Profile (Org Info):
{json.dumps(org_info or {"name": "Enterprise Solutions Provider", "certifications": ["ISO 27001", "SOC 2 Type II"], "core_skills": ["Cloud Architecture", "Full-Stack Development", "Cybersecurity", "DevOps"]}, indent=2)}

Evaluate how well our organization fits these requirements and identify critical gaps."""
        data, provider, model = self.run_inference(
            prompt=prompt,
            system_instruction=GAP_SYSTEM_INSTRUCTION,
            response_schema=GAP_SCHEMA,
            temperature=0.1,
        )
        data["_agent_meta"] = {"agent": self.name, "provider": provider, "model": model}
        return data
