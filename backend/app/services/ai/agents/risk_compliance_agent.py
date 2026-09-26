from __future__ import annotations

from typing import Any
from app.services.ai.agents.base_agent import BaseAgent

RISK_SYSTEM_INSTRUCTION = """You are the Risk & Compliance Agent for BidWise AI.
You perform deep deductive analysis on RFP contracts, with special focus on:
1. SLA Penalties, Liquidated Damages, Service Credits, and breach liabilities.
2. Compliance obligations (ISO 27001, SOC 2, HIPAA, GDPR, security clearances).
3. Ambiguous project scopes, unrealistic delivery timelines, and financial bonding requirements.
Assign severity levels ('High', 'Medium', 'Low') and evaluate the overall risk score ('Low', 'Medium', 'High').
Return valid JSON matching the schema."""

RISK_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "overall_risk": {"type": "STRING", "description": "Overall risk level: Low, Medium, or High"},
        "risks": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "severity": {"type": "STRING", "description": "High, Medium, or Low"},
                    "description": {"type": "STRING", "description": "Concise explanation of the risk, penalty, or compliance trap"}
                },
                "required": ["severity", "description"]
            }
        },
        "important_risks": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Top key bullet points of most critical risks for quick executive review"
        }
    },
    "required": ["overall_risk", "risks"]
}


class RiskComplianceAgent(BaseAgent):
    """Specialized agent powered by DeepSeek-R1 / Qwen Reasoning for legal risks & SLA penalties."""

    def __init__(
        self,
        primary_provider: str = "deepseek",
        primary_model: str | None = "deepseek/deepseek-r1",
        fallback_provider: str = "gemini",
    ) -> None:
        super().__init__(
            name="RiskComplianceAgent",
            primary_provider=primary_provider,
            primary_model=primary_model,
            fallback_provider=fallback_provider,
        )

    def analyze(self, filename: str, document_text: str, context_chunks: str = "") -> dict[str, Any]:
        prompt = f"""RFP Document: {filename}

Context / Key Excerpts:
{context_chunks if context_chunks else document_text[:15000]}

Analyze all contract risks, SLA penalties, liquidated damages, compliance benchmarks, and liabilities."""
        data, provider, model = self.run_inference(
            prompt=prompt,
            system_instruction=RISK_SYSTEM_INSTRUCTION,
            response_schema=RISK_SCHEMA,
            temperature=0.1,
        )
        data["_agent_meta"] = {"agent": self.name, "provider": provider, "model": model}
        return data
