from __future__ import annotations

from typing import Any
from app.services.ai.agents.base_agent import BaseAgent

PROFIT_SYSTEM_INSTRUCTION = """You are the Profit & Financial Analysis Agent for BidWise AI.
You examine RFP documents for financial scope:
1. Estimated contract value, allocated budgets, or ceiling prices.
2. Pricing models (Time & Materials, Fixed Price, Milestone-based).
3. Financial risks, bonding requirements (Bid Bond / Performance Guarantee), or payment milestones.
Return valid JSON matching the schema."""

PROFIT_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "budget": {"type": "STRING", "description": "Extracted budget, estimated contract value, or 'Not Specified'"},
        "pricing_model": {"type": "STRING", "description": "e.g. Fixed Price, T&M, Milestone-based, Cost-plus"},
        "financial_summary": {"type": "STRING", "description": "Financial evaluation and margin feasibility statement"},
        "financial_risk_level": {"type": "STRING", "description": "Low, Medium, or High"}
    },
    "required": ["budget", "financial_summary"]
}


class ProfitAnalysisAgent(BaseAgent):
    """Specialized agent powered by Qwen 2.5 Coder / Math for budget & financial margin analysis."""

    def __init__(
        self,
        primary_provider: str = "qwen",
        primary_model: str | None = "qwen/qwen-2.5-coder-32b-instruct",
        fallback_provider: str = "gemini",
    ) -> None:
        super().__init__(
            name="ProfitAnalysisAgent",
            primary_provider=primary_provider,
            primary_model=primary_model,
            fallback_provider=fallback_provider,
        )

    def analyze(self, filename: str, document_text: str, context_chunks: str = "") -> dict[str, Any]:
        prompt = f"""RFP Document: {filename}

Context / Key Excerpts:
{context_chunks if context_chunks else document_text[:15000]}

Extract project budget, pricing terms, payment terms, and financial risk."""
        data, provider, model = self.run_inference(
            prompt=prompt,
            system_instruction=PROFIT_SYSTEM_INSTRUCTION,
            response_schema=PROFIT_SCHEMA,
            temperature=0.1,
        )
        data["_agent_meta"] = {"agent": self.name, "provider": provider, "model": model}
        return data
