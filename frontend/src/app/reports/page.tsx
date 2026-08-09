"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { FileSpreadsheet, Download, FileText, CheckCircle2 } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ReportsPage() {
  const handleDownloadPDF = () => {
    window.open(`${API_BASE_URL}/api/v1/reports/pdf`, "_blank");
  };

  const handleDownloadExcel = () => {
    window.open(`${API_BASE_URL}/api/v1/reports/excel`, "_blank");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c8102e]"></span>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Reports & Analytics Export</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">Export executive summaries, requirements compliance matrices, and risk assessments to PDF or Excel CSV.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#c8102e] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Executive Summary PDF / Report</h3>
              <p className="text-xs text-slate-500 mt-1">High-level summary formatted with project overview, key deadlines, budget, and risk evaluation across all RFPs.</p>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-[#c8102e] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#a00c24] transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Executive PDF Report</span>
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Requirements Compliance Matrix (Excel CSV)</h3>
              <p className="text-xs text-slate-500 mt-1">Full spreadsheet containing categorised requirements, priorities, and assigned compliance statuses.</p>
            </div>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel Matrix (CSV)</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
