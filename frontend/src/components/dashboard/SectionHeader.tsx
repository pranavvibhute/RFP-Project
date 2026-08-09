import { LucideIcon } from "lucide-react";

interface StatItem {
  label: string;
  value: string | number;
}

interface Props {
  icon: LucideIcon;
  title: string;
  stats: StatItem[];
}

export default function SectionHeader({ icon: Icon, title, stats }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-1 border-b border-slate-200">
      {/* Title & Icon Badge */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#c8102e] text-white flex items-center justify-center shadow-xs">
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="text-base font-bold text-slate-800 tracking-tight">
          {title}
        </h2>
      </div>

      {/* Inline Statistics Strip */}
      <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-2xs">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">{stat.label}:</span>
            <span className="text-slate-900 font-bold">{stat.value}</span>
            {index < stats.length - 1 && <span className="text-slate-300 ml-2">|</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
