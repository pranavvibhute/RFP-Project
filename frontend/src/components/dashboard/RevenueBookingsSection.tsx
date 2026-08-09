"use client";

import { useEffect, useState } from "react";
import { DollarSign, ArrowRight, FileEdit, FileText, CheckCircle } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface PipelineData {
  month: string;
  pipeline: number;
  target: number;
}

interface IncompleteProfile {
  id: number;
  name: string;
  customer: string;
  progress: number;
}

interface DashboardMetrics {
  revenue_chart_data: PipelineData[];
  total_pipeline: string;
  incomplete_profiles: IncompleteProfile[];
  recent_extractions: any[];
}

export default function RevenueBookingsSection() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    axios
      .get<DashboardMetrics>(`${API_BASE_URL}/api/v1/rfps/dashboard`)
      .then((res) => setMetrics(res.data))
      .catch((err) => console.error("Failed to load dashboard metrics:", err));
  }, []);

  const defaultRevenueData = [
    { month: "Jan", pipeline: 400, target: 480 },
    { month: "Feb", pipeline: 600, target: 720 },
    { month: "Mar", pipeline: 800, target: 960 },
    { month: "Apr", pipeline: 700, target: 840 },
    { month: "May", pipeline: 1200, target: 1440 },
    { month: "Jun", pipeline: 900, target: 1080 },
    { month: "Jul", pipeline: 1500, target: 1800 },
  ];

  const chartData = metrics?.revenue_chart_data && metrics.revenue_chart_data.length > 0
    ? metrics.revenue_chart_data
    : defaultRevenueData;

  const incompleteProfiles = metrics?.incomplete_profiles || [];
  const recentRfps = metrics?.recent_extractions || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Card 1: Pipeline Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#c8102e] text-white flex items-center justify-center text-xs">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              RFP Pipeline
            </h3>
          </div>
          <span className="text-xs font-black text-slate-900">
            {metrics?.total_pipeline || "$2.45M"}
          </span>
        </div>

        <p className="text-[11px] text-slate-400 font-medium">
          Total estimated budget aggregated from all extracted customer proposals in SQLite.
        </p>

        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="pipeline" fill="#c8102e" radius={[2, 2, 0, 0]} barSize={6} name="Pipeline ($K)" />
              <Line type="monotone" dataKey="target" stroke="#111625" strokeWidth={1.5} dot={false} name="Target ($K)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-3 text-[10px] font-medium text-slate-600 pt-1">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-xs bg-[#c8102e]"></span>
            <span>Est. Pipeline ($K)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-[#111625]"></span>
            <span>Target Line ($K)</span>
          </div>
        </div>
      </div>

      {/* Card 2: Recent RFP Extractions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#111625] text-white flex items-center justify-center text-xs">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent Extractions
            </h3>
          </div>
          <Link href="/rfps" className="flex items-center gap-0.5 text-[10px] font-semibold text-[#c8102e] hover:underline">
            <span>See all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-y-auto max-h-[220px] space-y-2 pr-1">
          {recentRfps.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No recent extractions.</p>
          ) : (
            recentRfps.map((rfp) => (
              <div key={rfp.id} className="p-2 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between transition">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 text-[11px] truncate">{rfp.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{rfp.customer} · {rfp.date}</div>
                </div>
                <div className="ml-3 shrink-0 flex flex-col items-end">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    rfp.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {rfp.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Card 3: Incomplete RFP Profiles */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Incomplete Profiles
          </h3>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
            Metadata Check
          </span>
        </div>

        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
          {incompleteProfiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <CheckCircle className="w-8 h-8 text-emerald-500 mb-1" />
              <p className="text-xs font-medium">All profiles 100% complete!</p>
            </div>
          ) : (
            incompleteProfiles.map((profile) => (
              <div key={profile.id} className="flex items-center gap-3 p-1.5 hover:bg-slate-50 rounded-xl transition">
                <div className="w-7 h-7 rounded-lg bg-[#c8102e]/10 text-[#c8102e] flex items-center justify-center font-bold text-xs shrink-0">
                  {profile.customer[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-800 truncate">{profile.name}</span>
                    <span className="text-[9px] bg-cyan-100 text-cyan-700 px-1.5 py-0.2 rounded font-semibold">
                      {profile.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#c8102e] h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${profile.progress}%` }}
                    ></div>
                  </div>
                </div>

                <Link
                  href={`/rfps/${profile.id}`}
                  className="text-slate-400 hover:text-[#c8102e] p-1 transition shrink-0"
                >
                  <FileEdit className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
