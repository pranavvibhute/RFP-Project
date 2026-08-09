"use client";

import { useEffect, useState, use } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  FileText, 
  Clock, 
  DollarSign, 
  ShieldAlert, 
  CheckCircle2, 
  Download, 
  ArrowLeft,
  Loader2,
  Sparkles,
  Target,
  XCircle,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Requirement {
  id: number;
  category: string;
  priority: string;
  requirement_text: string;
  status: string;
}

interface RFPDetail {
  id: number;
  title: string;
  customer_name: string;
  file_name: string;
  status: string;
  created_at: string;
  analysis?: {
    executive_summary: string;
    opportunity_summary: string;
    submission_deadline?: string;
    budget?: string;
    overall_risk_score: string;
    confidence_score: number;
    bid_recommendation?: string;
    recommendation_rationale?: string;
  };
  requirements: Requirement[];
}

export default function RFPDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const rfpId = resolvedParams.id;
  const [rfp, setRfp] = useState<RFPDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get<RFPDetail>(`${API_BASE_URL}/api/v1/rfps/${rfpId}`)
      .then((res) => setRfp(res.data))
      .catch((err) => console.error("Failed to load RFP detail:", err))
      .finally(() => setLoading(false));
  }, [rfpId]);

  const handleStatusChange = async (reqId: number, newStatus: string) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/v1/requirements/${reqId}/compliance`, {
        status: newStatus,
      });
      if (rfp) {
        const updatedReqs = rfp.requirements.map((r) =>
          r.id === reqId ? { ...r, status: newStatus } : r
        );
        setRfp({ ...rfp, requirements: updatedReqs });
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#c8102e]" />
          <span>Loading RFP analysis details from database...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!rfp) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-xs text-slate-500 space-y-3">
          <p>RFP document #{rfpId} not found in database.</p>
          <Link href="/rfps" className="inline-flex items-center gap-1 font-bold text-[#c8102e]">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to RFPs</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Back Link & Header */}
        <div className="flex items-center justify-between">
          <Link href="/rfps" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#c8102e] transition">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to RFPs List</span>
          </Link>

          <div className="flex items-center gap-3">
            <a
              href={`${API_BASE_URL}/api/v1/reports/pdf/${rfp.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF Report</span>
            </a>
            <a
              href={`${API_BASE_URL}/api/v1/reports/excel/${rfp.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel Matrix</span>
            </a>
          </div>
        </div>

        {/* Title Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
              {rfp.status}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
              (rfp.analysis?.overall_risk_score || "").toLowerCase() === "high"
                ? "bg-rose-100 text-rose-700"
                : "bg-emerald-100 text-emerald-700"
            }`}>
              {rfp.analysis?.overall_risk_score || "Medium"} Risk
            </span>
          </div>

          <h1 className="text-xl font-black text-slate-900 tracking-tight">{rfp.title}</h1>
          <p className="text-xs text-slate-500 font-medium">Customer: <span className="font-bold text-slate-800">{rfp.customer_name || "Enterprise"}</span> | File: <span className="font-mono text-slate-600">{rfp.file_name}</span></p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
              <Clock className="w-4 h-4 text-[#c8102e]" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Deadline</span>
                <div className="font-bold text-slate-800">{rfp.analysis?.submission_deadline || "TBD"}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Estimated Budget</span>
                <div className="font-bold text-slate-800">{rfp.analysis?.budget || "TBD"}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
              <Sparkles className="w-4 h-4 text-[#c8102e]" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">AI Confidence Score</span>
                <div className="font-bold text-slate-800">{int((rfp.analysis?.confidence_score || 0.95) * 100)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Bid / No-Bid Decision Recommendation Card */}
        {rfp.analysis && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Target className="w-4 h-4 text-[#c8102e]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">AI Bid / No-Bid Recommendation</h3>
                  <p className="text-[11px] text-slate-400">Automated Opportunity & Go/No-Go Decision Synthesis</p>
                </div>
              </div>

              {(() => {
                const rec = (rfp.analysis.bid_recommendation || "Go").toLowerCase();
                if (rec.includes("go") && !rec.includes("no")) {
                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>RECOMMENDATION: BID (GO)</span>
                    </span>
                  );
                } else if (rec.includes("no")) {
                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>RECOMMENDATION: NO-BID (NO-GO)</span>
                    </span>
                  );
                } else {
                  return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-100 text-amber-800 border border-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>RECOMMENDATION: REVIEW REQUIRED</span>
                    </span>
                  );
                }
              })()}
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {rfp.analysis.recommendation_rationale || "This RFP matches key enterprise criteria. Strategic decision analysis recommends proceeding with bid submission based on estimated budget and timeline capability."}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Budget Alignment</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{rfp.analysis.budget ? "Specified" : "TBD / Flexible"}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Risk Evaluation</span>
                <p className={`text-xs font-bold mt-0.5 ${
                  (rfp.analysis.overall_risk_score || "").toLowerCase() === "high" ? "text-rose-600" : "text-emerald-600"
                }`}>
                  {rfp.analysis.overall_risk_score || "Medium"} Risk
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Timeline Feasibility</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{rfp.analysis.submission_deadline || "Feasible"}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Requirements Count</span>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{rfp.requirements.length} Specifications</p>
              </div>
            </div>
          </div>
        )}

        {/* Executive Summary */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Executive Summary</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {rfp.analysis?.executive_summary || "No executive summary available."}
          </p>
        </div>

        {/* Requirements Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Extracted Requirements ({rfp.requirements.length})
            </h3>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                <th className="p-3">Category</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Requirement Specification</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rfp.requirements.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-bold text-slate-800">{req.category}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      (req.priority || "").toLowerCase() === "high" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"
                    }`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 font-medium">{req.requirement_text}</td>
                  <td className="p-3">
                    <select
                      value={req.status || "Verified Compliant"}
                      onChange={(e) => handleStatusChange(req.id, e.target.value)}
                      className={`text-[10px] font-bold px-2 py-1 rounded border focus:outline-none transition cursor-pointer ${
                        req.status === "Verified Compliant"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                          : req.status === "Non-Compliant"
                          ? "text-rose-700 bg-rose-50 border-rose-200"
                          : "text-amber-700 bg-amber-50 border-amber-200"
                      }`}
                    >
                      <option value="Verified Compliant">Verified Compliant</option>
                      <option value="Review Required">Review Required</option>
                      <option value="Non-Compliant">Non-Compliant</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function int(val: number): number {
  return Math.round(val);
}
