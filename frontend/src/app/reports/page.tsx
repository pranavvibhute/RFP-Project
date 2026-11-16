"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { FileSpreadsheet, Download, FileText, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadFile = async (url: string, filename: string, key: string) => {
    try {
      setDownloading(key);
      const res = await api.get(url, { responseType: "blob" });
      const blob = new Blob([res.data]);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error(`Failed to download ${key}:`, err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c8102e]"></span>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Reports & Analytics Export</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">Export executive summaries, requirements compliance matrices, and risk assessments to Word, PDF, or Excel CSV.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Executive Word (.docx) Proposal</h3>
              <p className="text-xs text-slate-500 mt-1">Full professional Word report with Executive Summary, Go/No-Go Decision, SLA Penalties, and Formatted Requirements Table.</p>
            </div>
            <button
              onClick={() => downloadFile("/api/v1/reports/docx/1", "BidWise_Report_Sample.docx", "docx")}
              disabled={downloading !== null}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              {downloading === "docx" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Download Word (.docx)</span>
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#c8102e] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Executive Summary PDF / Report</h3>
              <p className="text-xs text-slate-500 mt-1">High-level summary formatted with project overview, key deadlines, budget, and risk evaluation across all RFPs.</p>
            </div>
            <button
              onClick={() => downloadFile("/api/v1/reports/pdf", "Portfolio_Executive_Report.txt", "pdf")}
              disabled={downloading !== null}
              className="flex items-center gap-2 px-4 py-2 bg-[#c8102e] hover:bg-[#a00c24] disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              {downloading === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
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
              onClick={() => downloadFile("/api/v1/reports/excel", "All_RFPs_Compliance_Matrix.csv", "excel")}
              disabled={downloading !== null}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              {downloading === "excel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>Download Excel Matrix (CSV)</span>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
