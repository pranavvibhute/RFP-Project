"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type DateRangePeriod = "7d" | "30d" | "90d" | "custom";

interface DateRangeContextType {
  period: DateRangePeriod;
  customStart: Date | null;
  customEnd: Date | null;
  setPeriod: (period: DateRangePeriod) => void;
  setCustomRange: (start: Date | null, end: Date | null) => void;
  getApiParams: () => { period: string; weeks: number };
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<DateRangePeriod>("30d");
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);

  const setCustomRange = (start: Date | null, end: Date | null) => {
    setCustomStart(start);
    setCustomEnd(end);
    if (start && end) {
      setPeriod("custom");
    }
  };

  const getApiParams = () => {
    switch (period) {
      case "7d":
        return { period: "weekly", weeks: 1 };
      case "30d":
        return { period: "weekly", weeks: 4 };
      case "90d":
        return { period: "weekly", weeks: 12 };
      case "custom":
        if (customStart && customEnd) {
          const diffDays = Math.ceil((customEnd.getTime() - customStart.getTime()) / (1000 * 60 * 60 * 24));
          const weeks = Math.max(1, Math.ceil(diffDays / 7));
          return { period: "weekly", weeks };
        }
        return { period: "weekly", weeks: 4 };
    }
  };

  return (
    <DateRangeContext.Provider value={{ period, customStart, customEnd, setPeriod, setCustomRange, getApiParams }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error("useDateRange must be used within a DateRangeProvider");
  }
  return context;
}