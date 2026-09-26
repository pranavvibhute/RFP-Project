from __future__ import annotations

import time
from typing import Any
from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.ai_analysis import AIAnalysisSchema, RequirementSchema, RiskSchema
from app.services.ai.agents.bid_recommendation_agent import BidRecommendationAgent
from app.services.ai.agents.doc_parsing_agent import DocParsingAgent
from app.services.ai.agents.gap_analysis_agent import GapAnalysisAgent
from app.services.ai.agents.profit_analysis_agent import ProfitAnalysisAgent
from app.services.ai.agents.requirement_agent import RequirementAnalysisAgent
from app.services.ai.agents.risk_compliance_agent import RiskComplianceAgent
from app.services.ai.vector_store import RetrievalHit

logger = get_logger("services.ai.agents.orchestrator")


class AgentOrchestrator:
    """Orchestrates the Heterogeneous Multi-Agent Core with model specialization."""

    def __init__(self) -> None:
        # Task-Specialized Model Allocation across OpenRouter + Google Gemini
        self.doc_agent = DocParsingAgent(primary_provider="gemini", fallback_provider="openrouter")
        self.req_agent = RequirementAnalysisAgent(
            primary_provider="openrouter",
            primary_model="qwen/qwen-2.5-72b-instruct",
            fallback_provider="gemini",
        )
        self.risk_agent = RiskComplianceAgent(
            primary_provider="openrouter",
            primary_model="deepseek/deepseek-chat",
            fallback_provider="gemini",
        )
        self.gap_agent = GapAnalysisAgent(
            primary_provider="gemini",
            fallback_provider="openrouter",
            fallback_model="qwen/qwen-2.5-72b-instruct",
        )
        self.profit_agent = ProfitAnalysisAgent(
            primary_provider="openrouter",
            primary_model="qwen/qwen-2.5-coder-32b-instruct",
            fallback_provider="gemini",
        )
        self.rec_agent = BidRecommendationAgent(
            primary_provider="gemini",
            fallback_provider="openrouter",
            fallback_model="qwen/qwen-2.5-72b-instruct",
        )

    def run_multi_agent_pipeline(
        self,
        *,
        filename: str,
        document_text: str,
        retrieval_hits: list[RetrievalHit] | None = None,
        org_info: dict | None = None,
    ) -> tuple[AIAnalysisSchema, dict[str, Any]]:
        """Executes the multi-agent workflow across specialized models and synthesizes results."""
        start_time = time.perf_counter()
        hits = retrieval_hits or []
        context_str = "\n---\n".join([f"Chunk {h.chunk_index} (Score: {h.score:.2f}): {h.text}" for h in hits])

        agent_telemetry: dict[str, Any] = {}

        logger.info("Starting Multi-Agent Orchestrator pipeline for document: %s", filename)

        import concurrent.futures

        # Concurrently execute all specialized analytical agents in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            future_doc = executor.submit(self.doc_agent.parse, filename, document_text, context_str)
            future_req = executor.submit(self.req_agent.analyze, filename, document_text, context_str)
            future_risk = executor.submit(self.risk_agent.analyze, filename, document_text, context_str)
            future_profit = executor.submit(self.profit_agent.analyze, filename, document_text, context_str)
            future_gap = executor.submit(
                self.gap_agent.analyze,
                None,
                org_info,
                context_str=context_str,
                document_text=document_text,
            )

            doc_data = future_doc.result()
            req_data = future_req.result()
            risk_data = future_risk.result()
            profit_data = future_profit.result()
            gap_data = future_gap.result()

        agent_telemetry["doc_parsing"] = doc_data.get("_agent_meta")
        agent_telemetry["requirement_analysis"] = req_data.get("_agent_meta")
        agent_telemetry["risk_compliance"] = risk_data.get("_agent_meta")
        agent_telemetry["profit_analysis"] = profit_data.get("_agent_meta")
        agent_telemetry["gap_analysis"] = gap_data.get("_agent_meta")

        # Final Synthesis: Bid Recommendation Agent (Gemini)
        rec_data = self.rec_agent.synthesize(
            doc_data=doc_data,
            req_data=req_data,
            risk_data=risk_data,
            gap_data=gap_data,
            profit_data=profit_data,
        )
        agent_telemetry["bid_recommendation"] = rec_data.get("_agent_meta")

        # Build typed RequirementSchema and RiskSchema objects
        requirements: list[RequirementSchema] = []
        for r in req_data.get("requirements", []):
            if isinstance(r, dict):
                requirements.append(
                    RequirementSchema(
                        category=r.get("category", "Technical"),
                        priority=r.get("priority", "Medium"),
                        requirement=r.get("requirement", ""),
                    )
                )

        risks: list[RiskSchema] = []
        for r in risk_data.get("risks", []):
            if isinstance(r, dict):
                risks.append(
                    RiskSchema(
                        severity=r.get("severity", "Medium"),
                        description=r.get("description", ""),
                    )
                )

        # Assemble unified AIAnalysisSchema
        analysis = AIAnalysisSchema(
            executive_summary=doc_data.get("executive_summary", ""),
            submission_deadline=doc_data.get("submission_deadline"),
            budget=profit_data.get("budget"),
            opportunity_summary=doc_data.get("opportunity_summary", ""),
            overall_risk=risk_data.get("overall_risk", "Medium"),
            requirements=requirements,
            evaluation_criteria=req_data.get("evaluation_criteria", []),
            important_risks=risk_data.get("important_risks", []),
            risks=risks,
            issuing_organization=doc_data.get("issuing_organization"),
            bid_recommendation=rec_data.get("bid_recommendation", "Review Required"),
            recommendation_rationale=rec_data.get(
                "recommendation_rationale",
                gap_data.get("gap_assessment_summary", "Multi-agent evaluation completed."),
            ),
        )

        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        agent_telemetry["execution_time_ms"] = elapsed_ms
        agent_telemetry["gap_analysis_summary"] = gap_data.get("gap_assessment_summary")
        agent_telemetry["matched_capabilities"] = gap_data.get("matched_capabilities")
        agent_telemetry["critical_gaps"] = gap_data.get("critical_gaps")
        agent_telemetry["readiness_score"] = rec_data.get("readiness_score", 75)
        agent_telemetry["win_probability_percent"] = rec_data.get("win_probability_percent", 65)

        logger.info(
            "Multi-Agent pipeline completed in %d ms with recommendation: %s",
            elapsed_ms,
            analysis.bid_recommendation,
        )

        return analysis, agent_telemetry


agent_orchestrator = AgentOrchestrator()
