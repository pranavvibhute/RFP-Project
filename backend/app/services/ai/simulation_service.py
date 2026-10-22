from __future__ import annotations

import json
from typing import Any
from pydantic import BaseModel, Field

from app.models.rfp import RFP
from app.models.analysis import Analysis
from app.services.ai.client import gemini_client
from app.core.logging import get_logger

logger = get_logger("services.ai.simulation")


class SimulationRequest(BaseModel):
    pricing_adjustment_pct: float = Field(default=0.0, description="Price discount/premium percentage (-20 to +20)")
    pricing_model: str | None = Field(default=None, description="Proposed pricing structure (e.g. Fixed Price, T&M)")
    cap_sla_penalties: bool = Field(default=False, description="Cap liquidated damages and SLA penalties at 5% ceiling")
    partner_certifications: list[str] = Field(default_factory=list, description="Subcontracting partner certifications to resolve gaps")
    cure_period_days: int = Field(default=30, description="Negotiated contractual cure period for breach remedies")


class SimulationService:
    """Evaluates What-If bidding scenarios, partner teaming, and risk mitigations."""

    def run_simulation(
        self,
        *,
        rfp: RFP,
        analysis: Analysis,
        simulation: SimulationRequest,
        org_info: dict | None = None,
    ) -> dict[str, Any]:
        raw_response = analysis.raw_response if analysis and isinstance(analysis.raw_response, dict) else {}
        telemetry = raw_response.get("telemetry", {})
        analysis_data = raw_response.get("analysis", {})

        # Baseline metrics
        baseline_verdict = (
            telemetry.get("bid_recommendation")
            or analysis_data.get("bid_recommendation")
            or "Review Required"
        )
        baseline_readiness = int(
            telemetry.get("readiness_score")
            or (analysis.confidence_score * 100 if analysis and analysis.confidence_score else 72)
        )
        baseline_win_prob = int(
            telemetry.get("win_probability_percent")
            or (65 if baseline_verdict == "Go" else 55)
        )
        baseline_risk = analysis.overall_risk_score if analysis else "Medium"
        critical_gaps = telemetry.get("critical_gaps", [])

        # 1. Calculate Readiness Delta
        sim_readiness = float(baseline_readiness)
        resolved_gaps = []

        # Check partner certifications against critical gaps
        for cert in simulation.partner_certifications:
            sim_readiness += 10.0
            resolved_gaps.append(f"Teaming partner covers requirement: {cert}")

        # Check SLA risk waiver / liability cap
        if simulation.cap_sla_penalties:
            sim_readiness += 12.0
            resolved_gaps.append("Liquidated damages successfully capped at 5% of total contract value")

        # Cure period cushion
        if simulation.cure_period_days >= 30:
            sim_readiness += 3.0

        sim_readiness = max(10, min(99, int(round(sim_readiness))))

        # 2. Calculate Win Probability Delta
        sim_win_prob = float(baseline_win_prob)

        # Price sensitivity curve: discounting price raises win probability
        # E.g. -10% discount -> +8% win chance
        if simulation.pricing_adjustment_pct < 0:
            price_bonus = abs(simulation.pricing_adjustment_pct) * 0.8
            sim_win_prob += price_bonus
        elif simulation.pricing_adjustment_pct > 0:
            price_penalty = simulation.pricing_adjustment_pct * 0.6
            sim_win_prob -= price_penalty

        # Partner bonus for certifications
        if simulation.partner_certifications:
            sim_win_prob += min(15.0, len(simulation.partner_certifications) * 5.0)

        if simulation.cap_sla_penalties:
            sim_win_prob += 4.0

        sim_win_prob = max(10, min(98, int(round(sim_win_prob))))

        # 3. Compute Simulated Recommendation
        if sim_readiness >= 80 and sim_win_prob >= 68:
            sim_verdict = "Go"
        elif sim_readiness >= 65 and sim_win_prob >= 50:
            sim_verdict = "Review Required"
        else:
            sim_verdict = "No-Go"

        sim_risk = "Low" if (simulation.cap_sla_penalties and baseline_risk != "High") else ("Medium" if simulation.cap_sla_penalties else baseline_risk)

        # 4. Generate AI Strategic Narrative via Gemini Flash
        prompt = f"""You are the Executive Bid Simulation Strategist for BidWise AI.
Analyze this What-If bidding scenario comparison for the opportunity: "{rfp.title}"

Current Baseline State:
- Decision: {baseline_verdict}
- Readiness Score: {baseline_readiness}/100
- Win Probability: {baseline_win_prob}%
- Overall Contract Risk: {baseline_risk}
- Critical Gaps: {json.dumps(critical_gaps)}

What-If Simulation Levers Applied by Bid Leadership:
- Commercial Price Adjustment: {simulation.pricing_adjustment_pct:+.1f}%
- Proposed Pricing Model: {simulation.pricing_model or 'Unchanged'}
- SLA Penalty Capped at 5%: {'Yes' if simulation.cap_sla_penalties else 'No'}
- Partner Certifications Added: {json.dumps(simulation.partner_certifications)}
- Breach Cure Period: {simulation.cure_period_days} days

Simulated Outcome:
- New Simulated Decision: {sim_verdict}
- New Readiness Score: {sim_readiness}/100 (Change: {sim_readiness - baseline_readiness:+d})
- New Win Probability: {sim_win_prob}% (Change: {sim_win_prob - baseline_win_prob:+d}%)
- Simulated Risk Level: {sim_risk}

Write exactly 2-3 concise, professional sentences explaining the strategic impact of this simulation and actionable advice for the proposal team."""

        try:
            response = gemini_client.generate(prompt=prompt)
            narrative = response.text.strip() if response.text else ""
        except Exception as exc:
            logger.warning("Simulation narrative AI generation fallback: %s", exc)
            narrative = (
                f"Applying a {simulation.pricing_adjustment_pct:+.1f}% commercial price adjustment combined with partner teaming "
                f"resolves {len(resolved_gaps)} risk factors, elevating the Readiness Score by {sim_readiness - baseline_readiness:+d} points "
                f"and transitioning the opportunity to a {sim_verdict} decision."
            )

        return {
            "rfp_id": rfp.id,
            "rfp_title": rfp.title,
            "baseline": {
                "verdict": baseline_verdict,
                "readiness_score": baseline_readiness,
                "win_probability_percent": baseline_win_prob,
                "overall_risk": baseline_risk,
            },
            "simulated": {
                "verdict": sim_verdict,
                "readiness_score": sim_readiness,
                "win_probability_percent": sim_win_prob,
                "overall_risk": sim_risk,
            },
            "deltas": {
                "readiness_delta": f"{sim_readiness - baseline_readiness:+d}",
                "win_probability_delta": f"{sim_win_prob - baseline_win_prob:+d}%",
                "resolved_gaps": resolved_gaps,
            },
            "strategic_narrative": narrative,
            "applied_levers": simulation.model_dump(),
        }


simulation_service = SimulationService()
