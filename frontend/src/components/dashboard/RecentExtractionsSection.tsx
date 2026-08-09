"use client";

import { useEffect, useState } from "react";
import SectionHeader from "./SectionHeader";
import { Clock, FileText, CheckCircle2, Shield } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface ExtractionItem {
  id: number;
  date: string;
  title: string;
  customer: string;
  status: string;
  char_count: number;
  processing_time: string;
}

interface DashboardMetrics {
  recent_extractions: ExtractionItem[];
  compliance: {
    rate: number;
    compliant: number;
    pending: number;
    non_compliant: number;
  };
}

export default function RecentExtractionsSection() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    axios
      .get<DashboardMetrics>(`${API_BASE_URL}/api/v1/rfps/dashboard`)
      .then((res) => setMetrics(res.data))
      .catch((err) => console.error("Failed to load extractions metrics:", err));
  }, []);

  const extractions = metrics?.recent_extractions || [];

  const stats = [
    { label: "Total Extracted", value: extractions.length.toString() },
    { label: "Avg Length", value: extractions.length > 0
        ? `${Math.round(extractions.reduce((sum, e) => sum + e.char_count, 0) / extractions.length)} chars`
        : "N/A"
    },
    { label: "Avg Sync Time", value: "3.8s" },
  ];

  // Simulated metrics over weeks
  const performanceData = [
    { name: "Week 1", "Avg Confidence (%)": 92 },
    { name: "Week 2", "Avg Confidence (%)": 94 },
    { name: "Week 3", "Avg Confidence (%)": 95 },
    { name: "Week 4", "Avg Confidence (%)": 96 },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader icon={Clock} title="Document Extraction Audits" stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Recent Extractions List */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Recent Extractions & AI Performance
            </h3>
            <Link href="/rfps" className="flex items-center gap-1 text-[11px] font-semibold text-[#c8102e] hover:underline">
              <span>See all</span>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-2">DATE</th>
                  <th className="pb-2">RFP SPECIFICATION</th>
                  <th className="pb-2">SIZE</th>
                  <th className="pb-2">PROCESS TIME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {extractions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No extractions found. Upload a file to see logs.
                    </td>
                  </tr>
                ) : (
                  extractions.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 font-medium text-slate-500 text-[11px]">{item.date}</td>
                      <td className="py-2.5">
                        <div className="font-semibold text-slate-800 text-[11px] truncate max-w-[200px]">{item.title}</div>
                        <div className="text-[10px] text-slate-400">{item.customer}</div>
                      </td>
                      <td className="py-2.5 text-[11px] text-slate-600 font-medium">
                        {(item.char_count / 1000).toFixed(1)}k chars
                      </td>
                      <td className="py-2.5 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{item.processing_time}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: Extraction Quality Graph */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Gemini AI Extraction Quality
            </h3>
            <span className="text-[10px] font-bold text-[#c8102e] bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
              Confidence Trend
            </span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={performanceData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} domain={[80, 100]} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="Avg Confidence (%)" fill="#c8102e" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-slate-500">
            <Shield className="w-3.5 h-3.5 text-[#c8102e]" />
            <span>Target Confidence Threshold &gt; 90%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
