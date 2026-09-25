"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  Plus,
  Clock,
  Loader2,
  Check,
  Pencil,
  X,
  ToggleLeft,
  ToggleRight,
  Save,
} from "lucide-react";
import { formatBDT } from "@/lib/utils/bangladesh";

interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number | string;
  pricingModel: string;
  category?: string;
  bufferTimeMinutes: number;
  isActive: boolean;
}

const PRICING_MODELS = ["FIXED", "STARTING_FROM", "FREE", "REQUEST_QUOTE", "CUSTOM"];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyForm = {
    name: "",
    durationMinutes: 30,
    price: 800,
    description: "",
    pricingModel: "FIXED",
    category: "",
    bufferTimeMinutes: 0,
  };

  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState<Partial<Service>>({});

  async function loadServices() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/services");
      const data = await res.json();
      setServices(data.services || []);
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
    try {
      const res = await fetch("/api/v1/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowAdd(false);
        setForm(emptyForm);
        await loadServices();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create service");
      }
    } catch (err) {
      alert("Failed to create service");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(serviceId: string) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, ...editForm }),
      });
      if (res.ok) {
        setEditingId(null);
        setEditForm({});
        await loadServices();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update service");
      }
    } catch (err) {
      alert("Failed to update service");
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
    } catch (err) {
      alert("Failed to update service status");
    }
  }

  function startEdit(s: Service) {
    setEditingId(s.id);
    setEditForm({
      name: s.name,
      description: s.description || "",
      durationMinutes: s.durationMinutes,
      price: Number(s.price),
      pricingModel: s.pricingModel,
      category: s.category || "",
      bufferTimeMinutes: s.bufferTimeMinutes,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Services &amp; Pricing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure appointment types, duration, and fees bookable through your widgets.
          </p>
        </div>

        <button
          onClick={() => { setShowAdd(!showAdd); setForm(emptyForm); }}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Service
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Add New Service</h3>
            <button type="button" onClick={() => setShowAdd(false)}>
              <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Service Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tooth Scaling & Polish"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Duration (mins)
              </label>
              <input
                type="number"
                min={5}
                required
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Price (৳ BDT)
              </label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Pricing Model
              </label>
              <select
                value={form.pricingModel}
                onChange={(e) => setForm({ ...form, pricingModel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {PRICING_MODELS.map((m) => (
                  <option key={m} value={m}>{m.replace("_", " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Buffer Time (mins)
              </label>
              <input
                type="number"
                min={0}
                value={form.bufferTimeMinutes}
                onChange={(e) => setForm({ ...form, bufferTimeMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. Dental, Consultation"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Optional service description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
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
              Save Service
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-2">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No services added</h3>
          <p className="text-xs text-slate-400">
            Create your first service so customers can book appointments.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) =>
            editingId === s.id ? (
              /* Edit Mode Card */
              <div key={s.id} className="bg-white p-5 rounded-2xl border border-emerald-300 shadow-sm space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700 uppercase">Editing</span>
                  <button onClick={() => setEditingId(null)}>
                    <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
                  </button>
                </div>
                <input
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={editForm.name as string}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Service Name"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold uppercase">Duration</label>
                    <input
                      type="number" min={5}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      value={editForm.durationMinutes as number}
                      onChange={(e) => setEditForm({ ...editForm, durationMinutes: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold uppercase">Price ৳</label>
                    <input
                      type="number" min={0}
                      className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      value={editForm.price as number}
                      onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <select
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  value={editForm.pricingModel as string}
                  onChange={(e) => setEditForm({ ...editForm, pricingModel: e.target.value })}
                >
                  {PRICING_MODELS.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                </select>
                <button
                  onClick={() => handleUpdate(s.id)}
                  disabled={submitting}
                  className="w-full flex items-center justify-center py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                  Save Changes
                </button>
              </div>
            ) : (
              /* View Mode Card */
              <div
                key={s.id}
                className={`bg-white p-5 rounded-2xl border shadow-xs flex flex-col justify-between ${
                  s.isActive ? "border-slate-200/80" : "border-slate-100 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {s.pricingModel.replace("_", " ")}
                    </span>
                    <span className="font-extrabold text-base text-emerald-700">
                      {formatBDT(s.price)}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{s.name}</h3>
                  {s.category && (
                    <span className="text-[11px] text-slate-400">{s.category}</span>
                  )}
                  {s.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center font-medium">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {s.durationMinutes}m
                    {s.bufferTimeMinutes > 0 && (
                      <span className="ml-1 text-slate-400">+{s.bufferTimeMinutes}m buffer</span>
                    )}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => startEdit(s)}
                      className="p-1 rounded hover:bg-slate-100"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(s)}
                      className="p-1 rounded hover:bg-slate-100"
                      title={s.isActive ? "Deactivate" : "Activate"}
                    >
                      {s.isActive ? (
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <span className={`text-[10px] font-semibold ${s.isActive ? "text-emerald-600" : "text-slate-400"}`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
