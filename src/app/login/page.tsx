"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#181A1E] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-[#F5C94A] flex items-center justify-center text-[#181A1E] font-bold text-xl">
            CF
          </div>
          <span className="font-extrabold text-2xl text-[#181A1E] tracking-tight">ClientFlow</span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-[#181A1E]">
          Sign in to your dashboard
        </h2>
        <p className="mt-1 text-sm text-[#73767D]">
          Manage bookings, leads, customers, and automations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 sm:p-10 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          {error && (
            <div className="mb-6 p-4 rounded-[14px] bg-[#FAD4D6] border border-[#EAEAEA] text-sm text-[#181A1E] font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase tracking-wider mb-1">
                Mobile Number or Email
              </label>
              <input
                type="text"
                required
                placeholder="017XXXXXXXX or email@domain.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center py-3 px-4 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-sm transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#73767D]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#181A1E] font-semibold hover:underline">
              Create a workspace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
