"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Activity, Server, Database, Brain, Loader2 } from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface HealthInfo {
  status: string;
  service: string;
  infrastructure?: {
    database: string;
    gemini_api: string;
    qdrant_store: string;
    version: string;
  };
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = () => {
    setLoading(true);
    axios
      .get<HealthInfo>(`${API_BASE_URL}/api/v1/health`)
      .then((res) => setHealth(res.data))
      .catch(() => setHealth({ status: "offline", service: "bidwise-analysis" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const dbConnected = health?.infrastructure?.database === "connected";
  const geminiActive = health?.infrastructure?.gemini_api === "active";
  const qdrantActive = health?.infrastructure?.qdrant_store === "active";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c8102e]"></span>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">System Health & Infrastructure</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">Real-time status of FastAPI server, SQLite database, Qdrant vector store, and Gemini AI endpoints.</p>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#c8102e] hover:bg-[#a00c24] text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Ping Status</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* FastAPI Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                health?.status === "ok" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              }`}>
                {loading ? "Checking..." : health?.status === "ok" ? "Online" : "Offline"}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-800">FastAPI Analysis Service</h3>
            <p className="text-xs text-slate-400 font-mono">http://127.0.0.1:8000/api/v1/health</p>
          </div>

          {/* SQLite Database Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                dbConnected ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              }`}>
                {loading ? "Checking..." : dbConnected ? "Online" : "Disconnected"}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-800">SQLite Database</h3>
            <p className="text-xs text-slate-400 font-mono">rfp_database.db</p>
          </div>

          {/* Gemini API Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                geminiActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}>
                {loading ? "Checking..." : geminiActive ? "Active" : "Not Configured"}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-800">Gemini 2.5 Flash API</h3>
            <p className="text-xs text-slate-400 font-mono">google-genai SDK (v{health?.infrastructure?.version || "0.2.0"})</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
