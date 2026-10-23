"use client";

import { useEffect, useState } from "react";
import { 
  AlertTriangle, 
  Clock, 
  FileEdit, 
  ShieldAlert, 
  TrendingUp, 
  ArrowRight,
  Loader2,
  Bell
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, getActiveToken } from "@/lib/api";
import { useDateRange } from "@/components/ui/DateRangeProvider";

interface InsightItem {
  id: string;
  type: "deadline" | "risk" | "incomplete" | "opportunity";
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  priority: "high" | "medium" | "low";
  timestamp: string;
}

interface RFPItem {
  id: number;
  title: string;
  customer_name: string;
  status: string;
  deadline?: string;
  risk_score?: string;
  progress?: number;
}

interface DashboardMetrics {
  recent_extractions: RFPItem[];
  incomplete_profiles: Array<{ id: number; name: string; customer: string; progress: number }>;
  compliance: {
    rate: number;
    non_compliant: number;
  };
}

export default function ActionableInsightsSection() {
  const router = useRouter();
  const { getApiParams } = useDateRange();
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    // Redirect to login if no auth token
    if (!getActiveToken()) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const params = getApiParams();
      const [dashboardRes, rfpsRes] = await Promise.all([
        api.get<DashboardMetrics>("/api/v1/rfps/dashboard"),
        api.get<{ requirements: any[] }>("/api/v1/requirements"),
      ]);

      const dashboard = dashboardRes.data;
      const newInsights: InsightItem[] = [];

      // 1. Upcoming deadlines (within 14 days)
      if (dashboard.recent_extractions) {
        const now = new Date();
        const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        
        dashboard.recent_extractions.forEach(rfp => {
          if (rfp.deadline && rfp.deadline !== "TBD") {
            try {
              const deadlineDate = new Date(rfp.deadline);
              if (deadlineDate >= now && deadlineDate <= twoWeeks) {
                const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                newInsights.push({
                  id: `deadline-${rfp.id}`,
                  type: "deadline",
                  title: `${rfp.title} due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`,
                  description: `Submission deadline for ${rfp.customer_name || "customer"} is approaching`,
                  actionLabel: "View RFP",
                  actionHref: `/rfps/${rfp.id}`,
                  priority: daysLeft <= 3 ? "high" : "medium",
                  timestamp: deadlineDate.toISOString(),
                });
              }
            } catch (e) {
              // Invalid date format, skip
            }
          }
        });
      }

      // 2. High-risk RFPs
      if (dashboard.recent_extractions) {
        dashboard.recent_extractions.forEach(rfp => {
          if (rfp.risk_score && rfp.risk_score.toLowerCase() === "high") {
            newInsights.push({
              id: `risk-${rfp.id}`,
              type: "risk",
              title: `High risk: ${rfp.title}`,
              description: `${rfp.customer_name || "Customer"} RFP flagged as high risk`,
              actionLabel: "Review Risks",
              actionHref: `/risks?rfp=${rfp.id}`,
              priority: "high",
              timestamp: new Date().toISOString(),
            });
          }
        });
      }

      // 3. Incomplete profiles blocking pipeline
      if (dashboard.incomplete_profiles && dashboard.incomplete_profiles.length > 0) {
        dashboard.incomplete_profiles.slice(0, 3).forEach(profile => {
          newInsights.push({
            id: `incomplete-${profile.id}`,
            type: "incomplete",
            title: `Incomplete profile: ${profile.name}`,
            description: `${profile.customer} profile is ${profile.progress}% complete - missing metadata`,
            actionLabel: "Complete Profile",
            actionHref: `/rfps/${profile.id}`,
            priority: profile.progress < 50 ? "high" : "medium",
            timestamp: new Date().toISOString(),
          });
        });
      }

      // 4. Non-compliant requirements
      if (dashboard.compliance && dashboard.compliance.non_compliant > 0) {
        newInsights.push({
          id: "non-compliant-requirements",
          type: "risk",
          title: `${dashboard.compliance.non_compliant} non-compliant requirements`,
          description: "Requirements need immediate review and remediation",
          actionLabel: "Review Compliance",
          actionHref: "/requirements?filter=non_compliant",
          priority: "high",
          timestamp: new Date().toISOString(),
        });
      }

      // 5. Opportunity insights - RFPs with good progress
      if (dashboard.recent_extractions) {
        const readyRfps = dashboard.recent_extractions.filter(
          r => r.status === "under_review" && r.risk_score && r.risk_score.toLowerCase() !== "high"
        ).slice(0, 2);
        
        readyRfps.forEach(rfp => {
          newInsights.push({
            id: `opportunity-${rfp.id}`,
            type: "opportunity",
            title: `Ready to bid: ${rfp.title}`,
            description: `${rfp.customer_name || "Customer"} RFP analyzed and ready for proposal`,
            actionLabel: "Start Proposal",
            actionHref: `/rfps/${rfp.id}`,
            priority: "medium",
            timestamp: new Date().toISOString(),
          });
        });
      }

      // Sort by priority (high first) then by timestamp
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      newInsights.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setInsights(newInsights.slice(0, 8));
    } catch (err) {
      console.error("Failed to load insights:", err);
      setError("Failed to load actionable insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchInsights();
  };

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-50 rounded-xl border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center">
        <Bell className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Unable to load insights</h3>
        <p className="text-xs text-slate-500 mb-3">{error}</p>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#c8102e] text-white rounded-lg text-xs font-medium hover:bg-[#a00c24] transition"
        >
          <Loader2 className="w-3 h-3" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
        <TrendingUp className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-900 mb-1">All caught up!</h3>
        <p className="text-xs text-slate-500">No urgent actions needed at this time.</p>
      </div>
    );
  }

  const getIcon = (type: InsightItem["type"]) => {
    switch (type) {
      case "deadline": return <Clock className="w-5 h-5 text-amber-600" />;
      case "risk": return <ShieldAlert className="w-5 h-5 text-rose-600" />;
      case "incomplete": return <FileEdit className="w-5 h-5 text-blue-600" />;
      case "opportunity": return <TrendingUp className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getPriorityColor = (priority: InsightItem["priority"]) => {
    switch (priority) {
      case "high": return "bg-rose-100 text-rose-700 border-rose-200";
      case "medium": return "bg-amber-100 text-amber-700 border-amber-200";
      case "low": return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <Bell className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Actionable Insights
          </h3>
        </div>
        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          {insights.length} actions
        </span>
      </div>

      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
        {insights.map((insight) => (
          <Link
            key={insight.id}
            href={insight.actionHref}
            className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl border border-slate-100 transition group"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50">
              {getIcon(insight.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-800 text-sm truncate pr-2">{insight.title}</h4>
                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${getPriorityColor(insight.priority)}`}>
                  {insight.priority.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">{insight.description}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] font-medium text-[#c8102e] group-hover:underline">
                  {insight.actionLabel}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#c8102e] transition" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {insights.length > 4 && (
        <div className="pt-2 border-t border-slate-100">
          <Link
            href="/reports"
            className="flex items-center justify-center gap-1.5 text-sm font-semibold text-[#c8102e] hover:underline"
          >
            View all insights
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}