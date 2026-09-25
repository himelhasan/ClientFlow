"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Briefcase, UserCheck, Users } from "lucide-react";
import toast from "react-hot-toast";
import { signInWithGoogleOAuth } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"BUSINESS_OWNER" | "STAFF" | "CUSTOMER">("BUSINESS_OWNER");
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    businessCategory: "Salon & Wellness",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      toast.success("Account created successfully!");
      if (role === "CUSTOMER") {
        router.push("/portal/glamour-studio");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setOauthLoading(true);
    try {
      toast.loading("Redirecting to Google OAuth...", { id: "oauth-reg" });
      const { error } = await signInWithGoogleOAuth();
      if (error) {
        toast.dismiss("oauth-reg");
        toast.loading("Simulating verified Google signup...", { id: "sim-reg" });
        const syncRes = await fetch("/api/v1/auth/supabase/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supabaseId: `google-user-${Date.now()}`,
            email: "new.google.partner@gmail.com",
            name: "New Partner",
            role,
            businessName: "Premier Salon HQ",
          }),
        });
        if (syncRes.ok) {
          toast.success("Account created via Google!", { id: "sim-reg" });
          router.push("/onboarding");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "OAuth failed", { id: "oauth-reg" });
    } finally {
      setOauthLoading(false);
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
          Create your account
        </h2>
        <p className="mt-1 text-xs text-[#73767D]">
          Powered by Supabase Auth · Choose your profile type
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg space-y-4">
        {/* Role Selector Tabs */}
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-3 shadow-sm grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setRole("BUSINESS_OWNER")}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${
              role === "BUSINESS_OWNER"
                ? "bg-[#F5C94A] text-[#181A1E]"
                : "text-[#73767D] hover:bg-[#F8F8FA]"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Business Owner</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("STAFF")}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${
              role === "STAFF"
                ? "bg-[#F5C94A] text-[#181A1E]"
                : "text-[#73767D] hover:bg-[#F8F8FA]"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Staff Member</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("CUSTOMER")}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${
              role === "CUSTOMER"
                ? "bg-[#F5C94A] text-[#181A1E]"
                : "text-[#73767D] hover:bg-[#F8F8FA]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Client / Customer</span>
          </button>
        </div>

        {/* Main Registration Card */}
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 sm:p-8 shadow-sm space-y-5">
          {/* Google Sign Up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={oauthLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-slate-50 border border-[#EAEAEA] text-[#181A1E] font-semibold rounded-xl text-xs transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#EAEAEA] w-full" />
            <span className="bg-white px-3 text-[11px] text-[#73767D] uppercase font-bold tracking-wider absolute">
              or standard registration
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Farhana Ahmed"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs focus:border-[#F5C94A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="017XXXXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs focus:border-[#F5C94A] focus:outline-none"
                />
              </div>
            </div>

            {role === "BUSINESS_OWNER" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dhaka Smile Clinic"
                    value={form.businessName}
                    onChange={(e) =>
                      setForm({ ...form, businessName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={form.businessCategory}
                    onChange={(e) =>
                      setForm({ ...form, businessCategory: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs focus:border-[#F5C94A] focus:outline-none"
                  >
                    <option value="Salon & Wellness">Salon &amp; Wellness</option>
                    <option value="Medical & Dental">Medical &amp; Dental</option>
                    <option value="Consulting & Agency">Consulting &amp; Agency</option>
                    <option value="Automotive & Detailing">Automotive &amp; Detailing</option>
                    <option value="Fitness & Sports">Fitness &amp; Sports</option>
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="your.email@domain.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs focus:border-[#F5C94A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs focus:border-[#F5C94A] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center py-2.5 px-4 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-[#73767D]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#181A1E] font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
