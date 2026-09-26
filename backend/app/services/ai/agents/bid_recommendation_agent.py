from __future__ import annotations

import json
from typing import Any
from app.services.ai.agents.base_agent import BaseAgent

RECOMMENDATION_SYSTEM_INSTRUCTION = """You are the Bid Recommendation Agent for BidWise AI.
You synthesize the findings of the specialized agents:
- Doc Parsing
- Requirement Analysis
- Risk & Compliance (including SLA penalties)
- Gap Analysis (organizational strengths vs gaps)
- Profit & Financial Analysis

Provide an executive Go / No-Go decision:
- 'bid_recommendation': Must be exactly one of: 'Go', 'No-Go', or 'Review Required'.
- 'recommendation_rationale': 3-4 sentence justification for bid leadership.
- 'readiness_score': Numerical readiness score between 0 and 100 based on capability fit and risk profile.
- 'win_probability_percent': Estimated win probability percentage (0-100).
Return valid JSON matching the schema."""

RECOMMENDATION_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "bid_recommendation": {
            "type": "STRING",
            "description": "Must be exactly 'Go', 'No-Go', or 'Review Required'"
        },
        "recommendation_rationale": {
            "type": "STRING",
            "description": "Justification balancing profitability, capability fit, and penalty risks"
        },
        "readiness_score": {
            "type": "INTEGER",
            "description": "Composite readiness score 0 to 100"
        },
        "win_probability_percent": {
            "type": "INTEGER",
            "description": "Estimated win probability percentage 0 to 100"
        }
    },
    "required": ["bid_recommendation", "recommendation_rationale", "readiness_score"]
}


class BidRecommendationAgent(BaseAgent):
    """Specialized agent powered by Google Gemini 2.5 Flash for final Go/No-Go proposal synthesis."""

    def __init__(
        self,
        primary_provider: str = "gemini",
        primary_model: str | None = None,
        fallback_provider: str = "openrouter",
        fallback_model: str | None = None,
    ) -> None:
        super().__init__(
            name="BidRecommendationAgent",
            primary_provider=primary_provider,
            primary_model=primary_model,
            fallback_provider=fallback_provider,
            fallback_model=fallback_model,
        )

    def synthesize(
        self,
        *,
        doc_data: dict,
        req_data: dict,
        risk_data: dict,
        gap_data: dict,
        profit_data: dict,
    ) -> dict[str, Any]:
        synthesis_input = {
            "project_overview": doc_data.get("executive_summary"),
            "deadline": doc_data.get("submission_deadline"),
            "total_requirements": len(req_data.get("requirements", [])),
            "sample_requirements": req_data.get("requirements", [])[:6],
            "overall_risk": risk_data.get("overall_risk"),
            "risks_summary": risk_data.get("important_risks") or [r.get("description") for r in risk_data.get("risks", [])[:3]],
            "critical_gaps": gap_data.get("critical_gaps"),
            "budget": profit_data.get("budget"),
            "pricing_model": profit_data.get("pricing_model"),
        }

        prompt = f"""Synthesize the multi-agent findings for this RFP opportunity:
{json.dumps(synthesis_input, indent=2)}

Generate the final executive Bid Recommendation ('Go', 'No-Go', or 'Review Required') and scoring rationale."""

        data, provider, model = self.run_inference(
            prompt=prompt,
            system_instruction=RECOMMENDATION_SYSTEM_INSTRUCTION,
            response_schema=RECOMMENDATION_SCHEMA,
            temperature=0.1,
        )
        data["_agent_meta"] = {"agent": self.name, "provider": provider, "model": model}
        return data
