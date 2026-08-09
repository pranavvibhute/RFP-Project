"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Settings, Save, Sparkles, Loader2, Check } from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function SettingsPage() {
  const [primaryModel, setPrimaryModel] = useState("gemini-2.5-flash");
  const [fallbackModel, setFallbackModel] = useState("openrouter/free (Qwen)");
  const [collectionName, setCollectionName] = useState("bidwise_rfp_chunks");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/v1/settings`)
      .then((res) => {
        setPrimaryModel(res.data.primary_model || "gemini-2.5-flash");
        setFallbackModel(res.data.fallback_model || "openrouter/free (Qwen)");
        setCollectionName(res.data.collection_name || "bidwise_rfp_chunks");
      })
      .catch((err) => console.error("Failed to load settings:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await axios.post(`${API_BASE_URL}/api/v1/settings`, {
        primary_model: primaryModel,
        fallback_model: fallbackModel,
        collection_name: collectionName,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c8102e]"></span>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">System Settings & Configuration</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">Configure Gemini AI API keys, Qdrant parameters, and organization profile.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-[#c8102e]" />
              <span>Loading system configuration...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6 max-w-2xl">
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">AI Intelligence Provider</h3>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Primary AI Model</label>
                <input
                  type="text"
                  value={primaryModel}
                  onChange={(e) => setPrimaryModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#c8102e]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Fallback Model</label>
                <input
                  type="text"
                  value={fallbackModel}
                  onChange={(e) => setFallbackModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#c8102e]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Vector Store Collection</label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#c8102e]"
                  required
                />
              </div>
            </div>

            {savedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Configuration saved successfully! Changes injected into runtime settings.</span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#c8102e] hover:bg-[#a00c24] text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{saving ? "Saving..." : "Save Configuration"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
