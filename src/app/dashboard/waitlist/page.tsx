"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Plus,
  BellRing,
  CheckCircle2,
  Loader2,
  X,
  ArrowUp,
  ArrowDown,
  Users,
  CalendarCheck,
  Trash2,
  Sparkles,
} from "lucide-react";
import { formatBdDate } from "@/lib/utils/bangladesh";

const STATUS_TABS = ["ALL", "WAITING", "NOTIFIED", "BOOKED", "EXPIRED"];
const TIME_WINDOWS = ["ALL", "MORNING", "AFTERNOON", "EVENING", "ANYTIME"];

const WINDOW_BADGE: Record<string, string> = {
  MORNING: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  AFTERNOON: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
  EVENING: "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]",
  ANYTIME: "bg-[#F3F1E8] text-[#262930] border border-[#EAEAEA]",
};

const STATUS_BADGE: Record<string, string> = {
  WAITING: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  NOTIFIED: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
  BOOKED: "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]",
  EXPIRED: "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]",
};

export default function WaitlistPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [windowFilter, setWindowFilter] = useState("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const emptyForm = {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    serviceId: "",
    serviceName: "",
    preferredDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    preferredTimeWindow: "MORNING",
    partySize: 1,
    priority: 2,
    notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  async function loadWaitlist() {
    setLoading(true);
    try {
      const [wlRes, srvRes] = await Promise.all([
        fetch("/api/v1/waitlist"),
        fetch("/api/v1/services"),
      ]);
      const wlData = await wlRes.json();
      setEntries(wlData.entries || []);
      if (srvRes.ok) {
        const srvData = await srvRes.json();
        setServices(srvData.services || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWaitlist();
  }, []);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  }

  const filteredEntries = entries.filter((e) => {
    if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
    if (windowFilter !== "ALL" && e.preferredTimeWindow !== windowFilter) return false;
    return true;
  });

  async function handleCreateEntry(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedSrv = services.find((s) => s.id === form.serviceId);
      const res = await fetch("/api/v1/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          ...form,
          serviceName: selectedSrv?.name || form.serviceName || "Consultation",
        }),
      });
      if (res.ok) {
        setShowAdd(false);
        setForm(emptyForm);
        showToast("Added customer to priority waitlist queue.");
        await loadWaitlist();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNotifySlot(entry: any) {
    setActionId(entry.id);
    try {
      const res = await fetch("/api/v1/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "NOTIFY_SLOT", entryId: entry.id }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          data.notificationMessage ||
            `Notified ${entry.customer?.name} that a ${entry.preferredTimeWindow} slot is open!`
        );
        await loadWaitlist();
      }
    } finally {
      setActionId(null);
    }
  }

  async function handleConvertToBooking(entry: any) {
    setActionId(entry.id);
    try {
      const res = await fetch("/api/v1/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CONVERT_TO_BOOKING", entryId: entry.id }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          `Converted ${entry.customer?.name} to Confirmed Booking ${
            data.booking?.bookingNumber || ""
          }!`
        );
        await loadWaitlist();
      }
    } finally {
      setActionId(null);
    }
  }

  async function handleBumpPriority(entry: any, delta: number) {
    const nextPriority = Math.max(0, (Number(entry.priority) || 0) + delta);
    await fetch("/api/v1/waitlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId: entry.id, priority: nextPriority }),
    });
    setEntries((prev) =>
      prev
        .map((item) => (item.id === entry.id ? { ...item, priority: nextPriority } : item))
        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    );
  }

  async function handleDelete(entryId: string) {
    await fetch(`/api/v1/waitlist?entryId=${entryId}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  }

  return (
    <div className="space-y-6 bg-[#F8F8F6] text-[#181A1E]">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="bg-[#E3F5EC] border border-[#CBEAD9] text-[#184E37] px-4 py-3 rounded-[14px] flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#184E37]" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
            Smart Priority Waitlist &amp; Slot Auto-Fill
          </h1>
          <p className="text-xs text-[#73767D] mt-1">
            Automatically fill last-minute cancellations by notifying waitlisted clients by preferred time window.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center px-4 py-2.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add to Waitlist
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <p className="text-[11px] font-semibold uppercase text-[#73767D]">Waiting in Queue</p>
          <p className="text-2xl font-black text-[#181A1E] mt-1">
            {entries.filter((e) => e.status === "WAITING").length}
          </p>
        </div>
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <p className="text-[11px] font-semibold uppercase text-[#73767D]">Slot Alert Sent</p>
          <p className="text-2xl font-black text-[#174A67] mt-1">
            {entries.filter((e) => e.status === "NOTIFIED").length}
          </p>
        </div>
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <p className="text-[11px] font-semibold uppercase text-[#73767D]">Converted to Booking</p>
          <p className="text-2xl font-black text-[#184E37] mt-1">
            {entries.filter((e) => e.status === "BOOKED").length}
          </p>
        </div>
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <p className="text-[11px] font-semibold uppercase text-[#73767D]">High Priority (P2+)</p>
          <p className="text-2xl font-black text-[#5B4712] mt-1">
            {entries.filter((e) => (e.priority || 0) >= 2).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-[20px] border border-[#EAEAEA] shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs transition ${
                statusFilter === st
                  ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
                  : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#73767D] mr-1">Time Window:</span>
          {TIME_WINDOWS.map((tw) => (
            <button
              key={tw}
              onClick={() => setWindowFilter(tw)}
              className={`px-2.5 py-1 rounded-xl text-[11px] transition ${
                windowFilter === tw
                  ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
                  : "bg-[#F8F8FA] hover:bg-[#F3F1E8] text-[#73767D] font-medium border border-[#EAEAEA]"
              }`}
            >
              {tw}
            </button>
          ))}
        </div>
      </div>

      {/* Priority Queue Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-12 text-center space-y-2 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <Clock className="w-10 h-10 text-[#73767D] mx-auto" />
          <h3 className="text-sm font-bold text-[#181A1E]">Waitlist queue is empty</h3>
          <p className="text-xs text-[#73767D]">
            Add customers who want to be notified when an appointment slot opens up.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F8FA] border-b border-[#EAEAEA] text-[#73767D] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Client &amp; Party</th>
                  <th className="py-3.5 px-4">Requested Service</th>
                  <th className="py-3.5 px-4">Date &amp; Time Window</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">1-Click Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#F8F8FA] transition">
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1 bg-[#F8F8FA] px-2.5 py-1 rounded-xl border border-[#EAEAEA]">
                        <span className="font-extrabold text-[#181A1E]">
                          P{entry.priority || 1}
                        </span>
                        <div className="flex flex-col ml-1">
                          <button
                            onClick={() => handleBumpPriority(entry, 1)}
                            className="hover:text-[#F5C94A]"
                            title="Increase Priority"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleBumpPriority(entry, -1)}
                            className="hover:text-[#F5C94A]"
                            title="Decrease Priority"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#181A1E]">
                        {entry.customer?.name}
                      </p>
                      <p className="text-[11px] font-mono text-[#73767D]">
                        {entry.customer?.phone}
                      </p>
                      {entry.partySize > 1 && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]">
                          <Users className="w-2.5 h-2.5" />
                          Party of {entry.partySize}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#181A1E]">
                        {entry.service?.name || "Consultation"}
                      </p>
                      {entry.notes && (
                        <p className="text-[11px] text-[#73767D] line-clamp-1 mt-0.5">
                          {entry.notes}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-[#181A1E]">
                        {formatBdDate(entry.preferredDate)}
                      </p>
                      <span
                        className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          WINDOW_BADGE[entry.preferredTimeWindow] || "bg-[#F3F1E8] text-[#262930] border border-[#EAEAEA]"
                        }`}
                      >
                        {entry.preferredTimeWindow}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          STATUS_BADGE[entry.status] || "bg-[#F3F1E8] text-[#262930] border border-[#EAEAEA]"
                        }`}
                      >
                        {entry.status}
                      </span>
                      {entry.notifiedAt && (
                        <p className="text-[10px] text-[#73767D] mt-1">
                          Alerted {new Date(entry.notifiedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {actionId === entry.id ? (
                        <Loader2 className="w-4 h-4 animate-spin inline text-[#181A1E]" />
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          {entry.status !== "BOOKED" && (
                            <>
                              <button
                                onClick={() => handleNotifySlot(entry)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FBF3DC] hover:bg-[#F2E2B6] text-[#5B4712] font-semibold rounded-xl text-[11px] border border-[#F2E2B6] transition"
                                title="Send WhatsApp/SMS slot open alert"
                              >
                                <BellRing className="w-3.5 h-3.5" />
                                Notify Slot Open
                              </button>
                              <button
                                onClick={() => handleConvertToBooking(entry)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#E3F5EC] hover:bg-[#CBEAD9] text-[#184E37] font-semibold rounded-xl text-[11px] border border-[#CBEAD9] transition"
                                title="Convert directly to confirmed appointment"
                              >
                                <CalendarCheck className="w-3.5 h-3.5" />
                                Convert to Booking
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 rounded-xl bg-[#F8F8FA] hover:bg-[#FAD4D6] text-[#73767D] hover:text-[#9E2A2B] border border-[#EAEAEA] transition"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add to Waitlist Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateEntry}
            className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 w-full max-w-lg space-y-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#181A1E]">
                Add Client to Priority Waitlist
              </h3>
              <button type="button" onClick={() => setShowAdd(false)}>
                <X className="w-4 h-4 text-[#73767D]" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">Client Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Tariqul Alam"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">Phone (BD) *</label>
                <input
                  required
                  type="text"
                  placeholder="017XXXXXXXX"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">Requested Service</label>
                <select
                  value={form.serviceId}
                  onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                >
                  <option value="">Any / General Consultation</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">Preferred Date</label>
                <input
                  type="date"
                  value={form.preferredDate}
                  onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">Time Window</label>
                <select
                  value={form.preferredTimeWindow}
                  onChange={(e) => setForm({ ...form, preferredTimeWindow: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                >
                  <option value="MORNING">MORNING (9 AM – 12 PM)</option>
                  <option value="AFTERNOON">AFTERNOON (12 PM – 4 PM)</option>
                  <option value="EVENING">EVENING (4 PM – 8 PM)</option>
                  <option value="ANYTIME">ANYTIME</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">Party Size</label>
                  <input
                    type="number"
                    min={1}
                    value={form.partySize}
                    onChange={(e) => setForm({ ...form, partySize: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">Priority (1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">Notes</label>
              <textarea
                rows={2}
                placeholder="Any specific practitioner or urgency notes..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] rounded-xl text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] rounded-xl text-xs font-semibold transition"
              >
                Add to Waitlist
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
