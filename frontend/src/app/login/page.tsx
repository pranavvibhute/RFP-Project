"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import Link from "next/link";
import { Layers, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { setCookie } from "@/lib/cookie";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
   
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/api/v1/auth/login", {
        email: username,
        password: password,
      });

      const token = res.data.access_token || res.data.token;
      if (token) {
        setCookie("auth_token", token, 7);
        localStorage.setItem("auth_token", token);
        localStorage.setItem("user", JSON.stringify({ username }));
        addToast("Login successful! Redirecting...", "success");
        window.location.href = "/dashboard";
      } else {
        setError("Invalid login response.");
        addToast("Invalid login response.", "error");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      const msg = err.response?.data?.detail || "Invalid username or password.";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111625] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#c8102e] text-white flex items-center justify-center shadow-lg shadow-red-900/30">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Welcome to <span className="text-[#c8102e]">BidWise AI</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">Sign in to access your RFP Analysis Dashboard</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#c8102e] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Email Address / Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin@company.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:border-[#c8102e]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:border-[#c8102e]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#c8102e] hover:bg-[#a00c24] text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>


        <div className="text-center text-xs text-slate-500 font-medium pt-1">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-bold text-[#c8102e] hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
