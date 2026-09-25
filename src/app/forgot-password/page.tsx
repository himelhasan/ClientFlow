"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [dispatched, setDispatched] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setDispatched(true);
        toast.success("Password reset instructions dispatched!");
      } else {
        toast.error(data.error || "Failed to send reset email");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process request");
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
          <span className="font-extrabold text-2xl text-[#181A1E] tracking-tight">
            ClientFlow
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold text-[#181A1E]">
          Reset Your Password
        </h2>
        <p className="mt-1 text-xs text-[#73767D]">
          Enter your registered email address to receive password recovery instructions.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 sm:p-8 shadow-sm space-y-4">
          {dispatched ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#181A1E]">
                Check your inbox
              </h3>
              <p className="text-xs text-[#73767D]">
                We sent password reset instructions to{" "}
                <strong className="text-[#181A1E]">{email}</strong>. Follow the link in the email to reset your credentials.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#73767D] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-2.5 px-4 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs transition disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs text-[#73767D] font-medium hover:text-[#181A1E]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
