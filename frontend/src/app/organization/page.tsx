"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  Loader2, 
  Check, 
  Plus, 
  X, 
  Award, 
  Briefcase, 
  Users, 
  DollarSign,
  Globe,
  FileCheck2,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface OrgProfile {
  name: string;
  industry: string;
  website: string;
  annual_revenue: string;
  employee_count: number;
  certifications: string[];
  clearances: string[];
  core_skills: string[];
  past_performance: string[];
}

const COMMON_CERTS = [
  "ISO 27001",
  "SOC 2 Type II",
  "FedRAMP High",
  "CMMI Level 3",
  "HIPAA Security Shield",
  "PCI-DSS Level 1",
  "ISO 9001",
  "NIST 800-171",
];

const COMMON_CLEARANCES = [
  "DoD Secret Facility Clearance",
  "Top Secret / SCI",
  "DoE Q Clearance",
  "Public Trust Moderate",
];

export default function OrganizationPage() {
  const [orgProfile, setOrgProfile] = useState<OrgProfile>({
    name: "Apex Enterprise Solutions Inc.",
    industry: "Cloud & Defense Systems Modernization",
    website: "https://apexsolutions.ai",
    annual_revenue: "$45M",
    employee_count: 180,
    certifications: ["ISO 27001", "SOC 2 Type II", "CMMI Level 3"],
    clearances: ["DoD Secret Facility Clearance"],
    core_skills: ["AWS GovCloud", "Kubernetes", "DevSecOps", "Zero Trust Architecture"],
    past_performance: ["$15M Modernization for Dept of Transportation", "$8M Secure Cloud Migration"],
  });

  const [newCert, setNewCert] = useState("");
  const [newClearance, setNewClearance] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [newPastPerf, setNewPastPerf] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingOrg, setSavingOrg] = useState(false);
  const [savedOrgSuccess, setSavedOrgSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/v1/settings/organization`)
      .then((res) => {
        if (res.data) {
          setOrgProfile({
            name: res.data.name || "Apex Enterprise Solutions Inc.",
            industry: res.data.industry || "Cloud & Defense Systems Modernization",
            website: res.data.website || "https://apexsolutions.ai",
            annual_revenue: res.data.annual_revenue || "$45M",
            employee_count: res.data.employee_count || 180,
            certifications: res.data.certifications || ["ISO 27001", "SOC 2 Type II"],
            clearances: res.data.clearances || ["DoD Secret Facility Clearance"],
            core_skills: res.data.core_skills || ["Cloud Architecture", "DevSecOps"],
            past_performance: res.data.past_performance || ["$15M Enterprise Cloud Migration"],
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load organization profile:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveOrgProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingOrg(true);
    setSavedOrgSuccess(false);
    setErrorMsg(null);

    try {
      await axios.put(`${API_BASE_URL}/api/v1/settings/organization`, orgProfile);
      setSavedOrgSuccess(true);
      setTimeout(() => setSavedOrgSuccess(false), 3500);
    } catch (err: any) {
      console.error("Failed to save organization profile:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to save organization profile.");
    } finally {
      setSavingOrg(false);
    }
  };

  const addTag = (field: keyof OrgProfile, value: string, setter?: (val: string) => void) => {
    if (!value.trim()) return;
    const currentList = (orgProfile[field] as string[]) || [];
    if (!currentList.includes(value.trim())) {
      setOrgProfile({ ...orgProfile, [field]: [...currentList, value.trim()] });
    }
    if (setter) setter("");
  };

  const removeTag = (field: keyof OrgProfile, itemToRemove: string) => {
    const currentList = (orgProfile[field] as string[]) || [];
    setOrgProfile({
      ...orgProfile,
      [field]: currentList.filter((item) => item !== itemToRemove),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-6xl mx-auto pb-10">
        {/* Executive Header Card */}
        <div className="bg-white px-6 py-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs border border-slate-800">
                <Building2 className="w-5 h-5 text-[#c8102e]" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-base font-bold text-slate-900 tracking-tight">
                    Enterprise Profile & Credentials
                  </h1>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Tender Benchmark Active</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Corporate profile, certifications, and past performance used by AI agents for gap analysis.
                </p>
              </div>
            </div>

            {/* Top Compact Save Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSaveOrgProfile()}
                disabled={savingOrg || loading}
                className="px-4 py-1.5 bg-[#c8102e] hover:bg-[#a00c24] text-white text-xs font-semibold rounded-lg shadow-xs transition duration-150 active:scale-95 disabled:opacity-50"
              >
                {savingOrg ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Certifications</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{orgProfile.certifications.length} Verified</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Clearances</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{orgProfile.clearances.length} Active</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Capabilities</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{orgProfile.core_skills.length} Specializations</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Past Wins</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{orgProfile.past_performance.length} Citations</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Annual Revenue</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{orgProfile.annual_revenue || "—"}</span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Staff Size</span>
              <span className="text-sm font-bold text-slate-800 mt-0.5 block">{orgProfile.employee_count} Team Members</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-16 bg-white rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-[#c8102e]" />
              <span>Loading enterprise profile...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveOrgProfile} className="space-y-5">
            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Left Column: Corporate Identity & Capabilities (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* 1. Corporate Identity */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-700" />
                      <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Corporate Identity
                      </h2>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">Primary Organization Info</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="font-semibold text-slate-700">Company Legal Name</label>
                      <input
                        type="text"
                        value={orgProfile.name}
                        onChange={(e) => setOrgProfile({ ...orgProfile, name: e.target.value })}
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#c8102e] focus:bg-white transition"
                        placeholder="e.g. Apex Enterprise Solutions Inc."
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700">Industry / Domain</label>
                      <input
                        type="text"
                        value={orgProfile.industry}
                        onChange={(e) => setOrgProfile({ ...orgProfile, industry: e.target.value })}
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#c8102e] focus:bg-white transition"
                        placeholder="e.g. Cloud & Defense Modernization"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>Corporate Website</span>
                      </label>
                      <input
                        type="url"
                        value={orgProfile.website}
                        onChange={(e) => setOrgProfile({ ...orgProfile, website: e.target.value })}
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#c8102e] focus:bg-white transition"
                        placeholder="https://company.ai"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Annual Revenue</span>
                      </label>
                      <input
                        type="text"
                        value={orgProfile.annual_revenue}
                        onChange={(e) => setOrgProfile({ ...orgProfile, annual_revenue: e.target.value })}
                        placeholder="e.g. $45M"
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#c8102e] focus:bg-white transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-600" />
                        <span>Staff Headcount</span>
                      </label>
                      <input
                        type="number"
                        value={orgProfile.employee_count}
                        onChange={(e) => setOrgProfile({ ...orgProfile, employee_count: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-50/60 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#c8102e] focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Core Capabilities */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Core Technical Capabilities
                      </h2>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">Match against requirements</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-50/70 border border-slate-200/70 rounded-xl">
                      {orgProfile.core_skills.length === 0 ? (
                        <span className="text-xs text-slate-400 italic p-1">No technical skills added yet.</span>
                      ) : (
                        orgProfile.core_skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded-lg shadow-2xs hover:border-slate-300 transition"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => removeTag("core_skills", skill)}
                              className="text-slate-400 hover:text-rose-600 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add capability (e.g. AWS GovCloud, Kubernetes, DevSecOps)..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#c8102e] transition"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag("core_skills", newSkill, setNewSkill);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => addTag("core_skills", newSkill, setNewSkill)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-500" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Verified Past Performance */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Verified Past Performance Citations
                      </h2>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400">Past Project Wins</span>
                  </div>

                  <div className="space-y-2">
                    {orgProfile.past_performance.length === 0 ? (
                      <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-400 italic">
                        No past performance records added.
                      </div>
                    ) : (
                      orgProfile.past_performance.map((perf) => (
                        <div
                          key={perf}
                          className="flex items-center justify-between p-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 text-slate-800 text-xs font-medium rounded-xl transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{perf}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTag("past_performance", perf)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}

                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={newPastPerf}
                        onChange={(e) => setNewPastPerf(e.target.value)}
                        placeholder="Add project win (e.g. $15M Modernization for Dept of Transportation)..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#c8102e] transition"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag("past_performance", newPastPerf, setNewPastPerf);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => addTag("past_performance", newPastPerf, setNewPastPerf)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-500" />
                        <span>Add Win</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Credentials & Compliance Vault (5 cols) */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* 1. Industry Certifications Vault */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Compliance Certifications
                      </h2>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      {orgProfile.certifications.length} Active
                    </span>
                  </div>

                  {/* Active Certifications Display */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-50/70 border border-slate-200/70 rounded-xl">
                      {orgProfile.certifications.length === 0 ? (
                        <span className="text-xs text-slate-400 italic p-1">No certifications verified.</span>
                      ) : (
                        orgProfile.certifications.map((cert) => (
                          <span
                            key={cert}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 text-slate-800 text-xs font-medium rounded-lg shadow-2xs"
                          >
                            <Award className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{cert}</span>
                            <button
                              type="button"
                              onClick={() => removeTag("certifications", cert)}
                              className="text-slate-400 hover:text-rose-600 ml-0.5 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Quick Add Chips */}
                    <div className="pt-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Quick Add Standard Standards
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {COMMON_CERTS.map((c) => {
                          const active = orgProfile.certifications.includes(c);
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => (active ? removeTag("certifications", c) : addTag("certifications", c))}
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition ${
                                active
                                  ? "bg-slate-900 text-white border-slate-900"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {active ? "✓ " : "+ "}{c}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Cert Input */}
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newCert}
                        onChange={(e) => setNewCert(e.target.value)}
                        placeholder="Add custom certification..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#c8102e] transition"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag("certifications", newCert, setNewCert);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => addTag("certifications", newCert, setNewCert)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-500" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Security Clearances */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#c8102e]" />
                      <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Security Clearances
                      </h2>
                    </div>
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                      {orgProfile.clearances.length} Active
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-50/70 border border-slate-200/70 rounded-xl">
                      {orgProfile.clearances.length === 0 ? (
                        <span className="text-xs text-slate-400 italic p-1">No facility clearances active.</span>
                      ) : (
                        orgProfile.clearances.map((clearance) => (
                          <span
                            key={clearance}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 text-slate-800 text-xs font-medium rounded-lg shadow-2xs"
                          >
                            <ShieldCheck className="w-3 h-3 text-[#c8102e] shrink-0" />
                            <span>{clearance}</span>
                            <button
                              type="button"
                              onClick={() => removeTag("clearances", clearance)}
                              className="text-slate-400 hover:text-rose-600 ml-0.5 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Quick Add Clearances */}
                    <div className="pt-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Common Federal Clearances
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {COMMON_CLEARANCES.map((cl) => {
                          const active = orgProfile.clearances.includes(cl);
                          return (
                            <button
                              key={cl}
                              type="button"
                              onClick={() => (active ? removeTag("clearances", cl) : addTag("clearances", cl))}
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition ${
                                active
                                  ? "bg-slate-900 text-white border-slate-900"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {active ? "✓ " : "+ "}{cl}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Clearance Input */}
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newClearance}
                        onChange={(e) => setNewClearance(e.target.value)}
                        placeholder="Add security clearance..."
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#c8102e] transition"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag("clearances", newClearance, setNewClearance);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => addTag("clearances", newClearance, setNewClearance)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5 text-slate-500" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Status alerts */}
            {savedOrgSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Enterprise Credentials Vault updated successfully. Future RFP analyses will evaluate against this profile.</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Changes take effect across the Multi-Agent Pipeline immediately upon save.
              </span>
              <button
                type="submit"
                disabled={savingOrg}
                className="px-4 py-1.5 bg-[#c8102e] hover:bg-[#a00c24] text-white text-xs font-semibold rounded-lg shadow-xs transition duration-150 active:scale-95 disabled:opacity-50"
              >
                {savingOrg ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
