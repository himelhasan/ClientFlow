"use client";

import { useEffect, useState } from "react";
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
  NEW: "bg-slate-100 text-slate-700",
  CONTACTED: "bg-blue-50 text-blue-700 border border-blue-200",
  QUALIFIED: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  QUOTE_SENT: "bg-amber-50 text-amber-700 border border-amber-200",
  BOOKING_PENDING: "bg-orange-50 text-orange-700 border border-orange-200",
  BOOKED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  COMPLETED: "bg-teal-50 text-teal-700 border border-teal-200",
  LOST: "bg-red-50 text-red-700 border border-red-200",
  CANCELLED: "bg-rose-50 text-rose-700 border border-rose-200",
};

const SOURCE_COLORS: Record<string, string> = {
  WEBSITE: "bg-slate-100 text-slate-700 border-slate-200",
  FACEBOOK: "bg-indigo-50 text-indigo-700 border-indigo-200",
  INSTAGRAM: "bg-rose-50 text-rose-700 border-rose-200",
  WHATSAPP: "bg-emerald-50 text-emerald-700 border-emerald-200",
  GOOGLE: "bg-amber-50 text-amber-700 border-amber-200",
  MANUAL: "bg-slate-100 text-slate-600 border-slate-200",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function LeadsPipeline() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

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
      setLeads(data.leads || []);
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
        setShowNew(false);
        setNewForm(emptyForm);
        setLeads((prev) => [data.lead, ...prev]);
      } else {
        setFormError(data.error || "Failed to create lead");
      }
    } catch (_) {
      setFormError("Network error — lead not created");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Derived counts ──
  const totalLeads = leads.length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Lead Management &amp; Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track inquiries captured across Website forms, Facebook, Instagram, and WhatsApp.{" "}
            <span className="font-semibold text-slate-700">{totalLeads}</span> leads shown.
          </p>
        </div>

        <button
          onClick={() => {
            setShowNew(true);
            setFormError("");
          }}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition whitespace-nowrap self-start"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Lead
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        {/* Source pills */}
        <div className="flex items-center gap-1 flex-wrap bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold">
          {SOURCE_FILTER_PILLS.map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`px-3 py-1.5 rounded-lg transition ${
                sourceFilter === s
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Status dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All Statuses" : s.replace("_", " ")}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Add Lead Form ── */}
      {showNew && (
        <form
          onSubmit={handleCreateLead}
          className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Add New Lead</h3>
            <button
              type="button"
              onClick={() => {
                setShowNew(false);
                setNewForm(emptyForm);
                setFormError("");
              }}
            >
              <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
            </button>
          </div>

          {formError && (
            <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Source
              </label>
              <select
                value={newForm.source}
                onChange={(e) =>
                  setNewForm({ ...newForm, source: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {LEAD_SOURCES.map((src) => (
                  <option key={src} value={src}>
                    {src.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Title / Service Description
              </label>
              <input
                type="text"
                placeholder="e.g. AC Repair, Hair Cut, Legal Consultation"
                value={newForm.title}
                onChange={(e) =>
                  setNewForm({ ...newForm, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="Additional notes about this lead…"
              value={newForm.notes}
              onChange={(e) =>
                setNewForm({ ...newForm, notes: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
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
              className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 flex items-center disabled:opacity-60"
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
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-2">
          <Target className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No leads found</h3>
          <p className="text-xs text-slate-400">
            {sourceFilter !== "ALL" || statusFilter !== "ALL"
              ? "Try adjusting your filters, or add a lead manually."
              : "When visitors submit your widget form or initiate inquiries, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Title / Service</th>
                  <th className="py-3.5 px-4">Notes</th>
                  <th className="py-3.5 px-4">Messaging</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Captured</th>
                  <th className="py-3.5 px-4 text-right">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((l) => (
                  <>
                    <tr
                      key={l.id}
                      className="hover:bg-slate-50/60 transition cursor-pointer"
                      onClick={() =>
                        setExpandedId(expandedId === l.id ? null : l.id)
                      }
                    >
                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">
                          {l.customer?.name}
                        </p>
                        <p className="text-slate-500 text-[11px] font-mono">
                          {l.customer?.phone}
                        </p>
                        {l.form && (
                          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5">
                            <FileText className="w-2.5 h-2.5" />
                            {l.form.name}
                          </p>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            SOURCE_COLORS[l.source] ||
                            "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {l.source.replace("_", " ")}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium max-w-[160px]">
                        <span className="truncate block">
                          {l.title || "Inquiry"}
                        </span>
                        {l.bookings.length > 0 && (
                          <span className="text-[10px] text-emerald-700">
                            {l.bookings[0].service?.name}
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-3.5 px-4 max-w-[180px]">
                        {l.notes ? (
                          <span
                            className="text-slate-500 italic block truncate"
                            title={l.notes}
                          >
                            {l.notes.length > 50
                              ? `${l.notes.slice(0, 50)}…`
                              : l.notes}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Messaging counts */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3 text-[11px] font-semibold text-slate-600">
                          <span
                            className="flex items-center"
                            title="WhatsApp sent"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                            {l.whatsappSent}/3
                          </span>
                          <span
                            className="flex items-center"
                            title="SMS sent"
                          >
                            <Phone className="w-3.5 h-3.5 text-blue-600 mr-1" />
                            {l.smsSent}/2
                          </span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            STATUS_STYLES[l.status] ||
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {l.status.replace("_", " ")}
                        </span>
                      </td>

                      {/* Captured at */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {formatBdDateTime(l.createdAt)}
                      </td>

                      {/* Status select + expand toggle */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {updatingId === l.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                          ) : (
                            <select
                              value={l.status}
                              onChange={(e) =>
                                handleStatusChange(l.id, e.target.value)
                              }
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs font-medium focus:outline-none"
                            >
                              <option value="NEW">NEW</option>
                              <option value="CONTACTED">CONTACTED</option>
                              <option value="QUALIFIED">QUALIFIED</option>
                              <option value="QUOTE_SENT">QUOTE SENT</option>
                              <option value="BOOKING_PENDING">BOOKING PENDING</option>
                              <option value="BOOKED">BOOKED</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="LOST">LOST</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          )}
                          {expandedId === l.id ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ── Expanded: recent events ── */}
                    {expandedId === l.id && (
                      <tr key={`${l.id}-expanded`} className="bg-slate-50/60">
                        <td colSpan={8} className="px-6 py-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            Recent Activity
                          </p>
                          {l.events.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">
                              No events recorded for this lead.
                            </p>
                          ) : (
                            <ul className="space-y-1.5">
                              {l.events.map((ev) => (
                                <li
                                  key={ev.id}
                                  className="flex items-start gap-2 text-xs text-slate-600"
                                >
                                  <Clock className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                                  <span className="flex-1">
                                    {ev.description}
                                  </span>
                                  <span className="text-[10px] text-slate-400 shrink-0">
                                    {formatBdDate(ev.createdAt)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
