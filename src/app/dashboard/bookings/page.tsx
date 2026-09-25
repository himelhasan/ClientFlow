"use client";

import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  Plus,
  X,
  ChevronDown,
} from "lucide-react";
import { formatBDT, formatBdDate } from "@/lib/utils/bangladesh";

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  COMPLETED: "bg-blue-50 text-blue-700 border border-blue-200",
  CANCELLED: "bg-red-50 text-red-700 border border-red-200",
  NO_SHOW: "bg-purple-50 text-purple-700 border border-purple-200",
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  RESCHEDULED: "bg-orange-50 text-orange-700 border border-orange-200",
  REJECTED: "bg-rose-50 text-rose-700 border border-rose-200",
};

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const emptyForm = {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    serviceId: "",
    date: "",
    startTime: "",
    notes: "",
  };
  const [newForm, setNewForm] = useState(emptyForm);

  async function loadBookings() {
    setLoading(true);
    try {
      const url =
        filter === "ALL"
          ? "/api/v1/bookings?limit=50"
          : `/api/v1/bookings?status=${filter}&limit=50`;
      const res = await fetch(url);
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadServices() {
    try {
      const res = await fetch("/api/v1/services");
      const data = await res.json();
      setServices((data.services || []).filter((s: any) => s.isActive));
    } catch (_) {}
  }

  useEffect(() => {
    loadBookings();
  }, [filter]);

  useEffect(() => {
    loadServices();
  }, []);

  async function handleStatusChange(bookingId: string, newStatus: string) {
    setUpdatingId(bookingId);
    try {
      const res = await fetch("/api/v1/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
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
      // Calculate endTime from service duration
      const service = services.find((s) => s.id === newForm.serviceId);
      let endTime = newForm.startTime;
      if (service && newForm.startTime) {
        const [h, m] = newForm.startTime.split(":").map(Number);
        const endMins = h * 60 + m + service.durationMinutes;
        endTime = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
      }

      const res = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newForm, endTime }),
      });

      if (res.ok) {
        setShowNew(false);
        setNewForm(emptyForm);
        await loadBookings();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create booking");
      }
    } catch (err) {
      alert("Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Bookings &amp; Appointments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage scheduled customer appointments, confirmations, and attendance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold">
            {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filter === s
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Booking
          </button>
        </div>
      </div>

      {/* New Booking Form */}
      {showNew && (
        <form
          onSubmit={handleCreateBooking}
          className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Create New Booking</h3>
            <button type="button" onClick={() => setShowNew(false)}>
              <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
            </button>
          </div>

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
                onChange={(e) => setNewForm({ ...newForm, customerName: e.target.value })}
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
                onChange={(e) => setNewForm({ ...newForm, customerPhone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="optional"
                value={newForm.customerEmail}
                onChange={(e) => setNewForm({ ...newForm, customerEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Service *
              </label>
              <select
                required
                value={newForm.serviceId}
                onChange={(e) => setNewForm({ ...newForm, serviceId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Date *
              </label>
              <input
                required
                type="date"
                value={newForm.date}
                onChange={(e) => setNewForm({ ...newForm, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Start Time *
              </label>
              <input
                required
                type="time"
                value={newForm.startTime}
                onChange={(e) => setNewForm({ ...newForm, startTime: e.target.value })}
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
              placeholder="Optional notes for this appointment"
              value={newForm.notes}
              onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => { setShowNew(false); setNewForm(emptyForm); }}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 flex items-center disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Create Booking
            </button>
          </div>
        </form>
      )}

      {/* Bookings Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-2">
          <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No bookings found</h3>
          <p className="text-xs text-slate-400">
            Appointments booked through your website widget or created manually will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Booking #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Date &amp; Time</th>
                  <th className="py-3.5 px-4">Fee</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <>
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50/60 transition cursor-pointer"
                      onClick={() => setExpandedId(expandedId === b.id ? null : b.id)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {b.bookingNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{b.customer?.name}</p>
                        <p className="text-slate-500 font-mono text-[11px]">{b.customer?.phone}</p>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {b.service?.name}
                        {b.staff && (
                          <p className="text-[11px] text-slate-400">with {b.staff.name}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-900">{formatBdDate(b.date)}</p>
                        <p className="text-slate-500 text-[11px]">
                          {b.startTime}
                          {b.endTime && b.endTime !== b.startTime ? ` – ${b.endTime}` : ""}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        {formatBDT(b.price)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            STATUS_STYLES[b.status] || "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {b.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {updatingId === b.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-600 inline" />
                        ) : (
                          <div className="inline-flex items-center space-x-1">
                            {b.status === "PENDING" && (
                              <button
                                onClick={() => handleStatusChange(b.id, "CONFIRMED")}
                                className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold"
                              >
                                Confirm
                              </button>
                            )}
                            {!["COMPLETED", "CANCELLED"].includes(b.status) && (
                              <button
                                onClick={() => handleStatusChange(b.id, "COMPLETED")}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-semibold text-slate-700"
                              >
                                Complete
                              </button>
                            )}
                            {!["CANCELLED", "COMPLETED"].includes(b.status) && (
                              <button
                                onClick={() => handleStatusChange(b.id, "CANCELLED")}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-red-50 hover:text-red-700 text-[11px] font-semibold text-slate-700"
                              >
                                Cancel
                              </button>
                            )}
                            {!["NO_SHOW", "COMPLETED", "CANCELLED"].includes(b.status) && (
                              <button
                                onClick={() => handleStatusChange(b.id, "NO_SHOW")}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-[11px] font-semibold text-slate-700"
                              >
                                No-Show
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                    {expandedId === b.id && (
                      <tr key={`${b.id}-expanded`} className="bg-slate-50/50">
                        <td colSpan={7} className="px-6 py-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600">
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Email</p>
                              <p>{b.customer?.email || "—"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Duration</p>
                              <p>{b.durationMinutes} minutes</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Branch</p>
                              <p>{b.branch?.name || "Main"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 uppercase font-bold mb-0.5">Notes</p>
                              <p className="text-slate-500 italic">{b.notes || "No notes"}</p>
                            </div>
                          </div>
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
