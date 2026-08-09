"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { BrainCircuit, Sparkles, FileText, Database, Settings, Loader2 } from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface RAGMetrics {
  primary_provider: string;
  fallback_provider: string;
  primary_model: string;
  fallback_model: string;
  qdrant_location: string;
  collection_name: string;
  rag: {
    chunk_size: number;
    overlap: number;
    top_k: number;
  };
  averages: {
    confidence: string;
    length: string;
    sync_time: string;
  };
}

export default function AnalysisPage() {
  const [metrics, setMetrics] = useState<RAGMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get<RAGMetrics>(`${API_BASE_URL}/api/v1/analysis/metrics`)
      .then((res) => setMetrics(res.data))
      .catch((err) => console.error("Failed to load metrics:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c8102e]"></span>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">AI Document Intelligence</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">Deep-dive into Qdrant RAG embeddings, Gemini extraction metrics, and AI confidence logs.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-[#c8102e]" />
              <span>Loading AI metrics...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Primary Model */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#c8102e] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">AI Model Settings</h3>
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">
                    Primary: <span className="font-mono font-bold text-[#c8102e]">{metrics?.primary_model}</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Fallback: <span className="font-mono">{metrics?.fallback_model}</span>
                  </p>
                </div>
              </div>

              {/* Card 2: Vector Database */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Vector Collection</h3>
                <div className="space-y-1">
                  <p className="text-xs text-slate-600 font-bold truncate">
                    {metrics?.collection_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    Location: <span className="font-mono">{metrics?.qdrant_location}</span>
                  </p>
                </div>
              </div>

              {/* Card 3: Confidence Score */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Average Confidence</h3>
                <p className="text-2xl font-black text-slate-900">{metrics?.averages?.confidence}</p>
                <p className="text-[11px] text-slate-400">Aggregated extraction confidence across SQL logs</p>
              </div>
            </div>

            {/* RAG Detail Parameters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#c8102e]" />
                <span>RAG Segmentation & Chunking Configurations</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Chunk Size</span>
                  <p className="text-sm font-bold text-slate-800 mt-1">{metrics?.rag?.chunk_size} tokens</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Chunk Overlap</span>
                  <p className="text-sm font-bold text-slate-800 mt-1">{metrics?.rag?.overlap} tokens</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">RAG Top K Retrieval</span>
                  <p className="text-sm font-bold text-slate-800 mt-1">{metrics?.rag?.top_k} hits</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Avg Document Size</span>
                  <p className="text-sm font-bold text-slate-800 mt-1">{metrics?.averages?.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
