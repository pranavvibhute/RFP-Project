"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Calendar, Bell, Radio, ChevronDown } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getTitle = (path: string) => {
    if (!path || path === "/dashboard" || path === "/") return "Dashboard";
    if (path === "/upload") return "Upload RFP Workspace";
    if (path.startsWith("/rfps")) {
      if (path.split("/").length > 2) return "RFP Document Analysis Details";
      return "RFPs & Proposals Registry";
    }
    if (path === "/requirements") return "Requirements Matrix";
    if (path.startsWith("/customers")) {
      if (path.split("/").length > 2) return "Customer Deep-Dive Intelligence";
      return "Customer Intelligence Hub";
    }
    if (path === "/analysis") return "AI Document Intelligence Logs";
    if (path === "/risks") return "Risk Assessment & Flagged Factors";
    if (path === "/reports") return "Reports & Analytics Export";
    if (path === "/health") return "System Health & Infrastructure";
    if (path === "/settings") return "System Settings & Configuration";

    const base = path.split("/")[1];
    return base.charAt(0).toUpperCase() + base.slice(1);
  };

  const title = getTitle(pathname || "");

  const formattedDate = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-30 shadow-xs select-none">
      {/* Left Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#c8102e] inline-block"></span>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right User Controls & Widget Toolbar */}
      <div className="flex items-center gap-5 text-xs text-slate-600">
        {/* Real Dynamic Date Widget */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-700">
          <span>{formattedDate}</span>
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full border border-emerald-200/60 text-[11px]">
          <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
          <span>System Online</span>
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#c8102e]"></span>
        </button>

        {/* User Profile Dropdown Badge */}
        <div className="relative">
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 pl-3 border-l border-slate-200 cursor-pointer select-none"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#c8102e] to-rose-400 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-white">
                KR
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>

            <div className="hidden sm:block text-left">
              <div className="font-bold text-slate-800 text-xs leading-tight">Kate Russell</div>
              <div className="text-[10px] text-slate-500 font-medium">Bid Director</div>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition" />
          </div>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs font-semibold">
              <Link
                href="/settings"
                onClick={() => setIsProfileOpen(false)}
                className="block px-4 py-2 hover:bg-slate-50 text-slate-700"
              >
                Settings
              </Link>
              <Link
                href="/login"
                onClick={() => {
                  setIsProfileOpen(false);
                  localStorage.removeItem("user");
                }}
                className="block px-4 py-2 hover:bg-slate-50 text-[#c8102e]"
              >
                Logout
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}