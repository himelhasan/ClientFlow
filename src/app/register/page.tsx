"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    businessCategory: "Salon",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      // Automatically transition to guided business onboarding
      router.push("/onboarding");
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
          Create your business workspace
        </h2>
        <p className="mt-1 text-sm text-[#73767D]">
          Start capturing leads and appointment bookings in minutes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 sm:p-10 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          {error && (
            <div className="mb-6 p-4 rounded-[14px] bg-[#FAD4D6] border border-[#EAEAEA] text-sm text-[#181A1E] font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase tracking-wider mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tanvir Ahmed"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase tracking-wider mb-1">
                Business Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dhaka Dental Care or Style Lounge"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase tracking-wider mb-1">
                Business Category
              </label>
              <select
                value={form.businessCategory}
                onChange={(e) => setForm({ ...form, businessCategory: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
              >
                <option value="Salon">Salon & Beauty Parlour</option>
                <option value="Barber">Barbershop</option>
                <option value="Doctor">Doctor / Medical Practitioner</option>
                <option value="Dentist">Dentist / Dental Clinic</option>
                <option value="Clinic">Specialized Clinic</option>
                <option value="Consultant">Consultant / Agency</option>
                <option value="Lawyer">Law Firm / Advocate</option>
                <option value="AC Repair">AC / Appliance Repair</option>
                <option value="Car Workshop">Automobile Workshop</option>
                <option value="Photographer">Photography Studio</option>
                <option value="Tutor">Coaching / Tutor</option>
                <option value="Fitness">Gym & Fitness Trainer</option>
                <option value="Home Service">Home Cleaning / Service</option>
                <option value="Other">Other Services</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] uppercase tracking-wider mb-1">
                  Mobile Number (BD)
                </label>
                <input
                  type="text"
                  required
                  placeholder="017XXXXXXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#181A1E] uppercase tracking-wider mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                  <span>Create Workspace & Start Setup</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-[#73767D]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#181A1E] font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
