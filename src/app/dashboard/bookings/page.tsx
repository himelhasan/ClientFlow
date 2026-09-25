"use client";

import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  AlertCircle,
  Loader2,
  Filter,
} from "lucide-react";
import { formatBDT, formatBdDate } from "@/lib/utils/bangladesh";

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadBookings() {
    setLoading(true);
    try {
      const url = filter === "ALL" ? "/api/v1/bookings" : `/api/v1/bookings?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, [filter]);

  async function handleStatusChange(bookingId: string, newStatus: string) {
    setUpdatingId(bookingId);
    try {
      const res = await fetch("/api/v1/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });
      if (res.ok) {
        await loadBookings();
      }
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Bookings & Appointments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage scheduled customer appointments, confirmations, and attendance.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold">
          {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  filter === status
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {status.replace("_", " ")}
              </button>
            )
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-2">
          <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No bookings found</h3>
          <p className="text-xs text-slate-400">
            Appointments booked through your website widget will appear here automatically.
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
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Fee</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {b.bookingNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">{b.customer?.name}</p>
                      <p className="text-slate-500 font-mono text-[11px]">{b.customer?.phone}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {b.service?.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-900">{formatBdDate(b.date)}</p>
                      <p className="text-slate-500 text-[11px]">{b.startTime}</p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {formatBDT(b.price)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : b.status === "COMPLETED"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : b.status === "CANCELLED"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : b.status === "NO_SHOW"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {updatingId === b.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600 inline" />
                      ) : (
                        <div className="inline-flex items-center space-x-1.5">
                          {b.status !== "COMPLETED" && (
                            <button
                              onClick={() => handleStatusChange(b.id, "COMPLETED")}
                              title="Mark as Completed"
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-[11px] font-semibold text-slate-700"
                            >
                              Complete
                            </button>
                          )}
                          {b.status !== "CANCELLED" && (
                            <button
                              onClick={() => handleStatusChange(b.id, "CANCELLED")}
                              title="Cancel"
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-red-50 hover:text-red-700 text-[11px] font-semibold text-slate-700"
                            >
                              Cancel
                            </button>
                          )}
                          {b.status !== "NO_SHOW" && (
                            <button
                              onClick={() => handleStatusChange(b.id, "NO_SHOW")}
                              title="No Show"
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-[11px] font-semibold text-slate-700"
                            >
                              No-Show
                            </button>
                          )}
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
    </div>
  );
}
