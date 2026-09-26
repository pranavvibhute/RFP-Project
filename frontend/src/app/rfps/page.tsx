"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FileText, Search, Plus, Filter, ArrowUpRight, Clock, ShieldAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface RFPItem {
  id: number;
  title: string;
  customer_name: string;
  file_name: string;
  status: string;
  created_at: string;
  deadline?: string;
  budget?: string;
  risk_level?: string;
  analysis?: {
    overall_risk_score?: string;
    submission_deadline?: string;
    budget?: string;
    executive_summary?: string;
  };
}

export default function RFPsPage() {
  const [rfps, setRfps] = useState<RFPItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchRFPs = async () => {
    try {
      const res = await axios.get<RFPItem[]>(`${API_BASE_URL}/api/v1/rfps`);
      setRfps(res.data);
    } catch (err) {
      console.error("Failed to fetch RFPs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFPs();
  }, []);

  const filteredRfps = rfps.filter(
    (rfp) =>
      rfp.title.toLowerCase().includes(search.toLowerCase()) ||
      rfp.customer_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c8102e]"></span>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">RFPs & Proposals</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">Manage, search, and track all incoming RFP documents and proposal compliance records from database.</p>
          </div>

          <Link
            href="/upload"
            className="flex items-center gap-2 bg-[#c8102e] hover:bg-[#a00c24] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New RFP</span>
          </Link>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search RFPs by customer or title..."
              className="w-full bg-white text-xs text-slate-800 placeholder-slate-400 pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#c8102e]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              <Filter className="w-3.5 h-3.5" />
              <span>Live Database Sync</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#c8102e]" />
              <span>Loading RFPs from database...</span>
            </div>
          ) : filteredRfps.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium">
              No RFPs found. Upload your first RFP document to begin!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4">RFP TITLE & CUSTOMER</th>
                    <th className="p-4">UPLOAD DATE</th>
                    <th className="p-4">DEADLINE</th>
                    <th className="p-4">EST. BUDGET</th>
                    <th className="p-4">RISK SCORE</th>
                    <th className="p-4">STATUS</th>
                    <th className="p-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRfps.map((rfp) => (
                    <tr key={rfp.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{rfp.title}</div>
                        <div className="text-[11px] text-slate-400">{rfp.customer_name}</div>
                      </td>
                      <td className="p-4 text-slate-500 font-medium">{rfp.created_at}</td>
                      <td className="p-4 font-semibold text-slate-700">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#c8102e]" />
                          <span>{rfp.analysis?.submission_deadline || rfp.deadline || "TBD"}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{rfp.analysis?.budget || rfp.budget || "TBD"}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ((rfp.analysis?.overall_risk_score || rfp.risk_level || "").toLowerCase() === "high")
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {rfp.analysis?.overall_risk_score || rfp.risk_level || "Medium"} Risk
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {rfp.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/rfps/${rfp.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-[#c8102e] hover:underline">
                          <span>View</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
