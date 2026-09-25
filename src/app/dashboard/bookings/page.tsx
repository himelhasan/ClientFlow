"use client";

import { Fragment, useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  Plus,
  X,
  RefreshCw,
  Repeat,
  Users,
  Box,
  ShieldCheck,
  List,
  Columns,
  Grid3X3,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { formatBDT, formatBdDate } from "@/lib/utils/bangladesh";

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]",
  COMPLETED: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
  CANCELLED: "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]",
  NO_SHOW: "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]",
  PENDING: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  RESCHEDULED: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  REJECTED: "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]",
};

type CalendarViewMode = "LIST" | "DAY" | "WEEK" | "MONTH" | "STAFF";

const HOURS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

const RECURRENCE_OPTIONS = [
  { value: "NONE", label: "One-time Appointment (No Recurrence)" },
  { value: "WEEKLY_4", label: "Weekly for 4 Weeks (4 Sessions)" },
  { value: "BIWEEKLY_4", label: "Every 2 Weeks (4 Sessions)" },
  { value: "MONTHLY_3", label: "Monthly for 3 Months (3 Sessions)" },
];

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<CalendarViewMode>("LIST");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Calendar 2-Way Sync Modal State
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [externalEvents, setExternalEvents] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const emptyForm = {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    serviceId: "",
    staffName: "Dr. Farhana Rahman",
    date: new Date().toISOString().split("T")[0],
    startTime: "10:00",
    recurrenceRule: "NONE",
    partySize: 1,
    attendeesText: "",
    resourceIds: [] as string[],
    notes: "",
  };
  const [newForm, setNewForm] = useState(emptyForm);

  async function loadBookings() {
    setLoading(true);
    try {
      const url =
        filter === "ALL"
          ? "/api/v1/bookings?limit=60"
          : `/api/v1/bookings?status=${filter}&limit=60`;
      const res = await fetch(url);
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadServicesAndResources() {
    try {
      const [srvRes, resRes, calRes] = await Promise.all([
        fetch("/api/v1/services"),
        fetch("/api/v1/resources"),
        fetch("/api/v1/calendar-sync"),
      ]);
      if (srvRes.ok) {
        const sData = await srvRes.json();
        setServices((sData.services || []).filter((s: any) => s.isActive));
      }
      if (resRes.ok) {
        const rData = await resRes.json();
        setResources((rData.resources || []).filter((r: any) => r.status === "AVAILABLE"));
      }
      if (calRes.ok) {
        const cData = await calRes.json();
        setConnections(cData.connections || []);
        setExternalEvents(cData.events || []);
      }
    } catch (_) {}
  }

  useEffect(() => {
    loadBookings();
  }, [filter]);

  useEffect(() => {
    loadServicesAndResources();
  }, []);

  const selectedService = services.find((s) => s.id === newForm.serviceId);

  // Compute Deposit & Total Fee Preview
  const partyCount = Math.max(1, Number(newForm.partySize) || 1);
  const unitPrice = Number(selectedService?.price || 0);
  const sessionTotal = unitPrice * partyCount;
  const recurrenceMultiplier =
    newForm.recurrenceRule === "WEEKLY_4" || newForm.recurrenceRule === "BIWEEKLY_4"
      ? 4
      : newForm.recurrenceRule === "MONTHLY_3"
      ? 3
      : 1;

  let depositPerSession = 0;
  if (selectedService?.depositType === "FIXED") {
    depositPerSession = Number(selectedService.depositValue || 0) * partyCount;
  } else if (selectedService?.depositType === "PERCENTAGE") {
    depositPerSession = Math.round(
      (sessionTotal * Number(selectedService.depositValue || 0)) / 100
    );
  }

  async function handleStatusChange(bookingId: string, newStatus: string) {
    setUpdatingId(bookingId);
    try {
      const res = await fetch("/api/v1/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId
              ? {
                  ...b,
                  status: newStatus,
                  cancellationFeeCharged:
                    data.cancellationFeeCharged ?? b.cancellationFeeCharged,
                }
              : b
          )
        );
      }
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleCreateBooking(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let endTime = newForm.startTime;
      if (selectedService && newForm.startTime) {
        const [h, m] = newForm.startTime.split(":").map(Number);
        const endMins = h * 60 + m + selectedService.durationMinutes;
        endTime = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(
          endMins % 60
        ).padStart(2, "0")}`;
      }

      const attendees = newForm.attendeesText
        ? newForm.attendeesText
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean)
        : [];

      const res = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newForm,
          endTime,
          attendees,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowNew(false);
        setNewForm(emptyForm);
        await loadBookings();
      } else {
        alert(data.error || "Failed to create booking");
      }
    } catch (err) {
      alert("Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTriggerCalendarSync(action: "SYNC_NOW" | "SIMULATE_CONFLICT" | "CONNECT", provider?: string) {
    setSyncing(true);
    try {
      const res = await fetch("/api/v1/calendar-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, provider }),
      });
      const data = await res.json();
      if (res.ok) {
        if (action === "SYNC_NOW") {
          setSyncNotice(
            `2-Way Delta Sync Complete: Imported ${data.importedCount || 1} external events & exported ${data.exportedCount || 1} bookings.`
          );
        } else if (action === "SIMULATE_CONFLICT") {
          setSyncNotice(
            `Conflict Resolved (${data.resolution?.policyApplied}): ${
              data.resolution?.resolutions?.[0]?.actionTaken || "External Busy Slot Synchronized"
            }`
          );
        } else {
          setSyncNotice(`Connected ${provider?.replace("_", " ")} account.`);
        }
        const calRes = await fetch("/api/v1/calendar-sync");
        if (calRes.ok) {
          const cData = await calRes.json();
          setConnections(cData.connections || []);
          setExternalEvents(cData.events || []);
        }
      }
    } finally {
      setSyncing(false);
    }
  }

  async function handleUpdateConnectionPolicy(
    connectionId: string,
    field: "syncDirection" | "conflictPolicy",
    value: string
  ) {
    await fetch("/api/v1/calendar-sync", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionId, [field]: value }),
    });
    setConnections((prev) =>
      prev.map((c) => (c.id === connectionId ? { ...c, [field]: value } : c))
    );
  }

  function toggleResourceSelection(resId: string) {
    setNewForm((prev) => ({
      ...prev,
      resourceIds: prev.resourceIds.includes(resId)
        ? prev.resourceIds.filter((id) => id !== resId)
        : [...prev.resourceIds, resId],
    }));
  }

  const staffColumns = Array.from(
    new Set([
      "Dr. Farhana Rahman",
      "Dr. Kamrul Hasan",
      "Dr. Nusrat Chowdhury",
      ...bookings.map((b) => b.staff?.name).filter(Boolean),
    ])
  );

  return (
    <div className="space-y-6 bg-[#F8F8F6] text-[#181A1E]">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
            Multi-View Calendar &amp; Scheduled Appointments
          </h1>
          <p className="text-xs text-[#73767D] mt-1">
            Manage recurring appointments, group capacities, resource assignments, and Google/Outlook 2-way sync.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Calendar 2-Way Sync Trigger Button */}
          <button
            onClick={() => setShowSyncModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#F3F1E8] border border-[#EAEAEA] text-[#181A1E] text-xs font-semibold rounded-xl transition shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#184E37]" />
            Google &amp; Outlook Sync ({connections.length})
          </button>

          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center px-4 py-2.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold rounded-xl transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Appointment
          </button>
        </div>
      </div>

      {/* View Switcher Bar + Status Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-[20px] border border-[#EAEAEA] shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
        {/* View Switcher: List, Day, Week, Month, Staff */}
        <div className="flex items-center gap-1 bg-[#F8F8FA] p-1 rounded-xl border border-[#EAEAEA]">
          {[
            { id: "LIST", label: "List View", icon: List },
            { id: "DAY", label: "Day View", icon: Clock },
            { id: "WEEK", label: "Week View", icon: Columns },
            { id: "MONTH", label: "Month View", icon: Grid3X3 },
            { id: "STAFF", label: "Staff View", icon: UserCheck },
          ].map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id as CalendarViewMode)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === v.id
                    ? "bg-[#F5C94A] text-[#181A1E]"
                    : "text-[#73767D] hover:text-[#181A1E]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {v.label}
              </button>
            );
          })}
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 transition-all rounded-xl ${
                filter === s
                  ? "bg-[#F5C94A] text-[#181A1E] font-semibold"
                  : "bg-[#F3F1E8] text-[#262930] hover:bg-[#EAE6D7] font-medium"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced New Booking Modal / Drawer */}
      {showNew && (
        <form
          onSubmit={handleCreateBooking}
          className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#181A1E]">
                Schedule New Appointment (Recurring, Group &amp; Resource Enabled)
              </h3>
              <p className="text-xs text-[#73767D]">
                Automatically syncs with Google Calendar &amp; Microsoft Outlook.
              </p>
            </div>
            <button type="button" onClick={() => setShowNew(false)}>
              <X className="w-4 h-4 text-[#73767D] hover:text-[#181A1E]" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">
                Customer Name *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Rashed Hossain"
                value={newForm.customerName}
                onChange={(e) => setNewForm({ ...newForm, customerName: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">Phone *</label>
              <input
                required
                type="text"
                placeholder="01XXXXXXXXX"
                value={newForm.customerPhone}
                onChange={(e) => setNewForm({ ...newForm, customerPhone: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">Service *</label>
              <select
                required
                value={newForm.serviceId}
                onChange={(e) => setNewForm({ ...newForm, serviceId: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
              >
                <option value="">Select service…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.durationMinutes}m — {formatBDT(s.price)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">
                Assigned Practitioner
              </label>
              <select
                value={newForm.staffName}
                onChange={(e) => setNewForm({ ...newForm, staffName: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
              >
                {staffColumns.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">Date *</label>
              <input
                required
                type="date"
                value={newForm.date}
                onChange={(e) => setNewForm({ ...newForm, date: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">Start Time *</label>
              <input
                required
                type="time"
                value={newForm.startTime}
                onChange={(e) => setNewForm({ ...newForm, startTime: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1 flex items-center gap-1 text-[#181A1E]">
                <Repeat className="w-3.5 h-3.5 text-[#5B4712]" />
                Recurring Pattern
              </label>
              <select
                value={newForm.recurrenceRule}
                onChange={(e) => setNewForm({ ...newForm, recurrenceRule: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
              >
                {RECURRENCE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1 flex items-center gap-1 text-[#181A1E]">
                <Users className="w-3.5 h-3.5 text-[#5B4712]" />
                Group Party Size
                {selectedService?.allowGroupBooking && (
                  <span className="text-[10px] text-[#184E37] font-bold">
                    (Max {selectedService.maxCapacity})
                  </span>
                )}
              </label>
              <input
                type="number"
                min={1}
                max={selectedService?.allowGroupBooking ? selectedService.maxCapacity : 10}
                value={newForm.partySize}
                onChange={(e) => setNewForm({ ...newForm, partySize: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
              />
            </div>
          </div>

          {/* Resource Selection & Deposit Rule Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-[#EAEAEA]">
            {/* Resource Checkboxes */}
            <div className="p-4 rounded-[14px] bg-[#F8F8FA] border border-[#EAEAEA] space-y-2">
              <p className="text-xs font-bold flex items-center gap-1.5 text-[#181A1E]">
                <Box className="w-4 h-4 text-[#5B4712]" />
                Attach Physical Room / Chair / Equipment
              </p>
              <div className="flex flex-wrap gap-2">
                {resources.map((resItem) => {
                  const active = newForm.resourceIds.includes(resItem.id);
                  return (
                    <button
                      key={resItem.id}
                      type="button"
                      onClick={() => toggleResourceSelection(resItem.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        active
                          ? "bg-[#F5C94A] border-[#F5C94A] text-[#181A1E]"
                          : "bg-white border-[#EAEAEA] text-[#73767D]"
                      }`}
                    >
                      {resItem.name} ({resItem.type})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Deposit / Cancellation Rule Live Preview */}
            <div className="p-4 rounded-[14px] bg-[#FBF3DC] border border-[#F2E2B6] space-y-1.5 text-xs text-[#181A1E]">
              <p className="font-bold flex items-center gap-1.5 text-[#181A1E]">
                <ShieldCheck className="w-4 h-4 text-[#5B4712]" />
                Deposit &amp; Cancellation Rule Preview
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#262930]">
                <span>
                  Session Fee ({partyCount} {partyCount > 1 ? "attendees" : "person"}):{" "}
                  <strong>{formatBDT(sessionTotal)}</strong>
                </span>
                {recurrenceMultiplier > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5] font-bold">
                    {recurrenceMultiplier} Recurring Instances ({formatBDT(sessionTotal * recurrenceMultiplier)})
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
                <span>
                  Advance Deposit Required:{" "}
                  <strong className="text-[#184E37]">
                    {depositPerSession > 0 ? formatBDT(depositPerSession) : "৳0 (None)"}
                  </strong>
                </span>
                <span>
                  Late Cancel Policy:{" "}
                  <strong className="text-[#9E2A2B]">
                    {Number(selectedService?.cancellationFee || 0) > 0
                      ? `${formatBDT(selectedService.cancellationFee)} within ${
                          selectedService.cancellationWindowHours || 24
                        }h`
                      : "Free Cancellation"}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => {
                setShowNew(false);
                setNewForm(emptyForm);
              }}
              className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs flex items-center disabled:opacity-60 transition"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              {recurrenceMultiplier > 1
                ? `Create ${recurrenceMultiplier} Recurring Appointments`
                : "Create Booking"}
            </button>
          </div>
        </form>
      )}

      {/* VIEW RENDERER */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
        </div>
      ) : viewMode === "DAY" ? (
        /* DAY VIEW (Hourly Timeline + External Busy Blocks) */
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-extrabold text-[#181A1E]">Day Hourly Timeline (09:00 – 18:00)</h3>
            <span className="text-xs text-[#73767D]">
              Includes Google &amp; Outlook Busy Blocks
            </span>
          </div>
          <div className="divide-y divide-[#EAEAEA]">
            {HOURS.map((hr) => {
              const hourPrefix = hr.split(":")[0];
              const slotBookings = bookings.filter(
                (b) => (b.startTime || "10:00").split(":")[0] === hourPrefix
              );
              const slotExtEvents = externalEvents.filter((ev) => {
                const h = new Date(ev.startTime).getHours();
                return String(h).padStart(2, "0") === hourPrefix && ev.direction === "IMPORTED";
              });

              return (
                <div key={hr} className="py-3 flex items-start gap-4">
                  <div className="w-16 text-xs font-mono font-bold text-[#73767D] pt-1">{hr}</div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {slotBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-xl bg-[#E3F5EC] border border-[#CBEAD9] text-[#184E37] text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold">
                            {b.bookingNumber} — {b.customer?.name}
                          </p>
                          <p className="text-[11px]">
                            {b.service?.name} ({b.startTime})
                          </p>
                        </div>
                        {b.partySize > 1 && (
                          <span className="px-2 py-0.5 rounded-full bg-white text-[10px] font-bold text-[#184E37] border border-[#CBEAD9]">
                            Party of {b.partySize}
                          </span>
                        )}
                      </div>
                    ))}
                    {slotExtEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl bg-[#FBF3DC] border border-[#F2E2B6] text-[#5B4712] text-xs"
                      >
                        <p className="font-bold">{ev.title}</p>
                        <p className="text-[10px] text-[#73767D]">
                          External Busy Block ({ev.direction})
                        </p>
                      </div>
                    ))}
                    {slotBookings.length === 0 && slotExtEvents.length === 0 && (
                      <span className="text-[11px] text-[#73767D] italic pt-1">Available slot</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === "WEEK" ? (
        /* WEEK VIEW (7-Day Grid) */
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <h3 className="text-sm font-extrabold text-[#181A1E] mb-4">7-Day Week Schedule Grid</h3>
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
            {Array.from({ length: 7 }).map((_, idx) => {
              const d = new Date(Date.now() + (idx - 1) * 86400000);
              const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
              const dateNum = d.getDate();
              const dayBookings = bookings.filter((b) => {
                const bd = new Date(b.date);
                return bd.getDate() === dateNum;
              });
              return (
                <div
                  key={idx}
                  className="min-h-[220px] p-3 rounded-[14px] bg-[#F8F8FA] border border-[#EAEAEA] space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2">
                    <span className="text-xs font-bold uppercase text-[#73767D]">{dayName}</span>
                    <span className="w-6 h-6 rounded-full bg-[#F5C94A] text-[#181A1E] text-xs font-extrabold flex items-center justify-center">
                      {dateNum}
                    </span>
                  </div>
                  {dayBookings.length === 0 ? (
                    <p className="text-[11px] text-[#73767D] pt-4 text-center">No bookings</p>
                  ) : (
                    dayBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-2 rounded-xl bg-white border border-[#EAEAEA] text-[11px] space-y-0.5 shadow-sm"
                      >
                        <p className="font-bold truncate text-[#181A1E]">{b.customer?.name}</p>
                        <p className="text-[10px] text-[#73767D] truncate">{b.service?.name}</p>
                        <span className="inline-block font-mono text-[10px] font-semibold text-[#184E37]">
                          {b.startTime}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === "MONTH" ? (
        /* MONTH VIEW (28-Day Calendar Grid) */
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <h3 className="text-sm font-extrabold text-[#181A1E] mb-4">Monthly Calendar Overview</h3>
          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase text-[#73767D] mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 28 }).map((_, i) => {
              const dayNum = i + 1;
              const matches = bookings.filter((b) => new Date(b.date).getDate() === dayNum);
              return (
                <div
                  key={dayNum}
                  className="min-h-[88px] p-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] flex flex-col justify-between"
                >
                  <span className="text-xs font-bold text-[#73767D]">{dayNum}</span>
                  <div className="space-y-1">
                    {matches.slice(0, 2).map((b) => (
                      <div
                        key={b.id}
                        className="px-1.5 py-0.5 rounded bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9] text-[10px] font-semibold truncate"
                      >
                        {b.startTime} {b.customer?.name}
                      </div>
                    ))}
                    {matches.length > 2 && (
                      <span className="text-[10px] font-bold text-[#73767D]">
                        +{matches.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === "STAFF" ? (
        /* STAFF VIEW (Columns per Staff Member) */
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <h3 className="text-sm font-extrabold text-[#181A1E] mb-4">Staff Dispatch Columns</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staffColumns.map((staffName) => {
              const assigned = bookings.filter(
                (b) => (b.staff?.name || "Dr. Farhana Rahman") === staffName
              );
              return (
                <div
                  key={staffName}
                  className="p-4 rounded-[14px] bg-[#F8F8FA] border border-[#EAEAEA] space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#EAEAEA] pb-2.5">
                    <div>
                      <p className="text-xs font-extrabold text-[#181A1E]">{staffName}</p>
                      <p className="text-[10px] text-[#73767D]">
                        {assigned.length} Scheduled Appointments
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]">
                      On Duty
                    </span>
                  </div>
                  {assigned.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl bg-white border border-[#EAEAEA] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#181A1E]">{b.startTime}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            STATUS_STYLES[b.status] || "bg-[#F3F1E8] text-[#262930] border border-[#EAEAEA]"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <p className="font-bold text-[#181A1E]">{b.customer?.name}</p>
                      <p className="text-[11px] text-[#73767D]">{b.service?.name}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* LIST VIEW (Enhanced Table with Recurring, Group, Resource & Deposit Badges) */
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F8FA] border-b border-[#EAEAEA] text-[#73767D] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Booking #</th>
                  <th className="py-3.5 px-4">Customer &amp; Party</th>
                  <th className="py-3.5 px-4">Service &amp; Resources</th>
                  <th className="py-3.5 px-4">Date &amp; Recurrence</th>
                  <th className="py-3.5 px-4">Fee &amp; Deposit</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {bookings.map((b) => (
                  <Fragment key={b.id}>
                    <tr
                      className="hover:bg-[#F8F8FA] transition cursor-pointer"
                      onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#181A1E]">
                        {b.bookingNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#181A1E]">
                          {b.customer?.name}
                        </p>
                        <p className="text-[#73767D] font-mono text-[11px]">{b.customer?.phone}</p>
                        {Number(b.partySize) > 1 && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]">
                            <Users className="w-2.5 h-2.5" />
                            Group Party of {b.partySize}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#181A1E]">
                        {b.service?.name}
                        {b.staff && (
                          <p className="text-[11px] text-[#73767D]">with {b.staff.name}</p>
                        )}
                        {b.resources && b.resources.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {b.resources.map((r: any, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F3F1E8] text-[#262930] border border-[#EAEAEA]"
                              >
                                <Box className="w-2.5 h-2.5" />
                                {r.resource?.name || "Assigned Room"}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-[#181A1E]">
                          {formatBdDate(b.date)}
                        </p>
                        <p className="text-[#73767D] text-[11px]">
                          {b.startTime}
                          {b.endTime && b.endTime !== b.startTime ? ` – ${b.endTime}` : ""}
                        </p>
                        {b.recurrenceRule && b.recurrenceRule !== "NONE" && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]">
                            <Repeat className="w-2.5 h-2.5" />
                            {b.recurrenceRule.replace("_", " ")}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#181A1E]">
                          {formatBDT(b.price)}
                        </p>
                        {Number(b.depositRequired) > 0 && (
                          <p className="text-[10px] font-semibold text-[#184E37]">
                            Deposit: {formatBDT(b.depositRequired)}
                          </p>
                        )}
                        {Number(b.cancellationFeeCharged) > 0 && (
                          <p className="text-[10px] font-bold text-[#9E2A2B]">
                            Cancel Fee: {formatBDT(b.cancellationFeeCharged)}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            STATUS_STYLES[b.status] || "bg-[#F3F1E8] text-[#262930] border border-[#EAEAEA]"
                          }`}
                        >
                          {b.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {updatingId === b.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#181A1E] inline" />
                        ) : (
                          <div className="inline-flex items-center space-x-1">
                            {b.status === "PENDING" && (
                              <button
                                onClick={() => handleStatusChange(b.id, "CONFIRMED")}
                                className="px-2.5 py-1 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-[11px]"
                              >
                                Confirm
                              </button>
                            )}
                            {!["COMPLETED", "CANCELLED"].includes(b.status) && (
                              <button
                                onClick={() => handleStatusChange(b.id, "COMPLETED")}
                                className="px-2.5 py-1 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-[11px]"
                              >
                                Complete
                              </button>
                            )}
                            {!["CANCELLED", "COMPLETED"].includes(b.status) && (
                              <button
                                onClick={() => handleStatusChange(b.id, "CANCELLED")}
                                className="px-2.5 py-1 bg-[#FAD4D6] hover:opacity-85 text-[#9E2A2B] border border-[#F5BFC2] font-semibold rounded-xl text-[11px]"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Google & Outlook Calendar 2-Way Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 w-full max-w-3xl space-y-5 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-[#181A1E]">
                  Google Calendar &amp; Microsoft Outlook 2-Way Sync
                </h3>
                <p className="text-xs text-[#73767D]">
                  Real-time webhook push &amp; delta token synchronization with conflict resolution.
                </p>
              </div>
              <button onClick={() => setShowSyncModal(false)}>
                <X className="w-5 h-5 text-[#73767D] hover:text-[#181A1E]" />
              </button>
            </div>

            {syncNotice && (
              <div className="p-3 rounded-xl bg-[#E3F5EC] border border-[#CBEAD9] text-[#184E37] text-xs font-semibold flex items-center justify-between">
                <span>{syncNotice}</span>
                <button onClick={() => setSyncNotice(null)}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Connected Accounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="p-4 rounded-[14px] bg-[#F8F8FA] border border-[#EAEAEA] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-[#181A1E]">
                      {conn.provider === "GOOGLE_CALENDAR"
                        ? "Google Calendar"
                        : "Microsoft Outlook"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]">
                      {conn.status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-[#73767D]">{conn.accountEmail}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#73767D] mb-1">
                        Sync Direction
                      </label>
                      <select
                        value={conn.syncDirection}
                        onChange={(e) =>
                          handleUpdateConnectionPolicy(conn.id, "syncDirection", e.target.value)
                        }
                        className="w-full px-2 py-1.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                      >
                        <option value="TWO_WAY">2-Way Sync</option>
                        <option value="EXPORT_ONLY">Export Only</option>
                        <option value="IMPORT_ONLY">Import Only</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-[#73767D] mb-1">
                        Conflict Policy
                      </label>
                      <select
                        value={conn.conflictPolicy}
                        onChange={(e) =>
                          handleUpdateConnectionPolicy(conn.id, "conflictPolicy", e.target.value)
                        }
                        className="w-full px-2 py-1.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                      >
                        <option value="EXTERNAL_WINS">External Wins</option>
                        <option value="INTERNAL_WINS">Internal Wins</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EAEAEA]">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleTriggerCalendarSync("SYNC_NOW")}
                  disabled={syncing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs transition"
                >
                  {syncing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Run 2-Way Delta Sync Now
                </button>
                <button
                  onClick={() => handleTriggerCalendarSync("SIMULATE_CONFLICT")}
                  disabled={syncing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-semibold rounded-xl text-xs transition"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#5B4712]" />
                  Test Conflict Resolution
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleTriggerCalendarSync("CONNECT", "GOOGLE_CALENDAR")}
                  className="px-3 py-1.5 rounded-xl border border-[#EAEAEA] bg-[#F3F1E8] hover:bg-[#EAE6D7] text-xs font-semibold text-[#262930] transition"
                >
                  + Reconnect Google
                </button>
                <button
                  onClick={() => handleTriggerCalendarSync("CONNECT", "OUTLOOK_CALENDAR")}
                  className="px-3 py-1.5 rounded-xl border border-[#EAEAEA] bg-[#F3F1E8] hover:bg-[#EAE6D7] text-xs font-semibold text-[#262930] transition"
                >
                  + Reconnect Outlook
                </button>
              </div>
            </div>

            {/* Recent Synced Events Feed */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-[#73767D]">
                Recent Synced Calendar Events ({externalEvents.length})
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {externalEvents.slice(0, 8).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-xs text-[#181A1E]"
                  >
                    <span className="font-semibold truncate">{ev.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ev.direction === "IMPORTED"
                          ? "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]"
                          : "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]"
                      }`}
                    >
                      {ev.direction}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
