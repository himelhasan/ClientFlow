"use client";

import { Fragment, useEffect, useState } from "react";
import {
  Target,
  MessageCircle,
  Phone,
  Loader2,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Sparkles,
  Flame,
  Zap,
  Snowflake,
} from "lucide-react";
import { formatBdDateTime, formatBdDate } from "@/lib/utils/bangladesh";

// ─── Types ──────────────────────────────────────────────────────────────────

interface LeadEvent {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface Lead {
  id: string;
  source: string;
  status: string;
  title: string | null;
  notes: string | null;
  aiScore?: number | null;
  aiQualification?: "HOT" | "WARM" | "COLD" | string | null;
  aiSummary?: string | null;
  recommendedAction?: string | null;
  whatsappSent: number;
  smsSent: number;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
  };
  form: { name: string } | null;
  bookings: { id: string; service: { name: string } }[];
  events: LeadEvent[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LEAD_SOURCES = [
  "WEBSITE",
  "FACEBOOK",
  "INSTAGRAM",
  "WHATSAPP",
  "GOOGLE",
  "QR_CODE",
  "SMS",
  "PHONE",
  "MANUAL",
  "OTHER",
] as const;

const SOURCE_FILTER_PILLS = [
  "ALL",
  "WEBSITE",
  "FACEBOOK",
  "INSTAGRAM",
  "WHATSAPP",
  "MANUAL",
] as const;

const STATUS_OPTIONS = [
  "ALL",
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "QUOTE_SENT",
  "BOOKING_PENDING",
  "BOOKED",
  "COMPLETED",
  "LOST",
  "CANCELLED",
] as const;

const STATUS_STYLES: Record<string, string> = {
  NEW: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  CONTACTED: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
  QUALIFIED: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
  QUOTE_SENT: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  BOOKING_PENDING: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  BOOKED: "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]",
  COMPLETED: "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]",
  LOST: "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]",
  CANCELLED: "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]",
};

const SOURCE_COLORS: Record<string, string> = {
  WEBSITE: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
  FACEBOOK: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
  INSTAGRAM: "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]",
  WHATSAPP: "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]",
  GOOGLE: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  MANUAL: "bg-[#F3F1E8] text-[#262930] border border-[#EAEAEA]",
};

function computeClientSideFallbackScore(lead: Lead) {
  if (lead.aiScore != null && lead.aiQualification) {
    return {
      aiScore: lead.aiScore,
      aiQualification: lead.aiQualification,
      aiSummary:
        lead.aiSummary ||
        `AI scored ${lead.aiScore}/100 (${lead.aiQualification}) based on ${lead.source} intent and service inquiry.`,
    };
  }
  const text = `${lead.title || ""} ${lead.notes || ""}`.toLowerCase();
  let score = 64;
  if (lead.source === "WHATSAPP" || lead.source === "PHONE") score += 14;
  if (/urgent|today|tomorrow|bridal|package|vip|serial/.test(text)) score += 15;
  if (lead.status === "BOOKED" || lead.status === "QUALIFIED") score = Math.max(score, 86);
  if (lead.status === "LOST" || lead.status === "CANCELLED") score = 28;
  score = Math.min(98, Math.max(20, score));
  const qual = score >= 76 ? "HOT" : score >= 52 ? "WARM" : "COLD";
  return {
    aiScore: score,
    aiQualification: qual,
    aiSummary:
      qual === "HOT"
        ? `High-intent ${lead.source} inquiry (${score}/100). Strong readiness to book ${lead.title || "appointment"}.`
        : qual === "WARM"
        ? `Moderate-intent ${lead.source} lead (${score}/100). Share service pricing and available slots.`
        : `Early-stage inquiry (${score}/100). Enroll in automated WhatsApp follow-up sequence.`,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LeadsPipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [qualifyingId, setQualifyingId] = useState<string | null>(null);
  const [bulkQualifying, setBulkQualifying] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [aiFilter, setAiFilter] = useState("ALL");

  // Add Lead form
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const emptyForm = {
    customerName: "",
    customerPhone: "",
    source: "MANUAL" as string,
    title: "",
    notes: "",
  };
  const [newForm, setNewForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  // ── Data loading ──
  async function loadLeads() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (sourceFilter !== "ALL") params.set("source", sourceFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/v1/leads?${params}`);
      const data = await res.json();
      const rawLeads: Lead[] = data.leads || [];
      setLeads(
        rawLeads.map((l) => ({
          ...l,
          ...computeClientSideFallbackScore(l),
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFilter, statusFilter]);

  // ── Single Lead AI Qualification ──
  async function handleQualifyLead(lead: Lead, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    setQualifyingId(lead.id);
    try {
      const res = await fetch("/api/v1/ai/suite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "QUALIFY_LEAD",
          leadId: lead.id,
          customLead: {
            title: lead.title,
            notes: lead.notes,
            source: lead.source,
            status: lead.status,
            customerName: lead.customer?.name,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.aiScore != null) {
        setLeads((prev) =>
          prev.map((item) =>
            item.id === lead.id
              ? {
                  ...item,
                  aiScore: data.aiScore,
                  aiQualification: data.aiQualification,
                  aiSummary: data.aiSummary,
                  recommendedAction: data.recommendedAction,
                }
              : item
          )
        );
        setExpandedId(lead.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setQualifyingId(null);
    }
  }

  // ── Bulk AI Qualification ──
  async function handleBulkQualify() {
    setBulkQualifying(true);
    try {
      const res = await fetch("/api/v1/ai/suite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "QUALIFY_LEAD",
          bulk: true,
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.results)) {
        const mapById = new Map<string, any>();
        for (const r of data.results) {
          mapById.set(r.leadId, r);
        }
        setLeads((prev) =>
          prev.map((l) => {
            const found = mapById.get(l.id);
            return found
              ? {
                  ...l,
                  aiScore: found.aiScore,
                  aiQualification: found.aiQualification,
                  aiSummary: found.aiSummary,
                  recommendedAction: found.recommendedAction,
                }
              : l;
          })
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBulkQualifying(false);
    }
  }

  // ── Status change ──
  async function handleStatusChange(leadId: string, status: string) {
    setUpdatingId(leadId);
    try {
      const res = await fetch("/api/v1/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, status }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status } : l))
        );
      } else {
        alert("Failed to update lead status");
      }
    } catch (_) {
      alert("Network error — status not updated");
    } finally {
      setUpdatingId(null);
    }
  }

  // ── Create lead ──
  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!newForm.customerName.trim() || !newForm.customerPhone.trim()) {
      setFormError("Customer name and phone are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      const data = await res.json();
      if (res.ok && data.lead) {
        const enriched = {
          ...data.lead,
          ...computeClientSideFallbackScore(data.lead),
        };
        setShowNew(false);
        setNewForm(emptyForm);
        setLeads((prev) => [enriched, ...prev]);
      } else {
        setFormError(data.error || "Failed to create lead");
      }
    } catch (_) {
      setFormError("Network error — lead not created");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredLeads = leads.filter((l) =>
    aiFilter === "ALL" ? true : l.aiQualification === aiFilter
  );

  const hotCount = leads.filter((l) => l.aiQualification === "HOT").length;
  const warmCount = leads.filter((l) => l.aiQualification === "WARM").length;
  const coldCount = leads.filter((l) => l.aiQualification === "COLD").length;

  return (
    <div className="space-y-6 bg-[#F8F8F6] text-[#181A1E]">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
              Client Enquiries &amp; AI Lead Pipeline
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]">
              v2 AI SCORING
            </span>
          </div>
          <p className="text-xs text-[#73767D] mt-1">
            Track &amp; auto-qualify inquiries captured across Website forms,
            Facebook, Instagram, and WhatsApp.{" "}
            <span className="font-semibold text-[#181A1E]">
              {filteredLeads.length}
            </span>{" "}
            leads shown.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start">
          <button
            type="button"
            onClick={handleBulkQualify}
            disabled={bulkQualifying}
            className="inline-flex items-center px-3.5 py-2.5 bg-[#181A1E] hover:bg-[#262930] text-white font-semibold rounded-xl text-xs transition whitespace-nowrap"
          >
            {bulkQualifying ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5 text-[#F5C94A]" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#F5C94A]" />
            )}
            Run AI Lead Qualification (Bulk)
          </button>

          <button
            onClick={() => {
              setShowNew(true);
              setFormError("");
            }}
            className="inline-flex items-center px-4 py-2.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Enquiry
          </button>
        </div>
      </div>

      {/* ── AI Qualification Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setAiFilter("ALL")}
          className={`p-6 rounded-[20px] border shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] text-left transition ${
            aiFilter === "ALL"
              ? "bg-[#F5C94A] text-[#181A1E] border-[#F5C94A]"
              : "bg-white text-[#181A1E] border-[#EAEAEA]"
          }`}
        >
          <p className="text-[11px] font-semibold text-[#73767D]">Total Pipeline</p>
          <p className="text-xl font-black mt-0.5">{leads.length} Leads</p>
        </button>

        <button
          type="button"
          onClick={() => setAiFilter(aiFilter === "HOT" ? "ALL" : "HOT")}
          className={`p-6 rounded-[20px] border shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] text-left transition ${
            aiFilter === "HOT"
              ? "bg-[#FAD4D6] text-[#9E2A2B] border-[#F5BFC2]"
              : "bg-white text-[#181A1E] border-[#EAEAEA]"
          }`}
        >
          <p className="text-[11px] font-bold text-[#9E2A2B] flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" /> HOT Leads 🔥 (76–100)
          </p>
          <p className="text-xl font-black mt-0.5">{hotCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setAiFilter(aiFilter === "WARM" ? "ALL" : "WARM")}
          className={`p-6 rounded-[20px] border shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] text-left transition ${
            aiFilter === "WARM"
              ? "bg-[#FBF3DC] text-[#5B4712] border-[#F2E2B6]"
              : "bg-white text-[#181A1E] border-[#EAEAEA]"
          }`}
        >
          <p className="text-[11px] font-bold text-[#5B4712] flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> WARM Leads ⚡ (52–75)
          </p>
          <p className="text-xl font-black mt-0.5">{warmCount}</p>
        </button>

        <button
          type="button"
          onClick={() => setAiFilter(aiFilter === "COLD" ? "ALL" : "COLD")}
          className={`p-6 rounded-[20px] border shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] text-left transition ${
            aiFilter === "COLD"
              ? "bg-[#E2F2FA] text-[#174A67] border-[#C4E3F5]"
              : "bg-white text-[#181A1E] border-[#EAEAEA]"
          }`}
        >
          <p className="text-[11px] font-bold text-[#174A67] flex items-center gap-1">
            <Snowflake className="w-3.5 h-3.5" /> COLD Leads ❄️ (&lt;52)
          </p>
          <p className="text-xl font-black mt-0.5">{coldCount}</p>
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap bg-[#F8F8FA] p-1.5 rounded-[14px] border border-[#EAEAEA] text-xs">
          {SOURCE_FILTER_PILLS.map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`px-3.5 py-1.5 transition-all ${
                sourceFilter === s
                  ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl"
                  : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs font-semibold text-[#181A1E] focus:border-[#F5C94A] focus:outline-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All Statuses" : s.replace("_", " ")}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#73767D] pointer-events-none" />
        </div>
      </div>

      {/* ── Add Lead Form ── */}
      {showNew && (
        <form
          onSubmit={handleCreateLead}
          className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#181A1E]">Add New Lead</h3>
            <button
              type="button"
              onClick={() => {
                setShowNew(false);
                setNewForm(emptyForm);
                setFormError("");
              }}
            >
              <X className="w-4 h-4 text-[#73767D] hover:text-[#181A1E]" />
            </button>
          </div>

          {formError && (
            <p className="text-xs text-[#9E2A2B] font-medium bg-[#FAD4D6] border border-[#F5BFC2] rounded-xl px-3 py-2">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Customer Name *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Rashed Hossain"
                value={newForm.customerName}
                onChange={(e) =>
                  setNewForm({ ...newForm, customerName: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Phone *
              </label>
              <input
                required
                type="text"
                placeholder="01XXXXXXXXX"
                value={newForm.customerPhone}
                onChange={(e) =>
                  setNewForm({ ...newForm, customerPhone: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Source
              </label>
              <select
                value={newForm.source}
                onChange={(e) =>
                  setNewForm({ ...newForm, source: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              >
                {LEAD_SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Title / Service Description
              </label>
              <input
                type="text"
                placeholder="e.g. Bridal Makeover Package, Dental Scaling, Hair Spa"
                value={newForm.title}
                onChange={(e) =>
                  setNewForm({ ...newForm, title: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="Urgency, budget, or customer requests…"
              value={newForm.notes}
              onChange={(e) =>
                setNewForm({ ...newForm, notes: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowNew(false);
                setNewForm(emptyForm);
                setFormError("");
              }}
              className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs flex items-center disabled:opacity-60"
            >
              {submitting && (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              )}
              Create Lead
            </button>
          </div>
        </form>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] py-12 text-center text-[#73767D] space-y-2">
          <Target className="w-10 h-10 text-[#73767D] mx-auto" />
          <h3 className="text-sm font-bold text-[#181A1E]">No leads found</h3>
          <p className="text-xs text-[#73767D]">
            Try adjusting your filters or add a lead manually.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F8FA] border-b border-[#EAEAEA] text-[#73767D] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">AI Qualification (0-100)</th>
                  <th className="py-3.5 px-4">Title / AI Summary</th>
                  <th className="py-3.5 px-4">Messaging</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Captured</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {filteredLeads.map((l) => (
                  <Fragment key={l.id}>
                    <tr
                      className="hover:bg-[#F8F8FA] transition cursor-pointer"
                      onClick={() =>
                        setExpandedId(expandedId === l.id ? null : l.id)
                      }
                    >
                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#181A1E]">
                          {l.customer?.name}
                        </p>
                        <p className="text-[#73767D] text-[11px] font-mono">
                          {l.customer?.phone}
                        </p>
                        {l.form && (
                          <p className="text-[10px] text-[#73767D] mt-0.5 flex items-center gap-0.5">
                            <FileText className="w-2.5 h-2.5" />
                            {l.form.name}
                          </p>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            SOURCE_COLORS[l.source] ||
                            "bg-[#F3F1E8] text-[#181A1E] border border-[#EAEAEA]"
                          }`}
                        >
                          {l.source.replace("_", " ")}
                        </span>
                      </td>

                      {/* AI Score Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {l.aiQualification === "HOT" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]">
                              🔥 HOT • {l.aiScore}/100
                            </span>
                          )}
                          {l.aiQualification === "WARM" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]">
                              ⚡ WARM • {l.aiScore}/100
                            </span>
                          )}
                          {l.aiQualification === "COLD" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]">
                              ❄️ COLD • {l.aiScore}/100
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Title & AI Summary */}
                      <td className="py-3.5 px-4 max-w-[260px]">
                        <span className="font-bold text-[#181A1E] truncate block">
                          {l.title || "Inquiry"}
                        </span>
                        <span
                          className="text-[11px] text-[#73767D] line-clamp-2 block mt-0.5"
                          title={l.aiSummary || l.notes || ""}
                        >
                          {l.aiSummary || l.notes || "—"}
                        </span>
                      </td>

                      {/* Messaging counts */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3 text-[11px] font-semibold text-[#181A1E]">
                          <span
                            className="flex items-center"
                            title="WhatsApp sent"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-[#181A1E] mr-1" />
                            {l.whatsappSent}/3
                          </span>
                          <span className="flex items-center" title="SMS sent">
                            <Phone className="w-3.5 h-3.5 text-[#73767D] mr-1" />
                            {l.smsSent}/2
                          </span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            STATUS_STYLES[l.status] ||
                            "bg-[#F3F1E8] text-[#181A1E] border border-[#EAEAEA]"
                          }`}
                        >
                          {l.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* Captured at */}
                      <td className="py-3.5 px-4 text-[#73767D] text-[11px]">
                        {formatBdDateTime(l.createdAt)}
                      </td>

                      {/* AI Qualify button + Status select */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleQualifyLead(l, e)}
                            disabled={qualifyingId === l.id}
                            title="Run AI Lead Qualification"
                            className="px-2.5 py-1 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] rounded-xl text-[11px] font-semibold inline-flex items-center gap-1 transition"
                          >
                            {qualifyingId === l.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Sparkles className="w-3 h-3" />
                            )}
                            AI Qualify
                          </button>

                          {updatingId === l.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#181A1E]" />
                          ) : (
                            <select
                              value={l.status}
                              onChange={(e) =>
                                handleStatusChange(l.id, e.target.value)
                              }
                              className="px-2 py-1 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs font-medium focus:border-[#F5C94A] focus:outline-none"
                            >
                              <option value="NEW">NEW</option>
                              <option value="CONTACTED">CONTACTED</option>
                              <option value="QUALIFIED">QUALIFIED</option>
                              <option value="QUOTE_SENT">QUOTE SENT</option>
                              <option value="BOOKING_PENDING">
                                BOOKING PENDING
                              </option>
                              <option value="BOOKED">BOOKED</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="LOST">LOST</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          )}
                          {expandedId === l.id ? (
                            <ChevronUp className="w-3.5 h-3.5 text-[#73767D]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-[#73767D]" />
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ── Expanded: AI Summary + Recent Events ── */}
                    {expandedId === l.id && (
                      <tr key={`${l.id}-expanded`}>
                        <td colSpan={8} className="px-4 py-3">
                          <div className="bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EAEAEA]">
                              <div>
                                <p className="text-[10px] font-bold text-[#73767D] uppercase tracking-wider">
                                  AI Lead Intelligence Summary
                                </p>
                                <p className="text-xs font-semibold text-[#181A1E] mt-0.5">
                                  {l.aiSummary}
                                </p>
                                {l.recommendedAction && (
                                  <p className="text-[11px] font-bold text-[#184E37] mt-1">
                                    Recommended Next Action:{" "}
                                    {l.recommendedAction}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleQualifyLead(l, e)}
                                className="px-3 py-1.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-bold rounded-xl text-xs inline-flex items-center gap-1.5 self-start"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                Re-Calculate AI Score
                              </button>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold text-[#73767D] uppercase tracking-wider mb-2">
                                Recent Activity
                              </p>
                              {l.events.length === 0 ? (
                                <p className="text-xs text-[#73767D] italic">
                                  No events recorded for this lead.
                                </p>
                              ) : (
                                <ul className="space-y-1.5">
                                  {l.events.map((ev) => (
                                    <li
                                      key={ev.id}
                                      className="flex items-start gap-2 text-xs text-[#181A1E]"
                                    >
                                      <Clock className="w-3 h-3 text-[#73767D] mt-0.5 shrink-0" />
                                      <span className="flex-1">
                                        {ev.description}
                                      </span>
                                      <span className="text-[10px] text-[#73767D] shrink-0">
                                        {formatBdDate(ev.createdAt)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
