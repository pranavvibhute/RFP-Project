"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Sliders, 
  Cpu, 
  Database, 
  ShieldAlert, 
  FileText, 
  Save, 
  Check, 
  Loader2, 
  Sparkles,
  Info,
  RefreshCw,
  Scale
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface SystemSettings {
  primary_model: string;
  fallback_model: string;
  temperature: number;
  max_output_tokens: number;
  collection_name: string;
  similarity_top_k: number;
  min_similarity_score: number;
  enable_multimodal_vision_ocr: boolean;
  min_readiness_score_for_go: number;
  min_win_probability_for_go: number;
  auto_flag_uncapped_liability: boolean;
  default_cure_period_days: number;
  default_export_format: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    primary_model: "gemini-2.5-flash",
    fallback_model: "openrouter/free (Qwen)",
    temperature: 0.2,
    max_output_tokens: 8192,
    collection_name: "bidwise_rfp_chunks",
    similarity_top_k: 10,
    min_similarity_score: 0.70,
    enable_multimodal_vision_ocr: true,
    min_readiness_score_for_go: 75,
    min_win_probability_for_go: 65,
    auto_flag_uncapped_liability: true,
    default_cure_period_days: 30,
    default_export_format: "docx",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get<SystemSettings>(`${API_BASE_URL}/api/v1/settings`)
      .then((res) => {
        if (res.data) {
          setSettings((prev) => ({ ...prev, ...res.data }));
        }
      })
      .catch((err) => console.error("Failed to load settings:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setErrorMsg(null);

    try {
      await axios.post(`${API_BASE_URL}/api/v1/settings`, settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to persist configuration settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <Sliders className="w-4 h-4 text-[#c8102e]" />
                </div>
                <h1 className="text-lg font-black text-slate-800 tracking-tight">
                  System Settings & AI Orchestration
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Tune AI inference temperature, vector retrieval thresholds, and automated Go/No-Go decision governance criteria.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-[#c8102e] hover:bg-[#a00c24] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "Saving..." : "Save Configuration"}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-16 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-[#c8102e]" />
              <span>Loading system parameters...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. AI Models & Inference Controls */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Cpu className="w-4 h-4 text-[#c8102e]" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  AI Model Architecture & Inference Controls
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Primary Model */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Primary AI Intelligence Model</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Fast & Multimodal</span>
                  </label>
                  <select
                    value={settings.primary_model}
                    onChange={(e) => setSettings({ ...settings, primary_model: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#c8102e]"
                  >
                    <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (Recommended)</option>
                    <option value="gemini-2.5-pro">Google Gemini 2.5 Pro (Deep Reasoning)</option>
                    <option value="gemini-2.0-flash-exp">Google Gemini 2.0 Flash Experimental</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    Processes multimodal documents, extracts requirements, and evaluates risk.
                  </span>
                </div>

                {/* Fallback Model */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Secondary Fallback Model</label>
                  <select
                    value={settings.fallback_model}
                    onChange={(e) => setSettings({ ...settings, fallback_model: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#c8102e]"
                  >
                    <option value="openrouter/free (Qwen)">OpenRouter Qwen 2.5 72B (Free Tier)</option>
                    <option value="anthropic/claude-3.5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                    <option value="meta-llama/llama-3.3-70b-instruct">Meta Llama 3.3 70B Instruct</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block">
                    Triggered automatically if primary provider experiences rate limits or downtime.
                  </span>
                </div>

                {/* Temperature */}
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Inference Temperature</label>
                    <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                      {settings.temperature}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={settings.temperature}
                    onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-[#c8102e] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>0.0 (Strict / Deterministic)</span>
                    <span>1.0 (Creative)</span>
                  </div>
                </div>

                {/* Max Tokens */}
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <label className="font-bold text-slate-700 block">Max Generation Token Ceiling</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[4096, 8192, 16384].map((tokens) => (
                      <button
                        key={tokens}
                        type="button"
                        onClick={() => setSettings({ ...settings, max_output_tokens: tokens })}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                          settings.max_output_tokens === tokens
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {tokens.toLocaleString()} tokens
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Accommodates comprehensive multi-page executive proposals and matrices.
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Vector Store & RAG Retrieval */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Database className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Vector Store & RAG Retrieval Pipeline
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Qdrant Collection Name</label>
                  <input
                    type="text"
                    value={settings.collection_name}
                    onChange={(e) => setSettings({ ...settings, collection_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#c8102e]"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Collection storing chunk embeddings for semantic similarity search.
                  </span>
                </div>

                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Similarity Score Cutoff</label>
                    <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                      {(settings.min_similarity_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.50"
                    max="0.95"
                    step="0.05"
                    value={settings.min_similarity_score}
                    onChange={(e) => setSettings({ ...settings, min_similarity_score: parseFloat(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Filters out low-confidence context chunks during document Q&A and verification.
                  </span>
                </div>

                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Retrieval Top-K Chunks</label>
                    <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                      k={settings.similarity_top_k}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="25"
                    step="1"
                    value={settings.similarity_top_k}
                    onChange={(e) => setSettings({ ...settings, similarity_top_k: parseInt(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Number of most relevant RFP clauses passed to downstream specialized agents.
                  </span>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <input
                    type="checkbox"
                    id="ocr_toggle"
                    checked={settings.enable_multimodal_vision_ocr}
                    onChange={(e) => setSettings({ ...settings, enable_multimodal_vision_ocr: e.target.checked })}
                    className="w-4 h-4 mt-0.5 accent-[#c8102e] rounded cursor-pointer"
                  />
                  <div>
                    <label htmlFor="ocr_toggle" className="font-bold text-slate-800 cursor-pointer block">
                      Enable Gemini Flash Multimodal OCR
                    </label>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      Automatically renders scanned PDF pages at 150 DPI and uses Gemini Flash Vision for table & diagram extraction.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Bid Decision Guardrails */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Scale className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Automated Bid / No-Bid Decision Guardrails
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Minimum Readiness Score for &quot;Go&quot;</label>
                    <span className="font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {settings.min_readiness_score_for_go} / 100
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="90"
                    step="5"
                    value={settings.min_readiness_score_for_go}
                    onChange={(e) => setSettings({ ...settings, min_readiness_score_for_go: parseInt(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    RFPs scoring below this capability threshold automatically trigger &quot;Review Required&quot; or &quot;No-Go&quot;.
                  </span>
                </div>

                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Minimum Win Probability for &quot;Go&quot;</label>
                    <span className="font-bold text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {settings.min_win_probability_for_go}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="85"
                    step="5"
                    value={settings.min_win_probability_for_go}
                    onChange={(e) => setSettings({ ...settings, min_win_probability_for_go: parseInt(e.target.value) })}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Calculated by combining buyer pricing compatibility and credential fulfillment.
                  </span>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <input
                    type="checkbox"
                    id="liability_toggle"
                    checked={settings.auto_flag_uncapped_liability}
                    onChange={(e) => setSettings({ ...settings, auto_flag_uncapped_liability: e.target.checked })}
                    className="w-4 h-4 mt-0.5 accent-[#c8102e] rounded cursor-pointer"
                  />
                  <div>
                    <label htmlFor="liability_toggle" className="font-bold text-slate-800 cursor-pointer block">
                      Auto-Flag Uncapped Liquidated Damages
                    </label>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      Instantly elevates risk classification to High if contract does not stipulate damages ceiling.
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <label className="font-bold text-slate-700">Default Negotiation Cure Period</label>
                  <select
                    value={settings.default_cure_period_days}
                    onChange={(e) => setSettings({ ...settings, default_cure_period_days: parseInt(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#c8102e]"
                  >
                    <option value={15}>15 Days (Strict)</option>
                    <option value={30}>30 Days (Standard Enterprise)</option>
                    <option value={45}>45 Days (Extended)</option>
                    <option value={60}>60 Days (High Cushion)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Export & Report Preferences */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Proposal Generation & Export Defaults
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Default Executive Proposal Format</label>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, default_export_format: "docx" })}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                        settings.default_export_format === "docx"
                          ? "bg-blue-50 border-blue-500 text-blue-900 shadow-2xs font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="text-xs">Word (.docx)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Editable Proposal Document</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, default_export_format: "pdf" })}
                      className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                        settings.default_export_format === "pdf"
                          ? "bg-rose-50 border-[#c8102e] text-rose-900 shadow-2xs font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <FileText className="w-4 h-4 text-[#c8102e]" />
                      <div>
                        <div className="text-xs">PDF Dossier</div>
                        <div className="text-[10px] text-slate-400 font-normal">Locked Executive Format</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>System configuration saved successfully! Runtime parameters updated.</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#c8102e] hover:bg-[#a00c24] text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? "Saving Configuration..." : "Save System Configuration"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
