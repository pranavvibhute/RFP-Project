"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import axios from "axios";
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  Target,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Building2,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface RequirementItem {
  category: string;
  priority: string;
  requirement_text: string;
}

interface RFPHistoryItem {
  id: number;
  title: string;
  created_at: string;
  status: string;
  risk_score: string;
  budget: string;
  submission_deadline: string;
}

interface RadarPoint {
  subject: string;
  value: number;
  fullMark: number;
}

interface BreakdownItem {
  category: string;
  count: number;
}

interface CustomerDetail {
  customer_name: string;
  segment: string;
  industry: string;
  total_rfps: number;
  total_opportunity_value: string;
  overall_risk_profile: string;
  win_propensity_score: number;
  compliance_strictness: string;
  engagement_trend: string;
  ai_win_strategy: string;
  rfps: RFPHistoryItem[];
  top_demanded_requirements: RequirementItem[];
  requirement_breakdown: BreakdownItem[];
  priority_breakdown: Record<string, number>;
  risk_radar: RadarPoint[];
  reputation_profile?: {
    summary: string;
    citations: Array<{ title: string; uri: string }>;
  };
}

const segmentColors: Record<string, string> = {
  Government: "bg-blue-100 text-blue-700 border-blue-200",
  "Financial Services": "bg-emerald-100 text-emerald-700 border-emerald-200",
  Healthcare: "bg-violet-100 text-violet-700 border-violet-200",
  "Enterprise Tech": "bg-amber-100 text-amber-700 border-amber-200",
  Enterprise: "bg-slate-100 text-slate-700 border-slate-200",
};

