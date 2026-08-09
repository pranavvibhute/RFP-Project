"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import axios from "axios";
import {
  Users,
  TrendingUp,
  DollarSign,
  ShieldAlert,
  Search,
  Filter,
  ArrowUpRight,
  Building2,
  Loader2,
  BarChart3,
  Target,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface CustomerProfile {
  customer_name: string;
  segment: string;
  industry: string;
  total_rfps: number;
  total_opportunity_value: string;
  total_opportunity_value_raw: number;
  overall_risk_profile: string;
  win_propensity_score: number;
  last_rfp_date: string;
  compliance_strictness: string;
  top_categories: string[];
  engagement_trend: string;
}

const segmentColors: Record<string, string> = {
  Government: "bg-blue-100 text-blue-700",
  "Financial Services": "bg-emerald-100 text-emerald-700",
  Healthcare: "bg-violet-100 text-violet-700",
  "Enterprise Tech": "bg-amber-100 text-amber-700",
  Enterprise: "bg-slate-100 text-slate-700",
};

const riskColors: Record<string, { bg: string; text: string; dot: string }> = {
  High: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  Medium: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  Low: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
};

const trendColors: Record<string, string> = {
  Growing: "text-emerald-600",
  Stable: "text-blue-600",
  New: "text-violet-600",
};

function WinScoreGauge({ score }: { score: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 85 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} strokeWidth="6" stroke="#e2e8f0" fill="none" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          strokeWidth="6"
          stroke={color}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-lg font-black text-slate-900 leading-none">{score}</span>
        <p className="text-[8px] text-slate-400 font-semibold uppercase">Win%</p>
      </div>
    </div>
  );
}

