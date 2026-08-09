"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CheckSquare, Filter, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface RequirementItem {
  id: number;
  category: string;
  priority: string;
  requirement: string;
  rfp_title: string;
  customer_name: string;
  status: string;
}

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState<RequirementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchFilter, setSearchFilter] = useState("");

  const fetchRequirements = async () => {
    try {
      const res = await axios.get<RequirementItem[]>(`${API_BASE_URL}/api/v1/requirements`);
      setRequirements(res.data);
    } catch (err) {
      console.error("Failed to fetch requirements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const query = params.get("search");
      if (query) {
        setSearchFilter(query);
      }
    }
  }, []);

  // Listen to popstate / browser back button to sync search query
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        setSearchFilter(params.get("search") || "");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleStatusChange = async (reqId: number, newStatus: string) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/v1/requirements/${reqId}/compliance`, {
        status: newStatus,
      });
      const updated = requirements.map((r) =>
        r.id === reqId ? { ...r, status: newStatus } : r
      );
      setRequirements(updated);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const clearSearch = () => {
    setSearchFilter("");
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  };

  const filteredRequirements = requirements.filter((req) => {
    const categoryMatches = selectedCategory === "All" || req.category.toLowerCase() === selectedCategory.toLowerCase();
    const searchMatches = !searchFilter.trim() || 
      req.requirement.toLowerCase().includes(searchFilter.toLowerCase()) || 
      req.rfp_title.toLowerCase().includes(searchFilter.toLowerCase());
    return categoryMatches && searchMatches;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c8102e]"></span>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Requirements Matrix</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">Consolidated view of all extracted requirements across active RFPs stored in database.</p>
        </div>

        {/* Filters and Active Search Panel */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-400 uppercase mr-2">Filter Category:</span>
            {["All", "Mandatory", "Technical", "Commercial", "Security"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  selectedCategory === cat
                    ? "bg-[#c8102e] text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {searchFilter && (
            <div className="flex items-center gap-2 bg-rose-50 text-[#c8102e] border border-rose-200/60 px-3 py-1 rounded-lg text-xs font-bold shadow-2xs">
              <span>Search: "{searchFilter}"</span>
              <button onClick={clearSearch} className="hover:text-red-800 transition">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#c8102e]" />
              <span>Loading requirements matrix from database...</span>
            </div>
          ) : filteredRequirements.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium">
              No matching specifications found in database.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="p-4">RFP TITLE & CATEGORY</th>
                  <th className="p-4">PRIORITY</th>
                  <th className="p-4">REQUIREMENT SPECIFICATION</th>
                  <th className="p-4">COMPLIANCE STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequirements.map((req, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{req.rfp_title}</div>
                      <div className="text-[10px] text-[#c8102e] font-semibold">{req.category}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        (req.priority || "").toLowerCase() === "high" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"
                      }`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{req.requirement}</td>
                    <td className="p-4">
                      <select
                        value={req.status || "Verified Compliant"}
                        onChange={(e) => handleStatusChange(req.id, e.target.value)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded border focus:outline-none transition cursor-pointer ${
                          req.status === "Verified Compliant"
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : req.status === "Non-Compliant"
                            ? "text-rose-700 bg-rose-50 border-rose-200"
                            : "text-amber-700 bg-amber-50 border-amber-200"
                        }`}
                      >
                        <option value="Verified Compliant">Verified Compliant</option>
                        <option value="Review Required">Review Required</option>
                        <option value="Non-Compliant">Non-Compliant</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
