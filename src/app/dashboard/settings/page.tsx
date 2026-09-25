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
        <span className="text-slate-700">{label}</span>
        <span className={isHigh ? "text-red-600" : "text-emerald-700"}>
          {used.toLocaleString()} / {total.toLocaleString()}
          {isHigh && <span className="ml-1 text-red-500">— Near limit</span>}
        </span>
      </div>
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isHigh ? "bg-red-500" : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {sublabel && <p className="text-[11px] text-slate-400 mt-1">{sublabel}</p>}
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
      className="ml-2 inline-flex items-center px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 mr-1 text-emerald-600" /> Copied
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const inputCls =
    "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition";

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-600" />
          Business Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your business profile, integration credentials, and subscription overview.
        </p>
      </div>

      {/* ── SECTION 1: Business Profile ────────────────────────────────────── */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">Business Profile</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Name + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Business Name</label>
              <input type="text" {...field("name")} placeholder="e.g. Radiant Salon" className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category</label>
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
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
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
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Phone
              </label>
              <input type="text" {...field("phone")} placeholder="017XXXXXXXX" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
              </label>
              <input type="text" {...field("whatsapp")} placeholder="017XXXXXXXX" className={inputCls} />
            </div>
          </div>

          {/* Email + Website */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Email
              </label>
              <input type="email" {...field("email")} placeholder="hello@yourbusiness.com" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Website
              </label>
              <input type="url" {...field("website")} placeholder="https://yourbusiness.com" className={inputCls} />
            </div>
          </div>

          {/* Address + City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Address
              </label>
              <input type="text" {...field("address")} placeholder="Street / Area" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">City</label>
              <input type="text" {...field("city")} placeholder="Dhaka" className={inputCls} />
            </div>
          </div>

          {/* Toast */}
          {toast && (
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold border ${
                toast.startsWith("Error")
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
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
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition"
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
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900">Integration Credentials</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Callout */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>To activate WhatsApp, SMS, or Email messaging</strong>, contact your server
              administrator to set the required credentials in the <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">.env</code> file
              on the server. These values are never stored in the database for security reasons.
            </p>
          </div>

          {/* Env var table */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {ENV_VARS.map((v) => {
              // We cannot read actual env vars on the client — show the variable names for the admin
              const isSet = false; // Always false on client; admin must verify server-side
              return (
                <div key={v.key} className="flex items-start gap-4 px-4 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {v.key}
                      </code>
                      <CopyButton text={v.key} />
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {v.service}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{v.instructions}</p>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border bg-slate-100 text-slate-500 border-slate-200">
                      Not configured
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Set these variables in your server&apos;s <code className="font-mono">.env</code> file (or
            deployment environment variables) and restart the application. They are never visible
            in the dashboard.
          </p>
        </div>
      </div>

      {/* ── SECTION 3: Plan & Quota ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Plan &amp; Quota</h2>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            {business?.subscriptionPlan ?? "Starter"}
          </span>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-500">
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
