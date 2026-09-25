"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  CalendarOff,
  Phone,
  Building2,
  Loader2,
  X,
  Star,
} from "lucide-react";
import { formatBdDate } from "@/lib/utils/bangladesh";

export default function BranchesAndHolidaysPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [branchForm, setBranchForm] = useState({
    name: "",
    address: "",
    phone: "",
    isMain: false,
  });

  const [holidayForm, setHolidayForm] = useState({
    reason: "",
    startDate: "",
    endDate: "",
  });

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/branches");
      const data = await res.json();
      setBranches(data.branches || []);
      setHolidays(data.holidays || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateBranch(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branchForm),
      });
      if (res.ok) {
        setShowBranchForm(false);
        setBranchForm({ name: "", address: "", phone: "", isMain: false });
        await loadData();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateHoliday(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "HOLIDAY", ...holidayForm }),
      });
      if (res.ok) {
        setShowHolidayForm(false);
        setHolidayForm({ reason: "", startDate: "", endDate: "" });
        await loadData();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteBranch(id: string) {
    if (!confirm("Remove this branch location?")) return;
    await fetch(`/api/v1/branches?branchId=${id}`, { method: "DELETE" });
    setBranches((prev) => prev.filter((b) => b.id !== id));
  }

  async function deleteHoliday(id: string) {
    await fetch(`/api/v1/branches?holidayId=${id}`, { method: "DELETE" });
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  }

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Branches &amp; Holidays
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage physical locations and holiday blackout dates (Eid, Pohela Boishakh, clinic vacations).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowHolidayForm(!showHolidayForm)}
            className="inline-flex items-center px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <CalendarOff className="w-4 h-4 mr-1.5 text-amber-600" />
            Add Holiday Blackout
          </button>
          <button
            onClick={() => setShowBranchForm(!showBranchForm)}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Branch
          </button>
        </div>
      </div>

      {/* Add Branch Form */}
      {showBranchForm && (
        <form
          onSubmit={handleCreateBranch}
          className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Add New Branch Location
            </h3>
            <button type="button" onClick={() => setShowBranchForm(false)}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Branch Name *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Dhanmondi Flagship Clinic"
                value={branchForm.name}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Address
              </label>
              <input
                type="text"
                placeholder="House 14, Road 27, Dhanmondi, Dhaka"
                value={branchForm.address}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, address: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Branch Phone
              </label>
              <input
                type="text"
                placeholder="017XXXXXXXX"
                value={branchForm.phone}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={branchForm.isMain}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, isMain: e.target.checked })
                }
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Set as Primary Headquarters Branch
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
            >
              Save Branch
            </button>
          </div>
        </form>
      )}

      {/* Add Holiday Form */}
      {showHolidayForm && (
        <form
          onSubmit={handleCreateHoliday}
          className="bg-amber-50/70 p-6 rounded-2xl border border-amber-200 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-950">
              Add Holiday / Closed Dates
            </h3>
            <button type="button" onClick={() => setShowHolidayForm(false)}>
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Holiday / Occasion *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Eid-ul-Fitr Holiday"
                value={holidayForm.reason}
                onChange={(e) =>
                  setHolidayForm({ ...holidayForm, reason: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Start Date *
              </label>
              <input
                required
                type="date"
                value={holidayForm.startDate}
                onChange={(e) =>
                  setHolidayForm({
                    ...holidayForm,
                    startDate: e.target.value,
                    endDate: holidayForm.endDate || e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                End Date *
              </label>
              <input
                required
                type="date"
                value={holidayForm.endDate}
                onChange={(e) =>
                  setHolidayForm({ ...holidayForm, endDate: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700"
            >
              Block Dates
            </button>
          </div>
        </form>
      )}

      {/* Branches Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600" /> Branch Locations (
          {branches.length})
        </h2>

        {branches.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center space-y-2">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              Single-location mode active
            </p>
            <p className="text-xs text-slate-400">
              Add branches if your business operates across multiple areas (e.g. Banani, Gulshan, Dhanmondi).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branches.map((b) => (
              <div
                key={b.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">
                      {b.name}
                    </h3>
                    {b.isMain && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Star className="w-3 h-3 mr-1 fill-emerald-600" /> Main HQ
                      </span>
                    )}
                  </div>
                  {b.address && (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {b.address}
                    </p>
                  )}
                  {b.phone && (
                    <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {b.phone}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    <strong>{b._count?.staff || 0}</strong> staff ·{" "}
                    <strong>{b._count?.bookings || 0}</strong> bookings
                  </span>
                  <button
                    onClick={() => deleteBranch(b.id)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Holidays List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <CalendarOff className="w-4 h-4 text-amber-600" /> Holiday &amp; Closed
          Blackout Dates ({holidays.length})
        </h2>

        {holidays.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-xs text-slate-400">
            No closed holiday dates scheduled. Regular weekly hours apply.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100">
            {holidays.map((h) => (
              <div
                key={h.id}
                className="p-4 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <CalendarOff className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {h.reason || "Closed Holiday"}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {formatBdDate(h.startDate)} → {formatBdDate(h.endDate)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteHoliday(h.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