const riskColors: Record<string, { bg: string; text: string; badge: string }> = {
  High: { bg: "bg-rose-50", text: "text-rose-700", badge: "bg-rose-100 text-rose-700" },
  Medium: { bg: "bg-amber-50", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  Low: { bg: "bg-emerald-50", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
};

const BAR_COLORS = ["#c8102e", "#111625", "#64748b", "#94a3b8", "#cbd5e1", "#e2e8f0"];

function WinScoreGauge({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 85 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} strokeWidth="10" stroke="#e2e8f0" fill="none" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          strokeWidth="10"
          stroke={color}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s ease-in-out" }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-3xl font-black text-slate-900 leading-none">{score}</span>
        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Win Score</p>
      </div>
    </div>
  );
}

function AiStrategyBullet({ text }: { text: string }) {
  const bullets = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("•") || line.startsWith("-") || line.match(/^\d+\./));

  if (bullets.length === 0) {
    // Fallback: split by period or show as-is
    return <p className="text-sm text-slate-700 leading-relaxed">{text}</p>;
  }

  return (
    <ul className="space-y-3">
      {bullets.map((bullet, i) => {
        const clean = bullet.replace(/^[•\-\d+\.]\s*/, "").trim();
        return (
          <li key={i} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-[#c8102e]/10 text-[#c8102e] flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
              {i + 1}
            </span>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">{clean}</p>
          </li>
        );
      })}
    </ul>
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const rawName = params?.name as string;
  const customerName = decodeURIComponent(rawName || "");

  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!customerName) return;
    axios
      .get<CustomerDetail>(`${API_BASE_URL}/api/v1/customers/${encodeURIComponent(customerName)}`)
      .then((res) => setDetail(res.data))
      .catch((err) => {
        console.error("Failed to load customer detail:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [customerName]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#c8102e]" />
          <p className="text-sm text-slate-500 font-medium">Loading customer intelligence...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !detail) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <AlertTriangle className="w-10 h-10 text-rose-400" />
          <p className="text-sm font-bold text-slate-700">Failed to load customer profile</p>
          <Link href="/customers" className="text-xs text-[#c8102e] hover:underline font-semibold">
            ← Back to Customer Intelligence
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const risk = riskColors[detail.overall_risk_profile] || riskColors["Medium"];
  const segColor = segmentColors[detail.segment] || segmentColors["Enterprise"];

  const kpis = [
    {
      label: "Total RFPs",
      value: detail.total_rfps.toString(),
      icon: FileText,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Pipeline Value",
      value: detail.total_opportunity_value,
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Risk Profile",
      value: detail.overall_risk_profile,
      icon: ShieldAlert,
      color: `${risk.text} ${risk.bg}`,
    },
    {
      label: "Engagement",
      value: detail.engagement_trend,
      icon: TrendingUp,
      color: "text-violet-600 bg-violet-50",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Link href="/customers" className="hover:text-[#c8102e] transition flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Customer Intelligence
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-700 font-semibold truncate max-w-64">{detail.customer_name}</span>
        </div>

        {/* Hero Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#111625] to-[#1e2d4a] p-6 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${segColor}`}>
                    {detail.segment}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300 border border-white/20">
                    {detail.compliance_strictness} Compliance
                  </span>
                </div>
                <h1 className="text-2xl font-black text-white leading-tight">{detail.customer_name}</h1>
                <p className="text-slate-400 text-sm font-medium mt-1 flex items-center gap-2">
                  <Building2 className="w-4 h-4 shrink-0" />
                  {detail.industry}
                </p>
              </div>
              <WinScoreGauge score={detail.win_propensity_score} />
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="p-5 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${kpi.color}`}>
                    <Icon className="w-4.5 h-4.5 w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{kpi.label}</p>
                    <p className="text-sm font-black text-slate-900">{kpi.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Win Strategy */}
        <div className="bg-gradient-to-br from-[#111625] to-[#1a2340] rounded-2xl p-6 border border-slate-700/50 shadow-lg">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-[#c8102e] flex items-center justify-center shadow-lg shadow-red-900/40">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AI-Generated Win Strategy</h2>
              <p className="text-[11px] text-slate-400">Powered by Gemini · Tailored for {detail.customer_name}</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <ul className="space-y-4">
              {(() => {
                const bullets = detail.ai_win_strategy
                  .split("\n")
                  .map((l) => l.trim())
                  .filter((l) => l.length > 2);
                return bullets.map((line, i) => {
                  const clean = line.replace(/^[•\-\d+\.\s]+/, "").trim();
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#c8102e] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-200 leading-relaxed font-medium">{clean}</p>
                    </li>
                  );
                });
              })()}
            </ul>
          </div>
        </div>

        {/* Customer Background & Market Reputation (Google Search) */}
        {detail.reputation_profile && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Activity className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Customer Background & Market Reputation</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Live Research Grounded via Google Search</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700">
                Live Grounding
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {(() => {
                const paragraphs = detail.reputation_profile.summary.split("\n\n");
                const defaultHeaders = [
                  "Background & Market Standing",
                  "Recent News & Performance",
                  "Vendor & Client Reputation"
                ];
                return defaultHeaders.map((header, idx) => {
                  let content = paragraphs[idx] || "No research data available.";
                  // Strip header prefixes like "**Background & Market Standing**"
                  content = content.replace(/^\*\*.*?\*\*\s*\n*/, "").trim();
                  return (
                    <div key={header} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{header}</h4>
                      <p className="text-xs text-slate-700 leading-relaxed font-normal">{content}</p>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Citations list */}
            {detail.reputation_profile.citations && detail.reputation_profile.citations.length > 0 && (
              <div className="pt-2 flex flex-wrap items-center gap-2 text-[10px] font-medium text-slate-400 border-t border-slate-100/50">
                <span className="uppercase tracking-wide font-bold">Research Sources:</span>
                {detail.reputation_profile.citations.map((cite, i) => (
                  <a
                    key={i}
                    href={cite.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline bg-blue-50 px-2 py-0.5 rounded border border-blue-100"
                  >
                    <span>{cite.title}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Requirements Breakdown Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#c8102e]/10 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-[#c8102e]" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Requirements Breakdown</h3>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={detail.requirement_breakdown}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                    {detail.requirement_breakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk Radar Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Risk Radar</h3>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={detail.risk_radar} cx="50%" cy="50%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <Radar
                    name="Risk"
                    dataKey="value"
                    stroke="#c8102e"
                    fill="#c8102e"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Requirements */}
        {detail.top_demanded_requirements.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-violet-50 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Top Demanded Requirements</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {detail.top_demanded_requirements.map((req, i) => {
                const priorityColors: Record<string, string> = {
                  High: "bg-rose-100 text-rose-700",
                  Medium: "bg-amber-100 text-amber-700",
                  Low: "bg-emerald-100 text-emerald-700",
                  Mandatory: "bg-[#c8102e]/10 text-[#c8102e]",
                };
                const pColor = priorityColors[req.priority] || "bg-slate-100 text-slate-600";
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#c8102e] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{req.category}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${pColor}`}>
                          {req.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-snug line-clamp-2">
                        {req.requirement_text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RFP History Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">RFP History</h3>
          </div>
          {detail.rfps.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No RFPs found for this customer.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4">RFP Title</th>
                    <th className="p-4">Upload Date</th>
                    <th className="p-4">Deadline</th>
                    <th className="p-4">Est. Budget</th>
                    <th className="p-4">Risk</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {detail.rfps.map((rfp) => {
                    const rfpRisk = riskColors[rfp.risk_score] || riskColors["Medium"];
                    return (
                      <tr key={rfp.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4 font-semibold text-slate-800 max-w-48 truncate">{rfp.title}</td>
                        <td className="p-4 text-slate-500 font-medium">{rfp.created_at}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-slate-700 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-[#c8102e]" />
                            <span>{rfp.submission_deadline || "TBD"}</span>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-900">{rfp.budget || "TBD"}</td>
                        <td className="p-4">
                          {rfp.risk_score && rfp.risk_score !== "N/A" ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rfpRisk.badge}`}>
                              {rfp.risk_score} Risk
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">N/A</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {rfp.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            href={`/rfps/${rfp.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#c8102e] hover:underline"
                          >
                            View RFP
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
