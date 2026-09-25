"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Save,
  Loader2,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
} from "lucide-react";

const CATEGORIES = [
  "Salon",
  "Barber",
  "Doctor",
  "Dentist",
  "Clinic",
  "Lawyer",
  "Accountant",
  "Consultant",
  "Tutor",
  "Trainer",
  "Photographer",
  "Car Workshop",
  "AC Repair",
  "Plumber",
  "Electrician",
  "Cleaning Service",
  "Beauty",
  "Fitness",
  "Veterinary",
  "Event Service",
  "Restaurant",
  "Other",
];

const ENV_VARS = [
  {
    key: "META_WA_ACCESS_TOKEN",
    label: "WhatsApp Access Token",
    instructions: "Obtain from Meta Business → System Users → Access Token.",
    service: "WhatsApp",
  },
  {
    key: "META_WA_PHONE_NUMBER_ID",
    label: "WhatsApp Phone Number ID",
    instructions: "Found in Meta Business → WhatsApp → Phone Numbers.",
    service: "WhatsApp",
  },
  {
    key: "SMS_API_KEY",
    label: "SMS Gateway API Key",
    instructions: "Provided by your Bangladesh SMS gateway (e.g. BulkSMSBD, SSL Wireless).",
    service: "SMS",
  },
  {
    key: "RESEND_API_KEY",
    label: "Resend Email API Key",
    instructions: "Generate at resend.com → API Keys.",
    service: "Email",
  },
  {
    key: "JWT_SECRET",
    label: "JWT Secret",
    instructions: "A long, random secret string. Used to sign authentication tokens.",
    service: "Auth",
  },
];

function QuotaBar({
  label,
  used,
  total,
  sublabel,
}: {
  label: string;
  used: number;
  total: number;
  sublabel?: string;
}) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const isHigh = pct >= 80;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5 font-semibold">
        <span className="text-[#181A1E]">{label}</span>
        <span className={isHigh ? "text-[#9E2A2B]" : "text-[#184E37]"}>
          {used.toLocaleString()} / {total.toLocaleString()}
          {isHigh && <span className="ml-1 text-[#9E2A2B]">— Near limit</span>}
        </span>
      </div>
      <div className="w-full h-2.5 bg-[#F8F8FA] rounded-full overflow-hidden border border-[#EAEAEA]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isHigh ? "bg-[#9E2A2B]" : "bg-[#F5C94A]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {sublabel && <p className="text-[11px] text-[#73767D] mt-1">{sublabel}</p>}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 inline-flex items-center px-2.5 py-1 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-[11px] transition"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 mr-1 text-[#184E37]" /> Copied
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 mr-1" /> Copy
        </>
      )}
    </button>
  );
}

