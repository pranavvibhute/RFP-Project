
"use client";

import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

interface ToastProps {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  onDismiss: () => void;
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  const baseClasses = "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium";
  
  let typeClasses = "";
  let IconComponent = Info;

  switch (type) {
    case "success":
      typeClasses = "bg-emerald-50 border border-emerald-200 text-emerald-800";
      IconComponent = CheckCircle;
      break;
    case "error":
      typeClasses = "bg-rose-50 border border-rose-200 text-rose-800";
      IconComponent = AlertCircle;
      break;
    case "info":
    default:
      typeClasses = "bg-blue-50 border border-blue-200 text-blue-800";
      IconComponent = Info;
      break;
  }

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      <IconComponent className="w-5 h-5 shrink-0" />
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-auto text-slate-500 hover:text-slate-800">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
