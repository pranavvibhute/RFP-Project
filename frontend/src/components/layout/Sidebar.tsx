"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  CheckSquare, 
  Users,
  BrainCircuit, 
  ShieldAlert, 
  FileSpreadsheet, 
  Activity, 
  Settings, 
  Search, 
  LogOut,
  Layers
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchVal, setSearchVal] = useState("");

  const navSections = [
    {
      title: "Home",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Upload RFP", href: "/upload", icon: Upload },
      ]
    },
    {
      title: "RFP Management",
      items: [
        { name: "RFPs & Proposals", href: "/rfps", icon: FileText },
        { name: "Requirements Matrix", href: "/requirements", icon: CheckSquare },
        { name: "Customer Intelligence", href: "/customers", icon: Users },
      ]
    },
    {
      title: "AI & Intelligence",
      items: [
        { name: "Document Analysis", href: "/analysis", icon: BrainCircuit },
        { name: "Risk Assessment", href: "/risks", icon: ShieldAlert },
      ]
    },
    {
      title: "Administration",
      items: [
        { name: "Reports & Analytics", href: "/reports", icon: FileSpreadsheet },
        { name: "System Health", href: "/health", icon: Activity },
        { name: "Settings", href: "/settings", icon: Settings },
      ]
    }
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/requirements?search=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal("");
    }
  };

  return (
    <aside className="w-64 bg-[#111625] text-slate-300 min-h-screen flex flex-col justify-between border-r border-slate-800 select-none shrink-0">
      <div>
        {/* Logo Header */}
        <div className="p-5 flex items-center gap-3 border-b border-slate-800/60">
          <div className="w-9 h-9 rounded-xl bg-[#c8102e] flex items-center justify-center text-white shadow-md shadow-red-900/30 font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white tracking-wide">
              BidWise <span className="text-[#c8102e]">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">RFP Analysis Platform</p>
          </div>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search requirements..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-[#1a2133] text-xs text-white placeholder-slate-400 pl-9 pr-3 py-2 rounded-lg border border-slate-700/50 focus:outline-none focus:border-[#c8102e] transition font-medium"
            />
          </div>
        </form>

        {/* Navigation Sections */}
        <nav className="px-3 py-2 space-y-5 text-xs">
          {navSections.map((section, idx) => (
            <div key={idx}>
              <div className="px-3 mb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {section.title}
              </div>
              <ul className="space-y-1">
                {navSections[idx].items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition font-medium ${
                          isActive
                            ? "bg-[#c8102e] text-white shadow-sm font-semibold"
                            : "text-slate-300 hover:bg-[#1a2133] hover:text-white"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer / Logout Button */}
      <div className="p-4 border-t border-slate-800/80">
        <Link
          href="/login"
          onClick={() => localStorage.removeItem("user")}
          className="flex items-center justify-center gap-2 w-full bg-white text-[#c8102e] hover:bg-slate-100 font-bold py-2.5 px-4 rounded-xl shadow transition text-xs"
        >
          <LogOut className="w-4 h-4 text-[#c8102e]" />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
}