function CustomerCard({ customer }: { customer: CustomerProfile }) {
  const risk = riskColors[customer.overall_risk_profile] || riskColors["Medium"];
  const segColor = segmentColors[customer.segment] || segmentColors["Enterprise"];
  const encodedName = encodeURIComponent(customer.customer_name);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group">
      {/* Card Header */}
      <div className="p-5 pb-3 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${segColor}`}>
                {customer.segment}
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  trendColors[customer.engagement_trend] || "text-slate-500"
                } flex items-center gap-0.5`}
              >
                <TrendingUp className="w-3 h-3" />
                {customer.engagement_trend}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
              {customer.customer_name}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{customer.industry}</p>
          </div>
          <WinScoreGauge score={customer.win_propensity_score} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-px bg-slate-100 border-b border-slate-100">
        <div className="bg-white p-3">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Pipeline</p>
          <p className="text-sm font-black text-slate-900 mt-0.5">{customer.total_opportunity_value}</p>
        </div>
        <div className="bg-white p-3">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">RFPs</p>
          <p className="text-sm font-black text-slate-900 mt-0.5">{customer.total_rfps}</p>
        </div>
        <div className="bg-white p-3">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Risk</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
            <span className={`text-xs font-bold ${risk.text}`}>{customer.overall_risk_profile}</span>
          </div>
        </div>
        <div className="bg-white p-3">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Last RFP</p>
          <p className="text-[11px] font-semibold text-slate-700 mt-0.5">{customer.last_rfp_date}</p>
        </div>
      </div>

      {/* Top Categories */}
      {customer.top_categories.length > 0 && (
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide mb-2">Top Requirements</p>
          <div className="flex flex-wrap gap-1.5">
            {customer.top_categories.map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="p-4">
        <Link
          href={`/customers/${encodedName}`}
          className="flex items-center justify-center gap-2 w-full bg-[#c8102e] hover:bg-[#a00c24] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition group-hover:shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>View Intelligence</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSegment, setFilterSegment] = useState("All");
  const [view, setView] = useState<"grid" | "table">("grid");

  useEffect(() => {
    axios
      .get<CustomerProfile[]>(`${API_BASE_URL}/api/v1/customers`)
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error("Failed to load customers:", err))
      .finally(() => setLoading(false));
  }, []);

  const segments = ["All", ...Array.from(new Set(customers.map((c) => c.segment)))];

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry.toLowerCase().includes(search.toLowerCase());
    const matchSegment = filterSegment === "All" || c.segment === filterSegment;
    return matchSearch && matchSegment;
  });

  // KPI aggregates
  const totalPipeline = customers.reduce((sum, c) => sum + c.total_opportunity_value_raw, 0);
  const avgWinScore =
    customers.length > 0
      ? Math.round(customers.reduce((s, c) => s + c.win_propensity_score, 0) / customers.length)
      : 0;
  const highRiskCount = customers.filter((c) => c.overall_risk_profile === "High").length;

  const kpis = [
    {
      label: "Total Accounts",
      value: loading ? "..." : customers.length.toString(),
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Total Pipeline",
      value: loading ? "..." : `$${(totalPipeline / 1_000_000).toFixed(1)}M`,
      icon: DollarSign,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Avg Win Score",
      value: loading ? "..." : `${avgWinScore}%`,
      icon: Target,
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: "High-Risk Accounts",
      value: loading ? "..." : highRiskCount.toString(),
      icon: ShieldAlert,
      color: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c8102e]" />
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Customer Intelligence</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                AI-powered buyer profiles, win propensity scores, and strategic insights aggregated from all RFP submissions.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <BarChart3 className="w-3.5 h-3.5 text-[#c8102e]" />
              <span className="font-semibold">{customers.length} customer profiles loaded</span>
            </div>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-xl font-black text-slate-900 leading-tight">{kpi.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                id="customer-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="w-full bg-white text-xs text-slate-800 placeholder-slate-400 pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#c8102e] transition"
              />
            </div>

            {/* Segment Filter */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
              {segments.map((seg) => (
                <button
                  key={seg}
                  onClick={() => setFilterSegment(seg)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${
                    filterSegment === seg
                      ? "bg-[#c8102e] text-white"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  {seg}
                </button>
              ))}
            </div>
          </div>

          {/* Grid / Table toggle */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1">
            <button
              id="view-grid"
              onClick={() => setView("grid")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                view === "grid" ? "bg-[#111625] text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Cards
            </button>
            <button
              id="view-table"
              onClick={() => setView("table")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${
                view === "table" ? "bg-[#111625] text-white" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Table
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center p-16 bg-white rounded-2xl border border-slate-200">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#c8102e]" />
              <p className="text-xs text-slate-500 font-medium">Loading customer intelligence profiles...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center p-16 bg-white rounded-2xl border border-slate-200">
            <div className="text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-500">No customers found</p>
              <p className="text-xs text-slate-400 mt-1">Upload RFPs to generate customer profiles.</p>
            </div>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((customer) => (
              <CustomerCard key={customer.customer_name} customer={customer} />
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Segment</th>
                    <th className="p-4">Pipeline Value</th>
                    <th className="p-4">RFPs</th>
                    <th className="p-4">Risk</th>
                    <th className="p-4">Win Score</th>
                    <th className="p-4">Trend</th>
                    <th className="p-4">Last RFP</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((c) => {
                    const risk = riskColors[c.overall_risk_profile] || riskColors["Medium"];
                    const segColor = segmentColors[c.segment] || segmentColors["Enterprise"];
                    const encodedName = encodeURIComponent(c.customer_name);
                    return (
                      <tr key={c.customer_name} className="hover:bg-slate-50/80 transition">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{c.customer_name}</div>
                          <div className="text-[11px] text-slate-400">{c.industry}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${segColor}`}>
                            {c.segment}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-900">{c.total_opportunity_value}</td>
                        <td className="p-4 font-semibold text-slate-700">{c.total_rfps}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${risk.dot}`} />
                            <span className={`font-semibold ${risk.text}`}>{c.overall_risk_profile}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-1.5 rounded-full bg-[#c8102e]"
                                style={{ width: `${c.win_propensity_score}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-900 text-[11px]">{c.win_propensity_score}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`font-semibold text-[11px] ${trendColors[c.engagement_trend] || ""}`}>
                            {c.engagement_trend}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 font-medium">{c.last_rfp_date}</td>
                        <td className="p-4 text-right">
                          <Link
                            href={`/customers/${encodedName}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#c8102e] hover:underline"
                          >
                            <span>View</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
