"use client";

import { useEffect, useState } from "react";
import SectionHeader from "./SectionHeader";
import { Target, ChevronDown, CheckSquare, ShieldCheck } from "lucide-react";
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
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface DashboardMetrics {
  compliance: {
    rate: number;
    compliant: number;
    pending: number;
    non_compliant: number;
  };
}

export default function ComplianceSessionsSection() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    axios
      .get<DashboardMetrics>(`${API_BASE_URL}/api/v1/rfps/dashboard`)
      .then((res) => setMetrics(res.data))
      .catch((err) => console.error("Failed to load compliance metrics:", err));
  }, []);

  const comp = metrics?.compliance || { rate: 75.5, compliant: 75, pending: 15, non_compliant: 10 };

  const stats = [
    { label: "Compliance Rate", value: `${comp.rate}%` },
    { label: "Compliant", value: comp.compliant.toString() },
    { label: "Review Pending", value: comp.pending.toString() },
    { label: "Non-Compliant", value: comp.non_compliant.toString() },
  ];

  const gaugeData = [
    { name: "Compliant", value: comp.rate, color: "#c8102e" },
    { name: "Remaining", value: 100 - comp.rate, color: "#e2e8f0" },
  ];

  const categoryBarData = [
    { name: "Mandatory", Conducted: 80, Attended: 60 },
    { name: "Technical", Conducted: 110, Attended: 85 },
    { name: "Commercial", Conducted: 50, Attended: 40 },
    { name: "Security", Conducted: 70, Attended: 55 },
    { name: "Legal / SLA", Conducted: 45, Attended: 30 },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader icon={Target} title="AI Compliance Audits" stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Attended / Compliance Rate Semi-circle Gauge */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Consolidated Compliance Rate
            </h3>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.2 font-bold">
              Target &gt; 80%
            </span>
          </div>

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
              <span className="text-3xl font-black text-slate-900 tracking-tight">{comp.rate}%</span>
              <p className="text-[11px] text-slate-500 font-semibold tracking-wide uppercase">Compliant</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-slate-600 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e2e8f0]"></span>
              <span>Needs Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c8102e]"></span>
              <span>Verified Compliant</span>
            </div>
          </div>
        </div>

        {/* Card 2: Requirements Compliance by Category */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Compliance by Category Matrix
            </h3>
            <span className="text-[10px] font-semibold text-slate-500">
              Requirements Count
            </span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="Conducted" name="Total Extracted" fill="#111625" radius={[2, 2, 0, 0]} barSize={10} />
                <Bar dataKey="Attended" name="Compliant" fill="#c8102e" radius={[2, 2, 0, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-slate-600 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#111625]"></span>
              <span>Total Extracted Requirements</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#c8102e]"></span>
              <span>Verified Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
