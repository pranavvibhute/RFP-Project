"use client";

import { useState } from "react";
import axios from "axios";
import { 
  Sliders, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  ArrowRight, 
  Plus, 
  X,
  RefreshCw
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface SimulationResult {
  rfp_id: number;
  rfp_title: string;
  baseline: {
    verdict: string;
    readiness_score: number;
    win_probability_percent: number;
    overall_risk: string;
  };
  simulated: {
    verdict: string;
    readiness_score: number;
    win_probability_percent: number;
    overall_risk: string;
  };
  deltas: {
    readiness_delta: string;
    win_probability_delta: string;
    resolved_gaps: string[];
  };
  strategic_narrative: string;
  applied_levers: {
    pricing_adjustment_pct: number;
    pricing_model: string | null;
    cap_sla_penalties: boolean;
    partner_certifications: string[];
    cure_period_days: number;
  };
}

interface WhatIfSimulatorProps {
  rfpId: number;
  rfpTitle: string;
}

const COMMON_PARTNER_CERTS = [
  "FedRAMP High",
  "ISO 27001",
  "CMMI Level 3",
  "Top Secret Facility Clearance",
  "SOC 2 Type II",
  "HIPAA Security Shield",
];

export default function WhatIfSimulator({ rfpId, rfpTitle }: WhatIfSimulatorProps) {
  // Lever States
  const [pricingAdjustment, setPricingAdjustment] = useState<number>(-5);
  const [pricingModel, setPricingModel] = useState<string>("Fixed Price");
  const [capSlaPenalties, setCapSlaPenalties] = useState<boolean>(true);
  const [partnerCerts, setPartnerCerts] = useState<string[]>(["FedRAMP High"]);
  const [newCert, setNewCert] = useState<string>("");
  const [curePeriodDays, setCurePeriodDays] = useState<number>(30);

  // Execution States
  const [simulating, setSimulating] = useState<boolean>(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleCert = (cert: string) => {
    if (partnerCerts.includes(cert)) {
      setPartnerCerts(partnerCerts.filter((c) => c !== cert));
    } else {
      setPartnerCerts([...partnerCerts, cert]);
    }
  };

  const addCustomCert = () => {
    if (newCert.trim() && !partnerCerts.includes(newCert.trim())) {
      setPartnerCerts([...partnerCerts, newCert.trim()]);
      setNewCert("");
    }
  };

  const handleSimulate = async () => {
    setSimulating(true);
    setError(null);

    try {
      const response = await axios.post<SimulationResult>(
        `${API_BASE_URL}/api/v1/rfps/${rfpId}/simulate`,
        {
          pricing_adjustment_pct: Number(pricingAdjustment),
          pricing_model: pricingModel,
          cap_sla_penalties: capSlaPenalties,
          partner_certifications: partnerCerts,
          cure_period_days: Number(curePeriodDays),
        }
      );
      setResult(response.data);
    } catch (err: any) {
      console.error("Simulation error:", err);
      setError(
        err.response?.data?.detail || "Failed to execute What-If simulation. Please check RFP status."
      );
    } finally {
      setSimulating(false);
    }
  };

  const getVerdictBadge = (verdict: string) => {
    const v = (verdict || "").toLowerCase();
    if (v.includes("go") && !v.includes("no")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>GO (BID)</span>
        </span>
      );
    } else if (v.includes("no")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>NO-GO</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>REVIEW REQUIRED</span>
        </span>
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <Sliders className="w-4 h-4 text-[#c8102e]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>What-If Bidding Scenario Simulator</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-50 text-[#c8102e] border border-rose-100 lowercase">
                real-time
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Simulate price sensitivity, partner teaming arrangements, and contractual risk caps to optimize your bid win chance.
            </p>
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#c8102e] hover:bg-[#a00c24] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
        >
          {simulating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{simulating ? "Simulating Scenario..." : "Run What-If Simulation"}</span>
        </button>
      </div>

      {/* Levers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
        {/* Lever 1: Pricing Adjustment */}
        <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Commercial Price</span>
            </span>
            <span
              className={`font-black text-[11px] px-2 py-0.5 rounded ${
                pricingAdjustment < 0
                  ? "bg-emerald-100 text-emerald-800"
                  : pricingAdjustment > 0
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {pricingAdjustment > 0 ? `+${pricingAdjustment}%` : `${pricingAdjustment}%`}
            </span>
          </div>
          <input
            type="range"
            min="-20"
            max="20"
            step="1"
            value={pricingAdjustment}
            onChange={(e) => setPricingAdjustment(Number(e.target.value))}
            className="w-full accent-[#c8102e] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
            <span>-20% (Aggressive)</span>
            <span>+20% (Margin)</span>
          </div>
        </div>

        {/* Lever 2: Pricing Structure */}
        <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Contract Structure</span>
          </span>
          <select
            value={pricingModel}
            onChange={(e) => setPricingModel(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#c8102e]"
          >
            <option value="Fixed Price">Firm Fixed-Price (FFP)</option>
            <option value="Time & Materials">Time & Materials (T&M)</option>
            <option value="Milestone-Based">Milestone-Based Performance</option>
            <option value="Cost-Plus-Incentive">Cost-Plus-Incentive-Fee</option>
          </select>
          <span className="text-[10px] text-slate-400 block font-medium">Mitigates customer budget variance</span>
        </div>

        {/* Lever 3: SLA Penalty Cap */}
        <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span>SLA Liability Ceiling</span>
          </span>
          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={capSlaPenalties}
              onChange={(e) => setCapSlaPenalties(e.target.checked)}
              className="w-4 h-4 accent-[#c8102e] rounded cursor-pointer"
            />
            <span className="text-[11px] font-bold text-slate-800">
              Cap damages at 5% of TCV
            </span>
          </label>
          <span className="text-[10px] text-slate-400 block font-medium">
            Waiver neutralizes uncapped liquidated damages
          </span>
        </div>

        {/* Lever 4: Contract Cure Period */}
        <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">Remedy Cure Period</span>
            <span className="font-black text-[11px] text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
              {curePeriodDays} Days
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1 pt-1">
            {[15, 30, 45, 60].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setCurePeriodDays(days)}
                className={`py-1 text-[10px] font-bold rounded transition ${
                  curePeriodDays === days
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400 block font-medium">Negotiated compliance remedy cushion</span>
        </div>
      </div>

      {/* Subcontractor & Teaming Partner Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#c8102e]" />
            <span>Subcontractor Teaming Partners (Resolve Critical Compliance Gaps)</span>
          </label>
          <span className="text-[10px] text-slate-400 font-medium">
            Each partner certification provides +10 Readiness pts
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {COMMON_PARTNER_CERTS.map((cert) => {
            const isSelected = partnerCerts.includes(cert);
            return (
              <button
                key={cert}
                type="button"
                onClick={() => toggleCert(cert)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {isSelected ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Plus className="w-3 h-3 text-slate-400" />}
                <span>{cert}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Partner Cert Input */}
        <div className="flex gap-2 max-w-md pt-1">
          <input
            type="text"
            value={newCert}
            onChange={(e) => setNewCert(e.target.value)}
            placeholder="Add custom teaming partner cert..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#c8102e]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomCert();
              }
            }}
          />
          <button
            type="button"
            onClick={addCustomCert}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
          >
            Add Partner
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
          <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Simulation Results Panel */}
      {result && (
        <div className="space-y-4 pt-4 border-t border-slate-100 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#c8102e]" />
              <span>Simulation Outcome Analysis</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              Opportunity: {result.rfp_title}
            </span>
          </div>

          {/* Comparison Cards: Baseline vs Simulated */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Baseline Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Baseline (Original RFP)
                </span>
                {getVerdictBadge(result.baseline.verdict)}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Readiness</span>
                  <span className="text-lg font-black text-slate-800">
                    {result.baseline.readiness_score}
                  </span>
                  <span className="text-[10px] text-slate-400">/100</span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Win Probability</span>
                  <span className="text-lg font-black text-slate-800">
                    {result.baseline.win_probability_percent}%
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Risk Level</span>
                  <span className={`text-xs font-black uppercase mt-1 block ${
                    result.baseline.overall_risk.toLowerCase() === "high" ? "text-rose-600" : "text-amber-600"
                  }`}>
                    {result.baseline.overall_risk}
                  </span>
                </div>
              </div>
            </div>

            {/* Simulated Outcome Card */}
            <div className="p-4 bg-gradient-to-br from-emerald-50/60 via-slate-50 to-white rounded-2xl border-2 border-emerald-500/30 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider">
                    Simulated Scenario Outcome
                  </span>
                </div>
                {getVerdictBadge(result.simulated.verdict)}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2.5 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Readiness</span>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-lg font-black text-slate-900">
                      {result.simulated.readiness_score}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">
                      ({result.deltas.readiness_delta})
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Win Probability</span>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-lg font-black text-slate-900">
                      {result.simulated.win_probability_percent}%
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">
                      ({result.deltas.win_probability_delta})
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Risk Level</span>
                  <span className="text-xs font-black text-emerald-700 uppercase mt-1 block">
                    {result.simulated.overall_risk}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Resolved Gaps Badges */}
          {result.deltas.resolved_gaps && result.deltas.resolved_gaps.length > 0 && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1.5">
              <span className="text-[11px] font-black text-emerald-900 uppercase tracking-wider block">
                Contractual Risks & Gaps Resolved ({result.deltas.resolved_gaps.length}):
              </span>
              <ul className="space-y-1 text-xs text-emerald-800 font-medium">
                {result.deltas.resolved_gaps.map((gap, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strategic Executive AI Narrative */}
          {result.strategic_narrative && (
            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  AI Bid Simulation Strategy Memo
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-200 font-medium italic">
                &ldquo;{result.strategic_narrative}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
