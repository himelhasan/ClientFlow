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
  Building2,
  Star,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";

interface Branch {
  id: string;
  name: string;
  isMain?: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: string | null;
  photo: string | null;
  branchId: string | null;
  branch?: Branch | null;
  status: string;
  createdAt: string;
  user?: { id: string; email: string | null; phone: string | null } | null;
}

const DEFAULT_FORM = {
  name: "",
  phone: "",
  email: "",
  role: "",
  branchId: "",
};

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Shared form state — used for both add and edit
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadStaff() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/staff");
      const data = await res.json();
      setStaff(data.staff || []);
      if (data.branches) setBranches(data.branches);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  function cancelForm() {
    setShowAdd(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    toast.loading("Adding staff member...", { id: "staff-op" });

    try {
      const res = await fetch("/api/v1/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(`${form.name} added to team!`, { id: "staff-op" });
        cancelForm();
        await loadStaff();
      } else {
        toast.error(data.error || "Failed to create staff member", { id: "staff-op" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create staff member", { id: "staff-op" });
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(member: StaffMember) {
    setEditingId(member.id);
    setForm({
      name: member.name,
      phone: member.phone || "",
      email: member.email || "",
      role: member.role || "",
      branchId: member.branchId || "",
    });
    setShowAdd(false);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSubmitting(true);
    toast.loading("Saving changes...", { id: "staff-op" });

    try {
      const res = await fetch("/api/v1/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: editingId, ...form }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Staff profile updated!", { id: "staff-op" });
        cancelForm();
        await loadStaff();
      } else {
        toast.error(data.error || "Failed to update staff member", { id: "staff-op" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update staff member", { id: "staff-op" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(member: StaffMember) {
    const nextStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setTogglingId(member.id);

    try {
      const res = await fetch("/api/v1/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: member.id, status: nextStatus }),
      });

      if (res.ok) {
        setStaff((prev) =>
          prev.map((s) => (s.id === member.id ? { ...s, status: nextStatus } : s))
        );
        toast.success(`Status updated to ${nextStatus}`);
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      toast.error("Network error updating status");
    } finally {
      setTogglingId(null);
    }
  }

  const filteredStaff = staff.filter((s) => {
    if (selectedBranchFilter === "ALL") return true;
    return s.branchId === selectedBranchFilter;
  });

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
            Staff Members &amp; Branch Rosters
          </h1>
          <p className="text-xs text-[#73767D] mt-1">
            Assign staff members to specific branch locations to maintain separate branch calendars.
          </p>
        </div>

        {!showAdd && !editingId && (
          <button
            onClick={() => {
              setForm(DEFAULT_FORM);
              setShowAdd(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Staff Member
          </button>
        )}
      </div>

      {/* Branch Location Filter Tabs */}
      {branches.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-[#73767D] shrink-0 mr-1 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" /> Filter by Branch:
          </span>
          <button
            onClick={() => setSelectedBranchFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
              selectedBranchFilter === "ALL"
                ? "bg-[#181A1E] text-white"
                : "bg-white border border-[#EAEAEA] text-[#73767D] hover:text-[#181A1E]"
            }`}
          >
            All Branches ({staff.length})
          </button>
          {branches.map((b) => {
            const count = staff.filter((s) => s.branchId === b.id).length;
            const isSelected = selectedBranchFilter === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setSelectedBranchFilter(b.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#181A1E] text-white"
                    : "bg-white border border-[#EAEAEA] text-[#73767D] hover:text-[#181A1E]"
                }`}
              >
                <span>{b.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Add / Edit Staff Form */}
      {(showAdd || editingId !== null) && (
        <form
          onSubmit={editingId !== null ? handleUpdate : handleCreate}
          className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#181A1E]">
              {editingId !== null ? "Edit Staff Profile & Branch" : "Add New Staff Member"}
            </h3>
            <button
              type="button"
              onClick={cancelForm}
              className="text-[#73767D] hover:text-[#181A1E] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Full Name *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Dr. Sadia Sultana"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Role / Title
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Specialist / Lead Therapist"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Assigned Branch Location
              </label>
              <select
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              >
                <option value="">Unassigned (All Branches)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.isMain ? "(HQ)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                placeholder="017XXXXXXXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="staff@business.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={cancelForm}
              className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs transition disabled:opacity-50"
            >
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </span>
              ) : editingId !== null ? (
                "Save Changes"
              ) : (
                "Save Staff Member"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Staff Directory Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#181A1E] flex items-center gap-2">
          <Users className="w-4 h-4" /> Team Directory ({filteredStaff.length})
        </h2>

        {filteredStaff.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-8 text-center space-y-2">
            <Users className="w-8 h-8 text-[#73767D] mx-auto" />
            <p className="text-xs font-bold text-[#181A1E]">No staff members found</p>
            <p className="text-xs text-[#73767D]">
              {selectedBranchFilter === "ALL"
                ? "Click 'Add Staff Member' above to build your team roster."
                : "No staff members are assigned to this branch location yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((member) => {
              const assignedBranch =
                member.branch || branches.find((b) => b.id === member.branchId);

              return (
                <div
                  key={member.id}
                  className="bg-white rounded-[20px] border border-[#EAEAEA] p-5 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#D6D7DB] flex items-center justify-center font-bold text-white text-sm shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#181A1E] leading-tight">
                            {member.name}
                          </h3>
                          <p className="text-xs text-[#73767D]">{member.role || "Team Member"}</p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          member.status === "ACTIVE"
                            ? "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]"
                            : "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]"
                        }`}
                      >
                        {member.status}
                      </span>
                    </div>

                    {/* Branch Assignment Badge */}
                    <div className="p-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] flex items-center justify-between text-xs">
                      <span className="text-[#73767D] text-[11px] font-semibold flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Location:
                      </span>
                      {assignedBranch ? (
                        <span className="font-bold text-[#181A1E] text-[11px] flex items-center gap-1">
                          {assignedBranch.name}
                          {assignedBranch.isMain && (
                            <span className="text-[9px] bg-amber-100 text-amber-900 px-1 rounded">
                              HQ
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[#73767D] text-[11px] font-medium">
                          All Branches (Floating)
                        </span>
                      )}
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-1 text-xs text-[#73767D]">
                      {member.phone && (
                        <p className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          {member.phone}
                        </p>
                      )}
                      {member.email && (
                        <p className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          {member.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-between gap-2">
                    <button
                      onClick={() => openEdit(member)}
                      className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] flex items-center justify-center gap-1.5 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit &amp; Reassign Branch
                    </button>
                    <button
                      onClick={() => handleToggleStatus(member)}
                      disabled={togglingId === member.id}
                      className="py-1.5 px-3 rounded-xl text-xs font-medium border border-[#EAEAEA] hover:bg-slate-50 transition"
                    >
                      {togglingId === member.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : member.status === "ACTIVE" ? (
                        "Deactivate"
                      ) : (
                        "Activate"
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
