"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        toast.success("Password updated successfully!");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
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
          Set New Password
        </h2>
        <p className="mt-1 text-xs text-[#73767D]">
          Enter your new account password below.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 sm:p-8 shadow-sm space-y-4">
          {success ? (
            <div className="text-center py-4 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-[#181A1E]">
                Password successfully updated!
              </h3>
              <p className="text-xs text-[#73767D]">
                Redirecting you to the sign in page...
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#73767D] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#73767D] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  <span>Update Password</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
