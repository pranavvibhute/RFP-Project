from unittest.mock import MagicMock, patch
from app.services.ai.agents.orchestrator import AgentOrchestrator
from app.services.ai.agents.doc_parsing_agent import DocParsingAgent
from app.services.ai.agents.requirement_agent import RequirementAnalysisAgent
from app.services.ai.agents.risk_compliance_agent import RiskComplianceAgent
from app.services.ai.agents.gap_analysis_agent import GapAnalysisAgent
from app.services.ai.agents.profit_analysis_agent import ProfitAnalysisAgent
from app.services.ai.agents.bid_recommendation_agent import BidRecommendationAgent


def test_specialized_agents_initialization():
    """Verify that each agent is configured with its designated model and provider."""
    doc_agent = DocParsingAgent()
    assert doc_agent.name == "DocParsingAgent"
    assert doc_agent.primary_provider_name == "gemini"

    req_agent = RequirementAnalysisAgent()
    assert req_agent.name == "RequirementAnalysisAgent"
    assert req_agent.primary_provider_name == "qwen"
    assert "qwen" in req_agent.primary_model_name

    risk_agent = RiskComplianceAgent()
    assert risk_agent.name == "RiskComplianceAgent"
    assert risk_agent.primary_provider_name == "deepseek"
    assert "deepseek" in risk_agent.primary_model_name

    gap_agent = GapAnalysisAgent()
    assert gap_agent.name == "GapAnalysisAgent"
    assert gap_agent.primary_provider_name == "gemini"

    profit_agent = ProfitAnalysisAgent()
    assert profit_agent.name == "ProfitAnalysisAgent"
    assert profit_agent.primary_provider_name == "qwen"

    rec_agent = BidRecommendationAgent()
    assert rec_agent.name == "BidRecommendationAgent"
    assert rec_agent.primary_provider_name == "gemini"


def test_agent_orchestrator_pipeline_flow():
    """Verify end-to-end multi-agent pipeline orchestration with mocked inference."""
    orchestrator = AgentOrchestrator()

    mock_doc = {
        "executive_summary": "Test cloud modernization tender for public utilities.",
        "opportunity_summary": "Infrastructure migration contract.",
        "submission_deadline": "October 15, 2026",
        "issuing_organization": "State Power Grid",
    }
    mock_reqs = {
        "requirements": [
            {"category": "Mandatory", "priority": "High", "requirement": "Must hold ISO 27001 certification."},
            {"category": "Technical", "priority": "High", "requirement": "Zero-downtime database migration."},
        ],
        "evaluation_criteria": ["Technical Score (60%)", "Financial Bid (40%)"],
    }
    mock_risks = {
        "overall_risk": "Medium",
        "risks": [
            {"severity": "High", "description": "SLA penalty of 2% per hour of unplanned downtime."},
            {"severity": "Medium", "description": "Tight 45-day delivery schedule."},
        ],
        "important_risks": ["Severe SLA downtime liquidated damages."],
    }
    mock_profit = {
        "budget": "$1,200,000",
        "pricing_model": "Milestone-based Fixed Price",
        "financial_summary": "Healthy margins expected.",
        "financial_risk_level": "Low",
    }
    mock_gap = {
        "matched_capabilities": ["ISO 27001 Certified", "AWS Migration Partner"],
        "critical_gaps": ["Requires additional on-site engineers"],
        "gap_assessment_summary": "Strong capability alignment with minor staffing gap.",
    }
    mock_rec = {
        "bid_recommendation": "Go",
        "recommendation_rationale": "High win probability and strong capability fit.",
        "readiness_score": 88,
        "win_probability_percent": 82,
    }

    with patch.object(orchestrator.doc_agent, "parse", return_value=mock_doc), \
         patch.object(orchestrator.req_agent, "analyze", return_value=mock_reqs), \
         patch.object(orchestrator.risk_agent, "analyze", return_value=mock_risks), \
         patch.object(orchestrator.profit_agent, "analyze", return_value=mock_profit), \
         patch.object(orchestrator.gap_agent, "analyze", return_value=mock_gap), \
         patch.object(orchestrator.rec_agent, "synthesize", return_value=mock_rec):

        analysis, telemetry = orchestrator.run_multi_agent_pipeline(
            filename="sample_tender.pdf",
            document_text="Sample raw text for tender analysis",
        )

        assert analysis.bid_recommendation == "Go"
        assert analysis.budget == "$1,200,000"
        assert analysis.overall_risk == "Medium"
        assert len(analysis.requirements) == 2
        assert analysis.requirements[0].category == "Mandatory"
        assert len(analysis.risks) == 2
        assert "SLA penalty" in analysis.risks[0].description
        assert telemetry["readiness_score"] == 88
        assert telemetry["win_probability_percent"] == 82
