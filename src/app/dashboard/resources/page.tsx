"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Wrench,
  Clock,
  Building2,
  CalendarPlus,
  Layers,
} from "lucide-react";

const RESOURCE_TYPES = ["ALL", "ROOM", "EQUIPMENT", "CHAIR", "VEHICLE", "BAY"];
const RESOURCE_STATUSES = ["ALL", "AVAILABLE", "MAINTENANCE", "RETIRED"];
const HOURS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]",
  MAINTENANCE: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  RETIRED: "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]",
};

const TYPE_BADGE: Record<string, string> = {
  ROOM: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
  EQUIPMENT: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  CHAIR: "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]",
  VEHICLE: "bg-[#F3F1E8] text-[#262930] border border-[#EAEAEA]",
  BAY: "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]",
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<any | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignResource, setAssignResource] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = {
    name: "",
    type: "ROOM",
    description: "",
    quantity: 1,
    status: "AVAILABLE",
    branchName: "Gulshan Flagship",
  };
  const [form, setForm] = useState(emptyForm);

  const [assignForm, setAssignForm] = useState({
    bookingId: "",
    customerName: "",
    serviceName: "",
    startTime: "10:00",
    endTime: "11:00",
    quantity: 1,
  });

  async function loadData() {
    setLoading(true);
    try {
      const [resResources, resBookings] = await Promise.all([
        fetch("/api/v1/resources"),
        fetch("/api/v1/bookings?limit=25"),
      ]);
      const rData = await resResources.json();
      setResources(rData.resources || []);
      if (resBookings.ok) {
        const bData = await resBookings.json();
        setBookings(bData.bookings || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const branches = Array.from(
    new Set(
      resources
        .map((r) => r.branch?.name || "Main Branch")
        .filter(Boolean)
    )
  );

  const filteredResources = resources.filter((r) => {
    if (typeFilter !== "ALL" && r.type !== typeFilter) return false;
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (branchFilter !== "ALL" && (r.branch?.name || "Main Branch") !== branchFilter) return false;
    return true;
  });

  async function handleSaveResource(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingResource) {
        const res = await fetch("/api/v1/resources", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId: editingResource.id, ...form }),
        });
        if (res.ok) {
          setShowModal(false);
          setEditingResource(null);
          await loadData();
        }
      } else {
        const res = await fetch("/api/v1/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "CREATE_RESOURCE", ...form }),
        });
        if (res.ok) {
          setShowModal(false);
          setForm(emptyForm);
          await loadData();
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssignToBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!assignResource) return;
    setSubmitting(true);
    try {
      const selectedBooking = bookings.find((b) => b.id === assignForm.bookingId);
      const res = await fetch("/api/v1/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN_BOOKING",
          resourceId: assignResource.id,
          bookingId: selectedBooking?.id || assignForm.bookingId || `#${Math.floor(1020 + Math.random() * 80)}`,
          customerName: selectedBooking?.customer?.name || assignForm.customerName || "Scheduled Client",
          serviceName: selectedBooking?.service?.name || assignForm.serviceName || "Treatment Session",
          startTime: selectedBooking?.startTime || assignForm.startTime,
          endTime: selectedBooking?.endTime || assignForm.endTime,
          quantity: assignForm.quantity,
        }),
      });
      if (res.ok) {
        setShowAssignModal(false);
        setAssignResource(null);
        await loadData();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteResource(resourceId: string) {
    await fetch(`/api/v1/resources?resourceId=${resourceId}`, { method: "DELETE" });
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
  }

  async function handleCycleStatus(resource: any) {
    const nextStatus =
      resource.status === "AVAILABLE"
        ? "MAINTENANCE"
        : resource.status === "MAINTENANCE"
        ? "RETIRED"
        : "AVAILABLE";
    await fetch("/api/v1/resources", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId: resource.id, status: nextStatus }),
    });
    setResources((prev) =>
      prev.map((r) => (r.id === resource.id ? { ...r, status: nextStatus } : r))
    );
  }

  return (
    <div className="space-y-6 bg-[#F8F8F6] text-[#181A1E]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
            Resources &amp; Equipment Inventory
          </h1>
          <p className="text-xs text-[#73767D] mt-1">
            Manage physical rooms, medical/service equipment, chairs, vehicles, and bays attached to appointments.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingResource(null);
            setForm(emptyForm);
            setShowModal(true);
          }}
          className="inline-flex items-center px-4 py-2.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Resource
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <p className="text-[11px] font-bold uppercase text-[#73767D]">Total Inventory</p>
          <p className="text-2xl font-extrabold text-[#181A1E] mt-1">{resources.length}</p>
        </div>
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <p className="text-[11px] font-bold uppercase text-[#73767D]">Available Now</p>
          <p className="text-2xl font-extrabold mt-1 text-[#184E37]">
            {resources.filter((r) => r.status === "AVAILABLE").length}
          </p>
        </div>
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <p className="text-[11px] font-bold uppercase text-[#73767D]">In Maintenance</p>
          <p className="text-2xl font-extrabold mt-1 text-[#5B4712]">
            {resources.filter((r) => r.status === "MAINTENANCE").length}
          </p>
        </div>
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <p className="text-[11px] font-bold uppercase text-[#73767D]">Active Assignments</p>
          <p className="text-2xl font-extrabold text-[#181A1E] mt-1">
            {resources.reduce((acc, r) => acc + (r.bookingResources?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* Type / Status / Branch Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-[20px] border border-[#EAEAEA] shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
        <div className="flex flex-wrap items-center gap-1.5">
          {RESOURCE_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                typeFilter === t
                  ? "bg-[#F5C94A] text-[#181A1E]"
                  : "bg-[#F3F1E8] text-[#262930] hover:bg-[#EAE6D7]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
          >
            {RESOURCE_STATUSES.map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resource Utilization Timeline */}
      {filteredResources.length > 0 && (
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-[#181A1E] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#5B4712]" />
                Daily Resource Utilization Timeline
              </h2>
              <p className="text-[11px] text-[#73767D]">
                Live schedule of occupied rooms, chairs, and equipment across the day.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[720px] space-y-2">
              <div className="grid grid-cols-10 gap-2 text-[10px] font-bold uppercase text-[#73767D] pb-2 border-b border-[#EAEAEA]">
                <div className="col-span-2">Resource</div>
                {HOURS.slice(0, 8).map((hr) => (
                  <div key={hr} className="text-center">
                    {hr}
                  </div>
                ))}
              </div>

              {filteredResources.map((r) => {
                const assignments = r.bookingResources || [];
                return (
                  <div
                    key={`timeline-${r.id}`}
                    className="grid grid-cols-10 gap-2 items-center py-2 border-b border-[#F8F8FA] text-xs"
                  >
                    <div className="col-span-2 pr-2">
                      <p className="font-bold text-[#181A1E] truncate">{r.name}</p>
                      <span className="text-[10px] text-[#73767D]">{r.type}</span>
                    </div>
                    {HOURS.slice(0, 8).map((hr) => {
                      const hourNum = Number(hr.split(":")[0]);
                      const matching = assignments.find((a: any) => {
                        const st = Number((a.booking?.startTime || "10:00").split(":")[0]);
                        return st === hourNum;
                      });

                      if (r.status === "MAINTENANCE") {
                        return (
                          <div
                            key={hr}
                            className="h-8 rounded-lg bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6] flex items-center justify-center text-[10px] font-semibold"
                          >
                            Maint.
                          </div>
                        );
                      }

                      if (matching) {
                        return (
                          <div
                            key={hr}
                            className="h-8 px-1.5 rounded-lg bg-[#E3F5EC] border border-[#CBEAD9] text-[#184E37] flex flex-col justify-center truncate"
                            title={`${matching.booking?.customer?.name || "Booked"} (${matching.booking?.service?.name || ""})`}
                          >
                            <span className="text-[10px] font-bold truncate">
                              {matching.booking?.customer?.name || matching.booking?.bookingNumber || "Booked"}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={hr}
                          onClick={() => {
                            setAssignResource(r);
                            setAssignForm({ ...assignForm, startTime: hr });
                            setShowAssignModal(true);
                          }}
                          className="h-8 rounded-lg bg-[#F8F8FA] hover:bg-[#F5C94A]/20 border border-dashed border-[#EAEAEA] cursor-pointer flex items-center justify-center text-[10px] text-[#73767D]"
                        >
                          Open
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Resource Cards Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-12 text-center space-y-2 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <Box className="w-10 h-10 text-[#73767D] mx-auto" />
          <h3 className="text-sm font-bold text-[#181A1E]">No matching resources</h3>
          <p className="text-xs text-[#73767D]">Add rooms, chairs, or equipment to track capacity.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      TYPE_BADGE[r.type] || "bg-[#F3F1E8] text-[#262930] border border-[#EAEAEA]"
                    }`}
                  >
                    {r.type}
                  </span>
                  <button
                    onClick={() => handleCycleStatus(r)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                      STATUS_BADGE[r.status] || "bg-[#F3F1E8] text-[#262930] border border-[#EAEAEA]"
                    }`}
                    title="Click to toggle status"
                  >
                    {r.status}
                  </button>
                </div>

                <h3 className="text-base font-bold text-[#181A1E]">{r.name}</h3>
                <p className="text-xs text-[#73767D] mt-1 line-clamp-2">
                  {r.description || "Physical resource available for appointment allocation."}
                </p>

                <div className="flex items-center gap-3 mt-3 text-[11px] text-[#73767D]">
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {r.branch?.name || "Main Branch"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    Qty: {r.quantity}
                  </span>
                </div>

                {/* Assigned Bookings List */}
                {r.bookingResources && r.bookingResources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#EAEAEA] space-y-1.5">
                    <p className="text-[10px] font-bold uppercase text-[#73767D]">
                      Assigned Bookings ({r.bookingResources.length})
                    </p>
                    {r.bookingResources.slice(0, 2).map((br: any) => (
                      <div
                        key={br.id}
                        className="flex items-center justify-between text-[11px] bg-[#F8F8FA] border border-[#EAEAEA] px-2.5 py-1.5 rounded-lg text-[#181A1E]"
                      >
                        <span className="font-semibold truncate">
                          {br.booking?.bookingNumber || "#BK"} — {br.booking?.customer?.name || "Client"}
                        </span>
                        <span className="text-[#73767D] font-mono">
                          {br.booking?.startTime || "10:00"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-[#EAEAEA] flex items-center justify-between">
                <button
                  onClick={() => {
                    setAssignResource(r);
                    setShowAssignModal(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold transition"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  Assign to Booking
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingResource(r);
                      setForm({
                        name: r.name,
                        type: r.type,
                        description: r.description || "",
                        quantity: r.quantity || 1,
                        status: r.status || "AVAILABLE",
                        branchName: r.branch?.name || "Main Branch",
                      });
                      setShowModal(true);
                    }}
                    className="p-1.5 rounded-xl bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] transition"
                    title="Edit Resource"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteResource(r.id)}
                    className="p-1.5 rounded-xl bg-[#FAD4D6] hover:opacity-80 text-[#9E2A2B] border border-[#F5BFC2] transition"
                    title="Delete Resource"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Resource Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveResource}
            className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 w-full max-w-lg space-y-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#181A1E]">
                {editingResource ? "Edit Resource" : "Add Physical Resource"}
              </h3>
              <button type="button" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4 text-[#73767D]" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">Resource Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Consultation Room B / Dental Chair #2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                >
                  {RESOURCE_TYPES.filter((t) => t !== "ALL").map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                >
                  {RESOURCE_STATUSES.filter((s) => s !== "ALL").map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">Quantity / Units</label>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">Branch</label>
                <input
                  type="text"
                  value={form.branchName}
                  onChange={(e) => setForm({ ...form, branchName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Equipment specifications or room notes..."
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] rounded-xl text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] rounded-xl text-xs font-semibold transition"
              >
                {editingResource ? "Update Resource" : "Create Resource"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Resource to Booking Modal */}
      {showAssignModal && assignResource && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleAssignToBooking}
            className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 w-full max-w-md space-y-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#181A1E]">
                Assign {assignResource.name}
              </h3>
              <button type="button" onClick={() => setShowAssignModal(false)}>
                <X className="w-4 h-4 text-[#73767D]" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">
                Select Existing Booking (or leave blank for quick slot block)
              </label>
              <select
                value={assignForm.bookingId}
                onChange={(e) => setAssignForm({ ...assignForm, bookingId: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
              >
                <option value="">Quick Slot Assignment...</option>
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bookingNumber} — {b.customer?.name} ({b.startTime})
                  </option>
                ))}
              </select>
            </div>

            {!assignForm.bookingId && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">Client Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Farhana Karim"
                    value={assignForm.customerName}
                    onChange={(e) => setAssignForm({ ...assignForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase mb-1 text-[#181A1E]">Start Time</label>
                  <select
                    value={assignForm.startTime}
                    onChange={(e) => setAssignForm({ ...assignForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] rounded-xl text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] rounded-xl text-xs font-semibold transition"
              >
                Confirm Assignment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
