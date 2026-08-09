"use client";

import { useEffect, useState } from "react";
import SectionHeader from "./SectionHeader";
import { FileText, ChevronDown } from "lucide-react";
import axios from "axios";
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

const barData = [
  { name: "Week 1", Total: 90, Active: 45, HighRisk: 25 },
  { name: "Week 2", Total: 85, Active: 50, HighRisk: 20 },
  { name: "Week 3", Total: 100, Active: 60, HighRisk: 30 },
  { name: "Week 4", Total: 95, Active: 55, HighRisk: 22 },
];

const lineData = [
  { name: "Week 1", Total: 30, Active: 40, Expired: 15 },
  { name: "Week 2", Total: 45, Active: 65, Expired: 25 },
  { name: "Week 3", Total: 80, Active: 100, Expired: 55 },
  { name: "Week 4", Total: 130, Active: 160, Expired: 90 },
];

export default function RFPOverviewSection() {
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);

  useEffect(() => {
    axios
      .get<LiveStats>(`${API_BASE_URL}/api/v1/rfps/stats`)
      .then((res) => setLiveStats(res.data))
      .catch((err) => console.error("Failed to load stats:", err));
  }, []);

  const stats = [
    { label: "Total RFPs", value: liveStats ? liveStats.total_rfps : "1,225" },
    { label: "Active", value: liveStats ? liveStats.active_rfps : "900" },
    { label: "Processing", value: liveStats ? liveStats.processing_rfps : "200" },
    { label: "High Risk", value: liveStats ? liveStats.high_risk_rfps : "50" },
    { label: "Requirements", value: liveStats ? liveStats.total_requirements : "20" },
    { label: "Completed", value: liveStats ? liveStats.completed_rfps : "15" },
  ];

  const pieData = [
    { name: "Mandatory", value: liveStats ? liveStats.categories.mandatory || 70 : 70, color: "#111625" },
    { name: "Technical", value: liveStats ? liveStats.categories.technical || 20 : 20, color: "#c8102e" },
    { name: "Commercial", value: liveStats ? liveStats.categories.commercial || 10 : 10, color: "#94a3b8" },
  ];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <SectionHeader icon={FileText} title="RFPs & Submissions" stats={stats} />

      {/* 3 Chart Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              RFP Submission Status
            </h3>
            <button className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              <span>Weekly</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="Total" fill="#111625" radius={[3, 3, 0, 0]} barSize={10} />
                <Bar dataKey="Active" fill="#c8102e" radius={[3, 3, 0, 0]} barSize={10} />
                <Bar dataKey="HighRisk" fill="#cbd5e1" radius={[3, 3, 0, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>

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
              <span className="w-2.5 h-2.5 rounded-xs bg-[#cbd5e1]"></span>
              <span>High Risk</span>
            </div>
          </div>
        </div>

        {/* Card 2: Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Category Distribution
            </h3>
            <button className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              <span>Weekly</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

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
              <span className="text-2xl font-black text-slate-900 tracking-tight">70%</span>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">Mandatory</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#111625]"></span>
              <span>Mandatory</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c8102e]"></span>
              <span>Technical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#94a3b8]"></span>
              <span>Commercial</span>
            </div>
          </div>
        </div>

        {/* Card 3: Growth Line Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              RFP Volume Growth
            </h3>
            <button className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 bg-slate-50 px-2 py-1 rounded border border-slate-200">
              <span>Weekly</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="Active" stroke="#c8102e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Total" stroke="#111625" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Expired" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#c8102e]"></span>
              <span>Growth</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#111625]"></span>
              <span>Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#94a3b8]"></span>
              <span>Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
