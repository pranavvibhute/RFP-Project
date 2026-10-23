"use client";

import { useEffect, useState } from "react";
import SectionHeader from "./SectionHeader";
import { AlertCircle, RefreshCw, FileText, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { useDateRange } from "@/components/ui/DateRangeProvider";

interface LiveStats {
  total_rfps: number;
  active_rfps: number;
  processing_rfps: number;
  completed_rfps: number;
  failed_rfps: number;
  high_risk_rfps: number;
  total_requirements: number;
  categories: {
    mandatory: number;
    technical: number;
    commercial: number;
  };
}

interface TimeSeriesPoint {
  date: string;
  label: string;
  total_rfps: number;
  active_rfps: number;
  high_risk: number;
  requirements_extracted: number;
}

interface TimeSeriesResponse {
  period: string;
  data_points: TimeSeriesPoint[];
}

export default function RFPOverviewSection() {
  const { getApiParams, period } = useDateRange();
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const res = await api.get<LiveStats>("/api/v1/rfps/stats");
      setLiveStats(res.data);
    } catch (err) {
      console.error("Failed to load stats:", err);
      setError("Failed to load RFP statistics");
    }
  };

  const fetchTimeSeries = async () => {
    try {
      const params = getApiParams();
      const res = await api.get<TimeSeriesResponse>(
        `/api/v1/rfps/metrics/time-series?period=${params.period}&weeks=${params.weeks}`
      );
      setTimeSeriesData(res.data.data_points || []);
    } catch (err) {
      console.error("Failed to load time-series data:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchStats();
    fetchTimeSeries();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchStats();
    fetchTimeSeries();
  };

  if (loading && !liveStats) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#c8102e] animate-pulse" />
            <div className="h-4 w-32 bg-slate-200 animate-pulse rounded" />
          </div>
          <div className="h-8 w-24 bg-slate-200 animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 animate-pulse">
              <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
              <div className="h-8 w-1/2 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse">
              <div className="h-4 w-1/3 bg-slate-200 rounded mb-4" />
              <div className="h-44 w-full bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !liveStats) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Unable to load RFP data</h3>
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

  const stats = liveStats ? [
    { label: "Total RFPs", value: liveStats.total_rfps.toLocaleString() },
    { label: "Active", value: liveStats.active_rfps.toLocaleString() },
    { label: "Processing", value: liveStats.processing_rfps.toLocaleString() },
    { label: "High Risk", value: liveStats.high_risk_rfps.toLocaleString() },
    { label: "Requirements", value: liveStats.total_requirements.toLocaleString() },
    { label: "Completed", value: liveStats.completed_rfps.toLocaleString() },
  ] : [];

  const pieData = liveStats ? [
    { name: "Mandatory", value: liveStats.categories.mandatory, color: "#111625" },
    { name: "Technical", value: liveStats.categories.technical, color: "#c8102e" },
    { name: "Commercial", value: liveStats.categories.commercial, color: "#94a3b8" },
  ].filter(d => d.value > 0) : [];

  const totalCategory = pieData.reduce((sum, d) => sum + d.value, 0);
  const mandatoryPct = totalCategory > 0 ? Math.round((pieData.find(d => d.name === "Mandatory")?.value || 0) / totalCategory * 100) : 0;

  const barChartData = timeSeriesData.map(d => ({
    name: d.label,
    Total: d.total_rfps,
    Active: d.active_rfps,
    HighRisk: d.high_risk,
  }));

  const lineChartData = timeSeriesData.map(d => ({
    name: d.label,
    Total: d.total_rfps,
    Active: d.active_rfps,
    Requirements: d.requirements_extracted,
  }));

  const hasChartData = barChartData.length > 0 && barChartData.some(d => d.Total > 0 || d.Active > 0 || d.HighRisk > 0);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <SectionHeader icon={FileText} title="RFPs & Submissions" stats={stats} />
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1.5 text-slate-500 hover:text-[#c8102e] transition disabled:opacity-50"
          title="Refresh data"
        >
          <RefreshCw className={`${loading ? "animate-spin" : ""} w-4 h-4`} />
        </button>
      </div>

      {/* 3 Chart Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Bar Chart - RFP Submission Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              RFP Submission Status
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">{period} view</span>
          </div>

          {hasChartData ? (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#111625", border: "none", borderRadius: "8px" }} />
                  <Bar dataKey="Total" fill="#111625" radius={[3, 3, 0, 0]} barSize={10} name="Total RFPs" />
                  <Bar dataKey="Active" fill="#c8102e" radius={[3, 3, 0, 0]} barSize={10} name="Active" />
                  <Bar dataKey="HighRisk" fill="#fef2f2" radius={[3, 3, 0, 0]} barSize={10} name="High Risk" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-44 w-full flex flex-col items-center justify-center text-slate-400">
              <FileText className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-xs font-medium">No RFP submission data for this period</p>
              <p className="text-[10px] mt-1">Upload RFPs to see submission trends</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#111625]"></span>
              <span>Total RFPs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#c8102e]"></span>
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#fef2f2] border border-rose-200"></span>
              <span>High Risk</span>
            </div>
          </div>
        </div>

        {/* Card 2: Donut Chart - Category Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Category Distribution
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Current RFPs</span>
          </div>

          {pieData.length > 0 ? (
            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-900 tracking-tight">{mandatoryPct}%</span>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Mandatory</p>
              </div>
            </div>
          ) : (
            <div className="h-44 w-full flex flex-col items-center justify-center text-slate-400">
              <FileText className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-xs font-medium">No category data available</p>
              <p className="text-[10px] mt-1">Requirements will appear after RFP analysis</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-slate-600 pt-1">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                <span>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Line Chart - RFP Volume & Requirements Growth */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              RFP Volume & Requirements
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">{period} trend</span>
          </div>

          {hasChartData ? (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#111625", border: "none", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="Total" stroke="#111625" strokeWidth={2} dot={false} name="Total RFPs" />
                  <Line type="monotone" dataKey="Active" stroke="#c8102e" strokeWidth={1.5} dot={false} name="Active" />
                  <Line type="monotone" dataKey="Requirements" stroke="#64748b" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Requirements" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-44 w-full flex flex-col items-center justify-center text-slate-400">
              <FileText className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-xs font-medium">No volume trend data for this period</p>
              <p className="text-[10px] mt-1">Data appears as RFPs are processed</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#111625]"></span>
              <span>Total RFPs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#c8102e]"></span>
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#64748b]"></span>
              <span>Requirements</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}