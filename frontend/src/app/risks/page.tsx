"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ShieldAlert, AlertTriangle, Loader2 } from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface RiskItem {
  rfp: string;
  severity: string;
  risk: string;
}

export default function RiskPage() {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get<RiskItem[]>(`${API_BASE_URL}/api/v1/risks`)
      .then((res) => setRisks(res.data))
      .catch((err) => console.error("Failed to fetch risks:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c8102e]"></span>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Risk Assessment & Matrix</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">Flagged legal, financial, and technical risk factors extracted from RFPs.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-[#c8102e]" />
              <span>Loading risk matrix...</span>
            </div>
          </div>
        ) : risks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium bg-white rounded-2xl border border-slate-200">
            No risks identified in the system.
          </div>
        ) : (
          <div className="space-y-4">
            {risks.map((item, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-rose-200 shadow-2xs flex items-start gap-4 hover:shadow-sm transition">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#c8102e] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900">{item.rfp}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      item.severity.toLowerCase() === "high" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {item.severity} Severity
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1">{item.risk}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
