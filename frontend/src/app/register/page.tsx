"use client";

import { useState } from "react";
import Link from "next/link";
import { Layers, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, {
        full_name: fullName,
        email,
        password,
      });
      // Store user details in localStorage
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Registration failed:", err);
      const msg = err.response?.data?.detail || "Registration failed. Try a different email.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111625] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#c8102e] text-white flex items-center justify-center shadow-lg shadow-red-900/30">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Create Account
          </h1>
          <p className="text-xs text-slate-500 font-medium">Join BidWise AI to streamline your proposal reviews</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#c8102e] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Kate Russell"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:border-[#c8102e]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Email Address</label>
            <input
              type="email"
              placeholder="kate@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-900 focus:outline-none focus:border-[#c8102e]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700">Password</label>
            <input
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 font-medium pt-2">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#c8102e] hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}