export default function SettingsPage() {
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    category: "Other",
    description: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    city: "",
    website: "",
  });

  async function loadSettings() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/settings");
      const data = await res.json();
      if (data.business) {
        setBusiness(data.business);
        setForm({
          name: data.business.name ?? "",
          category: data.business.category ?? "Other",
          description: data.business.description ?? "",
          phone: data.business.phone ?? "",
          whatsapp: data.business.whatsapp ?? "",
          email: data.business.email ?? "",
          address: data.business.address ?? "",
          city: data.business.city ?? "",
          website: data.business.website ?? "",
        });
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch("/api/v1/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setBusiness(data.business);
      setToast("Business profile updated successfully.");
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      setToast(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value })),
    };
  }

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
      </div>
    );
  }

  const inputCls =
    "w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs font-medium text-[#181A1E] placeholder:text-[#73767D] focus:border-[#F5C94A] focus:outline-none transition";

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#181A1E]" />
          Business Settings
        </h1>
        <p className="text-xs text-[#73767D] mt-1">
          Manage your business profile, integration credentials, and subscription overview.
        </p>
      </div>

      {/* ── SECTION 1: Business Profile ────────────────────────────────────── */}
      <form onSubmit={handleSave} className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-5">
        <div className="pb-4 border-b border-[#EAEAEA] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#181A1E]" />
          <h2 className="text-sm font-bold text-[#181A1E]">Business Profile</h2>
        </div>

        <div className="space-y-5">
          {/* Name + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#73767D] mb-1.5">Business Name</label>
              <input type="text" {...field("name")} placeholder="e.g. Radiant Salon" className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#73767D] mb-1.5">Category</label>
              <select {...field("category")} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#73767D] mb-1.5">Description</label>
            <textarea
              {...field("description")}
              rows={3}
              placeholder="Briefly describe your business, services offered, and what makes you unique."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Phone + WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#73767D] mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Phone
              </label>
              <input type="text" {...field("phone")} placeholder="017XXXXXXXX" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#73767D] mb-1.5 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-[#184E37]" /> WhatsApp
              </label>
              <input type="text" {...field("whatsapp")} placeholder="017XXXXXXXX" className={inputCls} />
            </div>
          </div>

          {/* Email + Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#73767D] mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <input type="email" {...field("email")} placeholder="hello@yourbusiness.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#73767D] mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Website
              </label>
              <input type="url" {...field("website")} placeholder="https://yourbusiness.com" className={inputCls} />
            </div>
          </div>

          {/* Address + City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#73767D] mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Address
              </label>
              <input type="text" {...field("address")} placeholder="Street / Area" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#73767D] mb-1.5">City</label>
              <input type="text" {...field("city")} placeholder="Dhaka" className={inputCls} />
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold ${
                toast.startsWith("Error")
                  ? "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]"
                  : "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]"
              }`}
            >
              {toast.startsWith("Error") ? (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              )}
              {toast}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-5 py-2.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs disabled:opacity-60 transition"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-2" /> Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* ── SECTION 2: Integration Credentials ────────────────────────────── */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-5">
        <div className="pb-4 border-b border-[#EAEAEA] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#181A1E]" />
          <h2 className="text-sm font-bold text-[#181A1E]">Integration Credentials</h2>
        </div>

        <div className="space-y-5">
          {/* Callout */}
          <div className="flex items-start gap-3 bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6] rounded-[14px] p-4">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed">
              <strong>To activate WhatsApp, SMS, or Email messaging</strong>, contact your server
              administrator to set the required credentials in the <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#EAEAEA] text-[#181A1E]">.env</code> file
              on the server. These values are never stored in the database for security reasons.
            </p>
          </div>

          {/* Env var table */}
          <div className="space-y-2.5">
            {ENV_VARS.map((v) => {
              return (
                <div key={v.key} className="flex items-start gap-4 bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs font-mono font-bold text-[#181A1E] bg-white px-2 py-0.5 rounded border border-[#EAEAEA]">
                        {v.key}
                      </code>
                      <CopyButton text={v.key} />
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]">
                        {v.service}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#73767D] mt-1.5 leading-relaxed">{v.instructions}</p>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]">
                      Not configured
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-[#73767D] leading-relaxed">
            Set these variables in your server&apos;s <code className="font-mono text-[#181A1E]">.env</code> file (or
            deployment environment variables) and restart the application. They are never visible
            in the dashboard.
          </p>
        </div>
      </div>

      {/* ── SECTION 3: Plan & Quota ────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-5">
        <div className="pb-4 border-b border-[#EAEAEA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#181A1E]" />
            <h2 className="text-sm font-bold text-[#181A1E]">Plan &amp; Quota</h2>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]">
            {business?.subscriptionPlan ?? "Starter"}
          </span>
        </div>

        <div className="space-y-5">
          <p className="text-xs text-[#73767D]">
            Your current usage against this billing cycle&apos;s communication quota. Quotas reset
            monthly. Contact support to upgrade your plan.
          </p>

          <QuotaBar
            label="Lead Volume"
            used={business?.leadsUsed ?? 0}
            total={business?.leadQuota ?? 50}
            sublabel="1 lead counted once per unique customer"
          />
          <QuotaBar
            label="WhatsApp Outbound"
            used={business?.whatsappUsed ?? 0}
            total={business?.whatsappQuota ?? 150}
            sublabel="3 included WhatsApp messages per lead"
          />
          <QuotaBar
            label="SMS Outbound"
            used={business?.smsUsed ?? 0}
            total={business?.smsQuota ?? 100}
            sublabel="2 included SMS messages per lead"
          />
          <QuotaBar
            label="Email Outbound"
            used={business?.emailUsed ?? 0}
            total={business?.emailQuota ?? 150}
            sublabel="3 included emails per lead"
          />
        </div>
      </div>
    </div>
  );
}
