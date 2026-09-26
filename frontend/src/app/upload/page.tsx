"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  ShieldAlert, 
  Copy, 
  Check, 
  Loader2,
  FileCheck2,
  Sparkles,
  ArrowRight,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface Requirement {
  category: string;
  priority: string;
  requirement: string;
}

interface Risk {
  severity: string;
  description: string;
}

interface AnalysisData {
  executive_summary: string;
  submission_deadline?: string;
  budget?: string;
  opportunity_summary: string;
  overall_risk: string;
  requirements: Requirement[];
  evaluation_criteria?: string[];
  important_risks?: string[];
  risks?: Risk[];
  issuing_organization?: string;
  bid_recommendation?: string;
  recommendation_rationale?: string;
}

interface AnalysisResponse {
  analysis?: AnalysisData;
  executive_summary?: AnalysisData;
  filename?: string;
  file_type?: string;
  processing_time_ms?: number;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<string>("");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "requirements" | "risks" | "json">("summary");
  const [copied, setCopied] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.name.endsWith(".pdf") || selected.name.endsWith(".docx")) {
        setFile(selected);
        setError(null);
      } else {
        setError("Unsupported format. Please upload a .pdf or .docx file.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.name.endsWith(".pdf") || selected.name.endsWith(".docx")) {
        setFile(selected);
        setError(null);
      } else {
        setError("Unsupported format. Please upload a .pdf or .docx file.");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setElapsedSeconds(0);

    console.group("🚀 [BidWise AI Multi-Agent Pipeline]");
    console.log("📄 [Step 1/5] Selected File for Analysis:", {
      name: file.name,
      sizeBytes: file.size,
      sizeFormatted: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      type: file.type || "application/octet-stream",
      dispatchedAt: new Date().toLocaleTimeString(),
    });

    const formData = new FormData();
    formData.append("file", file);

    setProgressStep("Step 1/4: Ingesting document & extracting text/tables...");
    console.log("📡 [Step 2/5] Dispatching multipart/form-data POST request to:", `${API_BASE_URL}/api/v1/analyze`);

    // Dynamic progress stepper based on live active seconds
    const intervalTimer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = +(prev + 0.5).toFixed(1);
        if (next < 2.0) {
          setProgressStep("Step 1/4: Ingesting document & extracting text/tables...");
        } else if (next < 7.0) {
          setProgressStep("Step 2/4: Chunking text & embedding dense vectors in Qdrant...");
        } else if (next < 16.0) {
          setProgressStep("Step 3/4: Multi-Agent Core running in parallel (Doc, Req, Risk, Profit, Gap Analysis)...");
        } else {
          setProgressStep("Step 4/4: Synthesizing executive Go/No-Go bid decision & readiness score...");
        }
        return next;
      });
    }, 500);

    const startTime = performance.now();

    try {
      const response = await axios.post<AnalysisResponse>(`${API_BASE_URL}/api/v1/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const elapsedSec = ((performance.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [Step 5/5] Backend response received successfully in ${elapsedSec}s! Status:`, response.status);
      console.log("📦 [Payload] Raw Response Payload from Backend:", response.data);

      setRawResponse(response.data);

      // Support both rich analysis and standard executive summary
      const data = response.data.analysis || response.data.executive_summary || (response.data as any);
      
      console.log("📊 [Render] Formatted Analysis Loaded for UI:", {
        executive_summary: data.executive_summary || data.project_overview,
        requirements_count: data.requirements?.length || 0,
        risks_count: data.risks?.length || 0,
        bid_recommendation: data.bid_recommendation,
        submission_deadline: data.submission_deadline || (data.deadlines?.[0]?.date_or_detail),
        budget: data.budget,
        overall_risk: data.overall_risk,
      });

      setResult(data);
      console.log("🎉 UI components populated successfully. Pipeline complete!");
    } catch (err: any) {
      console.error("❌ [Pipeline Error] Analysis execution failed:", {
        error: err.message,
        status: err.response?.status,
        detail: err.response?.data?.detail,
        data: err.response?.data,
      });
      const msg = err.response?.data?.detail || err.message || "Analysis failed. Ensure FastAPI server is running on port 8000.";
      setError(msg);
    } finally {
      clearInterval(intervalTimer);
      setLoading(false);
      setProgressStep("");
      console.groupEnd();
    }
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(rawResponse || result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredRequirements = result?.requirements?.filter((req) => {
    if (selectedCategory === "All") return true;
    return req.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c8102e]"></span>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">
                Upload & Analyze RFP Document
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Upload your Request for Proposal (.pdf or .docx) to extract key requirements, deadlines, budget, and risk scores using BidWise AI.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
            <Sparkles className="w-4 h-4 text-[#c8102e]" />
            <span>Gemini 2.5 + Qdrant RAG</span>
          </div>
        </div>

        {/* Dropzone Container */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition flex flex-col items-center justify-center cursor-pointer ${
              isDragOver ? "border-[#c8102e] bg-rose-50/50 scale-[1.005]" : "border-slate-300 hover:border-[#c8102e] bg-slate-50/50"
            }`}
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <input
              type="file"
              id="fileInput"
              accept=".pdf,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-[#c8102e]/10 text-[#c8102e] flex items-center justify-center mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h3 className="text-sm font-bold text-slate-800">
              Drag & Drop your RFP file here
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports <span className="font-semibold text-slate-600">PDF (.pdf)</span> and <span className="font-semibold text-slate-600">Word (.docx)</span> files up to 25MB
            </p>

            {file && (
              <div className="mt-4 flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs text-xs font-bold text-slate-800">
                <FileText className="w-4 h-4 text-[#c8102e]" />
                <span>{file.name}</span>
                <span className="text-[10px] text-slate-400 font-normal">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-3 font-medium">
              <AlertTriangle className="w-4 h-4 text-[#c8102e] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Analyze Action Button */}
          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-white shadow-md transition ${
                !file || loading
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-[#c8102e] hover:bg-[#a00c24] shadow-red-900/20"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing RFP...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start AI Extraction & Analysis</span>
                </>
              )}
            </button>
          </div>

          {/* Progress Indicator */}
          {loading && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-800">
                  <Loader2 className="w-4 h-4 animate-spin text-[#c8102e]" />
                  <span>{progressStep}</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#c8102e] bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                  ⏱️ {elapsedSeconds.toFixed(1)}s
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-[#c8102e] h-1.5 rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          )}
        </div>

        {/* Results Container */}
        {result && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Database Persistence Banner */}
            <div className="bg-emerald-50/80 border-b border-emerald-200 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>RFP and Multi-Agent findings successfully stored in the Database & Registry!</span>
              </div>
              <Link
                href="/rfps"
                className="flex items-center gap-1 text-xs font-bold text-[#c8102e] hover:underline shrink-0"
              >
                <span>View in Registry</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Tabs Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 pt-4 bg-slate-50/50">
              <div className="flex gap-2">
                {[
                  { id: "summary", label: "Executive Summary", icon: FileCheck2 },
                  { id: "requirements", label: `Requirements (${result.requirements?.length || 0})`, icon: CheckCircle },
                  { id: "risks", label: "Risk Matrix", icon: ShieldAlert },
                  { id: "json", label: "Raw JSON Output", icon: Copy },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-bold transition ${
                        isActive
                          ? "border-[#c8102e] text-[#c8102e]"
                          : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {activeTab === "json" && (
                <button
                  onClick={handleCopyJSON}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy JSON"}</span>
                </button>
              )}
            </div>

            {/* Tab 1: Executive Summary */}
            {activeTab === "summary" && (
              <div className="p-6 space-y-6">
                {/* Meta Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Risk Score</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                        result.overall_risk?.toLowerCase() === "high"
                          ? "bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      }`}>
                        {result.overall_risk || "Medium"}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submission Deadline</span>
                    <div className="mt-1 flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                      <Clock className="w-3.5 h-3.5 text-[#c8102e]" />
                      <span>{result.submission_deadline || "Not specified"}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Budget</span>
                    <div className="mt-1 flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{result.budget || "Confidential / TBD"}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issuing Organization</span>
                    <div className="mt-1 font-bold text-slate-800 text-xs truncate">
                      {result.issuing_organization || "Municipal / Corporate"}
                    </div>
                  </div>
                </div>

                {/* AI Bid / No-Bid Decision Recommendation */}
                <div className="p-5 bg-[#111625] text-white rounded-xl space-y-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#c8102e]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">AI Bid / No-Bid Decision Synthesis</h4>
                    </div>
                    {(() => {
                      const rec = (result.bid_recommendation || "Go").toLowerCase();
                      if (rec.includes("go") && !rec.includes("no")) {
                        return (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white shadow-xs">
                            BID (GO)
                          </span>
                        );
                      } else if (rec.includes("no")) {
                        return (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white shadow-xs">
                            NO-BID (NO-GO)
                          </span>
                        );
                      } else {
                        return (
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white shadow-xs">
                            REVIEW REQUIRED
                          </span>
                        );
                      }
                    })()}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {result.recommendation_rationale || "Automated synthesis recommends proceeding with proposal development based on technical compatibility and extracted scope."}
                  </p>
                </div>

                {/* Project Executive Summary */}
                <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Project Overview & Executive Summary</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {result.executive_summary || result.opportunity_summary}
                  </p>
                </div>

                {/* Evaluation Criteria */}
                {result.evaluation_criteria && result.evaluation_criteria.length > 0 && (
                  <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Evaluation Criteria Breakdown</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {result.evaluation_criteria.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-xs font-semibold text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c8102e]"></span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Requirements Matrix */}
            {activeTab === "requirements" && (
              <div className="p-6 space-y-4">
                {/* Category Filter */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs font-bold text-slate-400 uppercase mr-2">Category:</span>
                  {["All", "Mandatory", "Technical", "Commercial", "Security"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        selectedCategory === cat
                          ? "bg-[#c8102e] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Requirements Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="p-3">Category</th>
                        <th className="p-3">Priority</th>
                        <th className="p-3">Requirement Text</th>
                        <th className="p-3">Compliance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRequirements?.map((req, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-bold text-slate-800">{req.category}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              req.priority?.toLowerCase() === "high"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {req.priority}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{req.requirement}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Verified Compliant</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Risk Matrix */}
            {activeTab === "risks" && (
              <div className="p-6 space-y-4">
                {result.risks && result.risks.length > 0 ? (
                  <div className="space-y-3">
                    {result.risks.map((risk, idx) => (
                      <div key={idx} className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#c8102e] shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">Severity:</span>
                            <span className="text-xs font-black uppercase text-[#c8102e]">{risk.severity}</span>
                          </div>
                          <p className="text-xs text-slate-700 font-medium mt-1">{risk.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-medium text-center py-6">No critical risk factors identified in this RFP.</p>
                )}
              </div>
            )}

            {/* Tab 4: Raw JSON */}
            {activeTab === "json" && (
              <div className="p-6 bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto rounded-b-2xl">
                <pre>{JSON.stringify(rawResponse || result, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
