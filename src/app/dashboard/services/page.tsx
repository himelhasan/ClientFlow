"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  Plus,
  Clock,
  Loader2,
  Pencil,
  X,
  ToggleLeft,
  ToggleRight,
  Save,
  Users,
  ShieldCheck,
  AlertCircle,
  Wallet,
  Building2,
  MapPin,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatBDT } from "@/lib/utils/bangladesh";

interface Branch {
  id: string;
  name: string;
  isMain?: boolean;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  branchId?: string | null;
  branch?: Branch | null;
  durationMinutes: number;
  price: number | string;
  pricingModel: string;
  category?: string;
  bufferTimeMinutes: number;
  isActive: boolean;
  maxCapacity: number;
  allowGroupBooking: boolean;
  depositType: "NONE" | "FIXED" | "PERCENTAGE" | string;
  depositValue: number | string;
  cancellationFee: number | string;
  cancellationWindowHours: number;
}

const PRICING_MODELS = ["FIXED", "STARTING_FROM", "FREE", "REQUEST_QUOTE", "CUSTOM"];
const DEPOSIT_TYPES = [
  { value: "NONE", label: "No Advance Deposit" },
  { value: "FIXED", label: "Fixed Amount (৳ BDT)" },
  { value: "PERCENTAGE", label: "Percentage (%)" },
];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyForm = {
    name: "",
    branchId: "",
    durationMinutes: 30,
    price: 800,
    description: "",
    pricingModel: "FIXED",
    category: "",
    bufferTimeMinutes: 0,
    allowGroupBooking: false,
    maxCapacity: 1,
    depositType: "NONE",
    depositValue: 0,
    cancellationFee: 0,
    cancellationWindowHours: 24,
  };

  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState<Partial<Service>>({});

  async function loadServices() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/services");
      const data = await res.json();
      setServices(data.services || []);
      if (data.branches) setBranches(data.branches);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    toast.loading("Creating service...", { id: "srv-op" });

    try {
      const res = await fetch("/api/v1/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(`${form.name} created successfully!`, { id: "srv-op" });
        setShowAdd(false);
        setForm(emptyForm);
        await loadServices();
      } else {
        toast.error(data.error || "Failed to create service", { id: "srv-op" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create service", { id: "srv-op" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(serviceId: string) {
    setSubmitting(true);
    toast.loading("Saving service changes...", { id: "srv-op" });

    try {
      const res = await fetch("/api/v1/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, ...editForm }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Service updated!", { id: "srv-op" });
        setEditingId(null);
        setEditForm({});
        await loadServices();
      } else {
        toast.error(data.error || "Failed to update service", { id: "srv-op" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update service", { id: "srv-op" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(service: Service) {
    try {
      await fetch("/api/v1/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, isActive: !service.isActive }),
      });
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isActive: !service.isActive } : s))
      );
      toast.success(service.isActive ? "Service hidden" : "Service activated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  }

  function startEdit(s: Service) {
    setEditingId(s.id);
    setEditForm({
      name: s.name,
      branchId: s.branchId || "",
      description: s.description || "",
      durationMinutes: s.durationMinutes,
      price: Number(s.price),
      pricingModel: s.pricingModel,
      category: s.category || "",
      bufferTimeMinutes: s.bufferTimeMinutes,
      allowGroupBooking: Boolean(s.allowGroupBooking),
      maxCapacity: Number(s.maxCapacity || 1),
      depositType: s.depositType || "NONE",
      depositValue: Number(s.depositValue || 0),
      cancellationFee: Number(s.cancellationFee || 0),
      cancellationWindowHours: Number(s.cancellationWindowHours ?? 24),
    });
  }

  const filteredServices = services.filter((s) => {
    if (selectedBranchFilter === "ALL") return true;
    return !s.branchId || s.branchId === selectedBranchFilter;
  });

  return (
    <div className="space-y-6 bg-[#F8F8F6] text-[#181A1E]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
            Services, Branch Assignments &amp; Deposit Rules
          </h1>
          <p className="text-xs text-[#73767D] mt-1">
            Configure service offerings, assign them to branches, enforce group capacity, advance deposits, and late cancellation policies.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAdd(true);
            setEditingId(null);
          }}
          className="inline-flex items-center px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Service
        </button>
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
            All Branches ({services.length})
          </button>
          {branches.map((b) => {
            const count = services.filter((s) => !s.branchId || s.branchId === b.id).length;
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

      {/* Add Service Modal / Card */}
      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#181A1E]">Add New Service</h3>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="text-[#73767D] hover:text-[#181A1E]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase mb-1">
                Service Name *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Signature HydraFacial"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1">
                Branch Location
              </label>
              <select
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs focus:border-[#F5C94A] focus:outline-none"
              >
                <option value="">Available at All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.isMain ? "(HQ)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. Facial & Skin"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1">
                Price (৳ BDT)
              </label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="5"
                step="5"
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm({ ...form, durationMinutes: Number(e.target.value) })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase mb-1">
                Deposit Policy
              </label>
              <select
                value={form.depositType}
                onChange={(e) => setForm({ ...form, depositType: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs focus:border-[#F5C94A] focus:outline-none"
              >
                {DEPOSIT_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Service"}
            </button>
          </div>
        </form>
      )}

      {/* Services List Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#181A1E] flex items-center gap-2">
          <Briefcase className="w-4 h-4" /> Active Offerings ({filteredServices.length})
        </h2>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-8 text-center space-y-2">
            <Briefcase className="w-8 h-8 text-[#73767D] mx-auto" />
            <p className="text-xs font-bold text-[#181A1E]">No services found</p>
            <p className="text-xs text-[#73767D]">
              Click &apos;Add Service&apos; above to configure your offerings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((svc) => {
              const assignedBranch =
                svc.branch || branches.find((b) => b.id === svc.branchId);

              return (
                <div
                  key={svc.id}
                  className="bg-white rounded-[20px] border border-[#EAEAEA] p-5 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-[#181A1E]">
                          {svc.name}
                        </h3>
                        {svc.category && (
                          <span className="text-[11px] text-[#73767D] font-medium">
                            {svc.category}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-extrabold text-[#181A1E]">
                        {formatBDT(svc.price)}
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
                          All Branches
                        </span>
                      )}
                    </div>

                    {svc.description && (
                      <p className="text-xs text-[#73767D] line-clamp-2">
                        {svc.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F3F1E8] text-[#262930]">
                        <Clock className="w-3 h-3" />
                        {svc.durationMinutes} min
                      </span>
                      {svc.allowGroupBooking && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E2F2FA] text-[#0A4D68]">
                          <Users className="w-3 h-3" /> Group: Max {svc.maxCapacity}
                        </span>
                      )}
                      {svc.depositType && svc.depositType !== "NONE" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E3F5EC] text-[#184E37]">
                          <Wallet className="w-3 h-3" />
                          {svc.depositType === "PERCENTAGE"
                            ? `${svc.depositValue}% Deposit`
                            : `${formatBDT(svc.depositValue)} Deposit`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-between gap-2">
                    <button
                      onClick={() => startEdit(svc)}
                      className="flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] flex items-center justify-center gap-1.5 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(svc)}
                      className="py-1.5 px-3 rounded-xl text-xs font-medium border border-[#EAEAEA] hover:bg-slate-50 transition"
                    >
                      {svc.isActive ? "Deactivate" : "Activate"}
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
