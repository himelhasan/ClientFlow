"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Phone,
  Mail,
  UserCheck,
  Loader2,
  X,
  Pencil,
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  photo: string | null;
  status: string;
  createdAt: string;
  user?: { id: string; email: string | null; phone: string | null } | null;
}

const DEFAULT_FORM = {
  name: "",
  phone: "",
  email: "",
  role: "",
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Shared form state — used for both add and edit
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ------------------------------------------------------------------ fetch --
  async function loadStaff() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/staff");
      const data = await res.json();
      setStaff(data.staff || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  // ----------------------------------------------------------------- create --
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        cancelForm();
        await loadStaff();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create staff member");
      }
    } catch (err) {
      alert("Failed to create staff member");
    } finally {
      setSubmitting(false);
    }
  }

  // ------------------------------------------------------------------ edit --
  function openEdit(member: StaffMember) {
    setEditingId(member.id);
    setForm({
      name: member.name,
      phone: member.phone || "",
      email: member.email || "",
      role: member.role || "",
    });
    setShowAdd(false); // close add form if open
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: editingId, ...form }),
      });
      if (res.ok) {
        cancelForm();
        await loadStaff();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update staff member");
      }
    } catch (err) {
      alert("Failed to update staff member");
    } finally {
      setSubmitting(false);
    }
  }

  // --------------------------------------------------------------- toggle ---
  async function toggleStatus(member: StaffMember) {
    setTogglingId(member.id);
    const newStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch("/api/v1/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: member.id, status: newStatus }),
      });
      if (res.ok) {
        // Optimistic update
        setStaff((prev) =>
          prev.map((s) =>
            s.id === member.id ? { ...s, status: newStatus } : s
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  }

  // ---------------------------------------------------------------- helpers --
  function cancelForm() {
    setShowAdd(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
  }

  function openAdd() {
    setEditingId(null);
    setForm(DEFAULT_FORM);
    setShowAdd(true);
  }

  // -------------------------------------------------------------- inline form --
  function StaffForm({
    title,
    onSubmit,
  }: {
    title: string;
    onSubmit: (e: React.FormEvent) => void;
  }) {
    return (
      <form
        onSubmit={onSubmit}
        className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-4"
      >
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Rina Islam"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Role / Designation
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Therapist"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Phone
            </label>
            <input
              type="tel"
              placeholder="e.g. 01711-123456"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="e.g. rina@clinic.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={cancelForm}
            className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 flex items-center transition disabled:opacity-60"
          >
            {submitting && (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            )}
            {editingId ? "Save Changes" : "Add Staff"}
          </button>
        </div>
      </form>
    );
  }

  // -------------------------------------------------------------- render ----
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Staff
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your team members, roles, and availability for bookings.
          </p>
        </div>

        <button
          onClick={openAdd}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Staff Member
        </button>
      </div>

      {/* ── Add Form ── */}
      {showAdd && (
        <StaffForm title="Add New Staff Member" onSubmit={handleCreate} />
      )}

      {/* ── Edit Form (inline, above the cards) ── */}
      {editingId && (
        <StaffForm title="Edit Staff Member" onSubmit={handleUpdate} />
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-2">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No staff added yet</h3>
          <p className="text-xs text-slate-400">
            Add your team members so customers can choose who they book with.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => {
            const isActive = member.status === "ACTIVE";
            const isEditingThis = editingId === member.id;

            return (
              <div
                key={member.id}
                className={`bg-white p-5 rounded-2xl border shadow-xs flex flex-col justify-between transition ${
                  isEditingThis
                    ? "border-emerald-300 ring-1 ring-emerald-200"
                    : "border-slate-200/80"
                }`}
              >
                {/* ── Card top ── */}
                <div className="flex items-start justify-between gap-3">
                  {/* Avatar / Initials */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center flex-shrink-0 uppercase select-none">
                      {member.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        member.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {member.name}
                      </h3>
                      {member.role && (
                        <p className="text-xs text-slate-500 truncate">
                          {member.role}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* ── Contact info ── */}
                <div className="mt-4 space-y-1.5">
                  {member.phone ? (
                    <div className="flex items-center text-xs text-slate-600">
                      <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{member.phone}</span>
                    </div>
                  ) : null}
                  {member.email ? (
                    <div className="flex items-center text-xs text-slate-600">
                      <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  ) : null}
                  {!member.phone && !member.email && (
                    <p className="text-xs text-slate-400 italic">
                      No contact info
                    </p>
                  )}
                </div>

                {/* ── Card actions ── */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Edit button */}
                  <button
                    onClick={() =>
                      isEditingThis ? cancelForm() : openEdit(member)
                    }
                    className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-700 transition"
                  >
                    {isEditingThis ? (
                      <>
                        <X className="w-3.5 h-3.5 mr-1" />
                        Cancel Edit
                      </>
                    ) : (
                      <>
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </>
                    )}
                  </button>

                  {/* Toggle active / inactive */}
                  <button
                    onClick={() => toggleStatus(member)}
                    disabled={togglingId === member.id}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-60 ${
                      isActive
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {togglingId === member.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 mr-1" />
                    )}
                    {isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
