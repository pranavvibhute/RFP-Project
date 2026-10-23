"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";
import { useDateRange } from "./DateRangeProvider";

export default function DateRangePicker() {
  const { period, setPeriod, customStart, customEnd, setCustomRange } = useDateRange();
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState<Date | null>(customStart);
  const [tempEnd, setTempEnd] = useState<Date | null>(customEnd);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const periodLabels: Record<string, string> = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    "custom": "Custom range",
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const applyCustomRange = () => {
    setCustomRange(tempStart, tempEnd);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (period === "custom" && customStart && customEnd) {
      return `${formatDate(customStart)} - ${formatDate(customEnd)}`;
    }
    return periodLabels[period];
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-[#c8102e] transition"
      >
        <Calendar className="w-3.5 h-3.5 text-[#c8102e]" />
        <span className="truncate max-w-[160px]">{getDisplayText()}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-4 min-w-[280px] animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="space-y-3">
            {["7d", "30d", "90d"].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p as any);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  period === p
                    ? "bg-[#c8102e] text-white"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {period === p && <span className="w-2 h-2 rounded-full bg-white" />}
                <span>{periodLabels[p]}</span>
              </button>
            ))}

            <div className="border-t border-slate-200 pt-3" />
            
            <button
              onClick={() => {
                setPeriod("custom");
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                period === "custom"
                  ? "bg-[#c8102e] text-white"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {period === "custom" && <span className="w-2 h-2 rounded-full bg-white" />}
              <span>Custom range</span>
            </button>

            {period === "custom" && (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={tempStart ? tempStart.toISOString().split("T")[0] : ""}
                    onChange={(e) => setTempStart(e.target.value ? new Date(e.target.value) : null)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#c8102e]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={tempEnd ? tempEnd.toISOString().split("T")[0] : ""}
                    onChange={(e) => setTempEnd(e.target.value ? new Date(e.target.value) : null)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-[#c8102e]"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={applyCustomRange}
                    className="flex-1 px-3 py-2 bg-[#c8102e] text-white text-sm font-medium rounded-lg hover:bg-[#a00c24] transition"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => {
                      setTempStart(null);
                      setTempEnd(null);
                      setCustomRange(null, null);
                      setPeriod("30d");
                    }}
                    className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}