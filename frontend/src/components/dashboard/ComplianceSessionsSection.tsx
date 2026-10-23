"use client";

import { useEffect, useState } from "react";
import SectionHeader from "./SectionHeader";
import { Target, ChevronDown, CheckSquare, ShieldCheck, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { api } from "@/lib/api";

interface ComplianceData {
  rate: number;
  compliant: number;
  pending: number;
  non_compliant: number;
}

interface DashboardMetrics {
  compliance: ComplianceData;
}

interface CategoryCompliance {
  category: string;
  total: number;
  compliant: number;
  pending: number;
  non_compliant: number;
}

export default function ComplianceSessionsSection() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [categoryCompliance, setCategoryCompliance] = useState<CategoryCompliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const res = await api.get<DashboardMetrics>("/api/v1/rfps/dashboard");
      setMetrics(res.data);
    } catch (err) {
      console.error("Failed to load compliance metrics:", err);
      setError("Failed to load compliance data");
    }
  };

  const fetchCategoryCompliance = async () => {
    try {
      const res = await api.get<{ requirements: any[] }>("/api/v1/requirements");
      const requirements = res.data.requirements || [];
      
      // Group by category and compute compliance
      const categoryMap = new Map<string, CategoryCompliance>();
      
      requirements.forEach(req => {
        const cat = req.category || "Uncategorized";
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, { category: cat, total: 0, compliant: 0, pending: 0, non_compliant: 0 });
        }
        const catData = categoryMap.get(cat)!;
        catData.total += 1;
        const status = (req.status || "").toLowerCase();
        if (status.includes("compliant") && !status.includes("non")) {
          catData.compliant += 1;
        } else if (status.includes("non")) {
          catData.non_compliant += 1;
        } else {
          catData.pending += 1;
        }
      });
      
      setCategoryCompliance(Array.from(categoryMap.values()));
    } catch (err) {
      console.error("Failed to load category compliance:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchMetrics();
    fetchCategoryCompliance();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchMetrics();
    fetchCategoryCompliance();
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#c8102e]" />
            <div className="h-4 w-40 bg-slate-200 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse">
            <div className="h-4 w-1/3 bg-slate-200 rounded mb-4" />
            <div className="h-44 w-full bg-slate-200 rounded" />
          </div>
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 animate-pulse">
            <div className="h-4 w-1/3 bg-slate-200 rounded mb-4" />
            <div className="h-44 w-full bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Unable to load compliance data</h3>
        <p className="text-sm text-slate-500 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#c8102e] text-white rounded-lg font-medium hover:bg-[#a00c24] transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const comp = metrics?.compliance || { rate: 0, compliant: 0, pending: 0, non_compliant: 0 };

  const stats = [
    { label: "Compliance Rate", value: `${comp.rate.toFixed(1)}%` },
    { label: "Compliant", value: comp.compliant.toLocaleString() },
    { label: "Review Pending", value: comp.pending.toLocaleString() },
    { label: "Non-Compliant", value: comp.non_compliant.toLocaleString() },
  ];

  const gaugeData = [
    { name: "Compliant", value: comp.rate, color: comp.rate >= 80 ? "#10b981" : comp.rate >= 60 ? "#f59e0b" : "#ef4444" },
    { name: "Remaining", value: 100 - comp.rate, color: "#e2e8f0" },
  ];

  const categoryBarData = categoryCompliance.length > 0 
    ? categoryCompliance.map(c => ({
        name: c.category,
        "Total Extracted": c.total,
        "Compliant": c.compliant,
        "Pending Review": c.pending,
        "Non-Compliant": c.non_compliant,
      }))
    : [];

  const hasCategoryData = categoryBarData.length > 0 && categoryBarData.some(d => d["Total Extracted"] > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader icon={Target} title="AI Compliance Audits" stats={stats} />
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1.5 text-slate-500 hover:text-[#c8102e] transition disabled:opacity-50"
          title="Refresh compliance data"
        >
          <RefreshCw className={`${loading ? "animate-spin" : ""} w-4 h-4`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Compliance Rate Gauge */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Consolidated Compliance Rate
            </h3>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
              comp.rate >= 80 ? "text-emerald-600 bg-emerald-50 border border-emerald-100" :
              comp.rate >= 60 ? "text-amber-600 bg-amber-50 border border-amber-100" :
              "text-rose-600 bg-rose-50 border border-rose-100"
            }`}>
              {"Target > 80%"}
            </span>
          </div>

          {comp.rate > 0 || comp.compliant > 0 ? (
            <div className="h-44 w-full relative flex items-center justify-center pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="75%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute bottom-4 text-center">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{comp.rate.toFixed(1)}%</span>
                <p className="text-[11px] text-slate-500 font-semibold tracking-wide uppercase">Compliant</p>
              </div>
            </div>
          ) : (
            <div className="h-44 w-full flex flex-col items-center justify-center text-slate-400">
              <ShieldCheck className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-xs font-medium">No compliance data available</p>
              <p className="text-[10px] mt-1">Run RFP analysis to see compliance rates</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-slate-600 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e2e8f0]"></span>
              <span>Needs Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: gaugeData[0].color }}></span>
              <span>Verified Compliant</span>
            </div>
          </div>
        </div>

        {/* Card 2: Requirements Compliance by Category */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Compliance by Category
            </h3>
            <span className="text-[10px] font-semibold text-slate-500">
              Requirements Count
            </span>
          </div>

          {hasCategoryData ? (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#111625", border: "none", borderRadius: "8px" }} />
                  <Bar dataKey="Total Extracted" name="Total Extracted" fill="#111625" radius={[2, 2, 0, 0]} barSize={10} />
                  <Bar dataKey="Compliant" name="Compliant" fill="#10b981" radius={[2, 2, 0, 0]} barSize={10} />
                  <Bar dataKey="Pending Review" name="Pending Review" fill="#f59e0b" radius={[2, 2, 0, 0]} barSize={10} />
                  <Bar dataKey="Non-Compliant" name="Non-Compliant" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-44 w-full flex flex-col items-center justify-center text-slate-400">
              <CheckSquare className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-xs font-medium">No category compliance data</p>
              <p className="text-[10px] mt-1">Requirements will be categorized after RFP analysis</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#111625]"></span>
              <span>Total Extracted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#10b981]"></span>
              <span>Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#f59e0b]"></span>
              <span>Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#ef4444]"></span>
              <span>Non-Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}