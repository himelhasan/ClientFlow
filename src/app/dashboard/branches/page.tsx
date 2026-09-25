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
  TrendingUp,
  Users,
  Calendar,
  Box,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { formatBDT, formatBdDate } from "@/lib/utils/bangladesh";

export default function MultiLocationBranchesPage() {
  const [branches, setBranches] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLocationId, setActiveLocationId] = useState<string>("ALL");

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
    branchId: "",
  });

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/branches");
      const data = await res.json();
      setBranches(data.branches || []);
      setHolidays(data.holidays || []);
      const savedBranch = localStorage.getItem("clientflow_branch_id");
      if (savedBranch) setActiveLocationId(savedBranch);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function selectGlobalBranch(branchId: string) {
    setActiveLocationId(branchId);
    try {
      localStorage.setItem("clientflow_branch_id", branchId);
      window.dispatchEvent(new Event("clientflow-branch-changed"));
    } catch (_) {}
  }

  async function handleCreateBranch(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branchForm),
      });
      const data = await res.json();
      if (res.ok && data.branch) {
        setBranches((prev) => [...prev, data.branch]);
        setShowBranchForm(false);
        setBranchForm({ name: "", address: "", phone: "", isMain: false });
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
      const data = await res.json();
      if (res.ok && data.holiday) {
        setHolidays((prev) => [...prev, data.holiday]);
        setShowHolidayForm(false);
        setHolidayForm({ reason: "", startDate: "", endDate: "", branchId: "" });
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

  const totalNetworkRevenue = branches.reduce(
    (acc, b) => acc + Number(b.metrics?.monthlyRevenue || 0),
    0
  );
  const totalNetworkBookings = branches.reduce(
    (acc, b) => acc + Number(b.metrics?.bookingsCount || b._count?.bookings || 0),
    0
  );
  const totalNetworkStaff = branches.reduce(
    (acc, b) => acc + Number(b.metrics?.staffCount || b._count?.staff || 0),
    0
  );

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[#F8F8F6] text-[#181A1E]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9] text-[11px] font-bold mb-2">
            <Building2 className="w-3.5 h-3.5" /> Multi-Location Control Center
          </div>
          <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
            Multi-Location Command &amp; Branch Operations
          </h1>
          <p className="text-xs text-[#73767D] mt-1">
            Compare multi-branch performance, switch your active workspace location, and manage branch-specific holiday blackouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowHolidayForm(!showHolidayForm)}
            className="inline-flex items-center px-3.5 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-xs transition"
          >
            <CalendarOff className="w-4 h-4 mr-1.5 text-[#5B4712]" />
            Add Holiday Blackout
          </button>
          <button
            onClick={() => setShowBranchForm(!showBranchForm)}
            className="inline-flex items-center px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Location
          </button>
        </div>
      </div>

      {/* Network KPI Rollup */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <p className="text-[11px] font-bold uppercase text-[#73767D]">Active Locations</p>
          <p className="text-2xl font-extrabold text-[#181A1E] mt-1">
            {branches.length} Branches
          </p>
          <p className="text-[11px] text-[#184E37] font-semibold mt-1">
            All locations online &amp; synced
          </p>
        </div>
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <p className="text-[11px] font-bold uppercase text-[#73767D]">Network Monthly Revenue</p>
          <p className="text-2xl font-extrabold text-[#181A1E] mt-1">
            {formatBDT(totalNetworkRevenue)}
          </p>
          <p className="text-[11px] text-[#184E37] font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +18.4% vs last month
          </p>
        </div>
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <p className="text-[11px] font-bold uppercase text-[#73767D]">Network Appointments</p>
          <p className="text-2xl font-extrabold text-[#181A1E] mt-1">
            {totalNetworkBookings}
          </p>
          <p className="text-[11px] text-[#73767D] mt-1">Across all branches</p>
        </div>
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <p className="text-[11px] font-bold uppercase text-[#73767D]">Total Roster &amp; Rooms</p>
          <p className="text-2xl font-extrabold text-[#181A1E] mt-1">
            {totalNetworkStaff} Staff
          </p>
          <p className="text-[11px] text-[#73767D] mt-1">
            Active global filter:{" "}
            <strong className="text-[#181A1E]">
              {activeLocationId === "ALL"
                ? "All Locations"
                : branches.find((b) => b.id === activeLocationId)?.name || "All"}
            </strong>
          </p>
        </div>
      </div>

      {/* Add Branch Form */}
      {showBranchForm && (
        <form
          onSubmit={handleCreateBranch}
          className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#181A1E]">
              Add New Branch Location
            </h3>
            <button type="button" onClick={() => setShowBranchForm(false)}>
              <X className="w-4 h-4 text-[#73767D]" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Branch Name *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Banani Road 11 Studio"
                value={branchForm.name}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Address
              </label>
              <input
                type="text"
                placeholder="House 14, Road 11, Banani, Dhaka"
                value={branchForm.address}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, address: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Branch Phone
              </label>
              <input
                type="text"
                placeholder="017XXXXXXXX"
                value={branchForm.phone}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, phone: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <label className="inline-flex items-center gap-2 text-xs font-medium cursor-pointer text-[#181A1E]">
              <input
                type="checkbox"
                checked={branchForm.isMain}
                onChange={(e) =>
                  setBranchForm({ ...branchForm, isMain: e.target.checked })
                }
                className="rounded border-[#EAEAEA] text-[#181A1E] focus:ring-[#F5C94A]"
              />
              Set as Primary Headquarters Branch
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs"
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
          className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#181A1E]">
              Add Holiday / Closed Blackout Dates
            </h3>
            <button type="button" onClick={() => setShowHolidayForm(false)}>
              <X className="w-4 h-4 text-[#73767D]" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">
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
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">
                Applies To Branch
              </label>
              <select
                value={holidayForm.branchId}
                onChange={(e) =>
                  setHolidayForm({ ...holidayForm, branchId: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              >
                <option value="">All Branches (Network-Wide)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">
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
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">
                End Date *
              </label>
              <input
                required
                type="date"
                value={holidayForm.endDate}
                onChange={(e) =>
                  setHolidayForm({ ...holidayForm, endDate: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs"
            >
              Block Dates
            </button>
          </div>
        </form>
      )}

      {/* Branches Comparison Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#181A1E] flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Multi-Location Directory &amp; Performance ({branches.length})
          </h2>
          {activeLocationId !== "ALL" && (
            <button
              onClick={() => selectGlobalBranch("ALL")}
              className="text-xs font-semibold text-[#184E37] hover:underline"
            >
              Reset to All Locations View
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {branches.map((b) => {
            const isSelected = activeLocationId === b.id;
            const util = b.metrics?.utilizationPct ?? 75;
            return (
              <div
                key={b.id}
                className={`bg-white rounded-[20px] border p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-col justify-between space-y-5 transition ${
                  isSelected
                    ? "border-[#F5C94A] ring-2 ring-[#F5C94A]/20"
                    : "border-[#EAEAEA]"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-extrabold text-[#181A1E]">
                        {b.name}
                      </h3>
                      <p className="text-xs text-[#73767D] mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {b.address || "Dhaka, Bangladesh"}
                      </p>
                    </div>
                    {b.isMain && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9] shrink-0">
                        <Star className="w-3 h-3 mr-1 fill-[#184E37]" /> HQ
                      </span>
                    )}
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="bg-[#F8F8FA] rounded-[14px] p-3 border border-[#EAEAEA]">
                      <span className="text-[10px] font-semibold uppercase text-[#73767D] block">
                        Revenue
                      </span>
                      <span className="text-xs font-extrabold text-[#181A1E] mt-0.5 block">
                        {formatBDT(b.metrics?.monthlyRevenue || 0)}
                      </span>
                    </div>
                    <div className="bg-[#F8F8FA] rounded-[14px] p-3 border border-[#EAEAEA]">
                      <span className="text-[10px] font-semibold uppercase text-[#73767D] block">
                        Bookings
                      </span>
                      <span className="text-xs font-extrabold text-[#181A1E] mt-0.5 block">
                        {b.metrics?.bookingsCount || b._count?.bookings || 0}
                      </span>
                    </div>
                    <div className="bg-[#F8F8FA] rounded-[14px] p-3 border border-[#EAEAEA]">
                      <span className="text-[10px] font-semibold uppercase text-[#73767D] block">
                        Staff / Rooms
                      </span>
                      <span className="text-xs font-extrabold text-[#181A1E] mt-0.5 block">
                        {b.metrics?.staffCount || b._count?.staff || 0} /{" "}
                        {b.metrics?.resourcesCount || 3}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Utilization Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#73767D] font-medium">
                        Slot &amp; Room Utilization
                      </span>
                      <span className="font-bold text-[#181A1E]">
                        {util}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[#F3F1E8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F5C94A] rounded-full"
                        style={{ width: `${util}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-between gap-2">
                  <button
                    onClick={() => selectGlobalBranch(isSelected ? "ALL" : b.id)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition ${
                      isSelected
                        ? "bg-[#F5C94A] text-[#181A1E]"
                        : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isSelected ? "Active Workspace Branch" : "Switch Workspace Here"}
                  </button>
                  <button
                    onClick={() => deleteBranch(b.id)}
                    className="p-2 bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2] rounded-xl hover:opacity-80 transition"
                    title="Delete Branch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Holidays List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#181A1E] flex items-center gap-2">
          <CalendarOff className="w-4 h-4 text-[#5B4712]" /> Holiday &amp; Closed
          Blackout Dates ({holidays.length})
        </h2>

        {holidays.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] text-center text-xs text-[#73767D]">
            No closed holiday dates scheduled. Regular weekly hours apply across all branches.
          </div>
        ) : (
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-2.5">
            {holidays.map((h) => (
              <div
                key={h.id}
                className="bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6] flex items-center justify-center font-bold">
                    <CalendarOff className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-[#181A1E]">
                      {h.reason || "Closed Holiday"}
                    </p>
                    <p className="text-[#73767D] text-[11px]">
                      {formatBdDate(h.startDate)} → {formatBdDate(h.endDate)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteHoliday(h.id)}
                  className="p-1.5 bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2] rounded-xl hover:opacity-80 transition"
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
