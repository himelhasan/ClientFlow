"use client";

import { useEffect, useState } from "react";
import { Briefcase, Plus, Clock, Loader2, Check } from "lucide-react";
import { formatBDT } from "@/lib/utils/bangladesh";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    durationMinutes: 30,
    price: 800,
    description: "",
  });

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

  async function handleCreateService(e: React.FormEvent) {
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
        setForm({ name: "", durationMinutes: 30, price: 800, description: "" });
        await loadServices();
      }
    } catch (err) {
      alert("Failed to create service");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Services & Pricing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure appointment types, duration, and fees bookable through your widgets.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Service
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleCreateService}
          className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-4"
        >
          <h3 className="text-sm font-bold text-slate-900">Add New Service</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Service Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Tooth Scaling & Polish"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Duration (Mins)
              </label>
              <input
                type="number"
                required
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Price (BDT / ৳)
              </label>
              <input
                type="number"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>
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
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 flex items-center"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Save Service
            </button>
          </div>
        </form>
      )}

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
          {services.map((s) => (
            <div
              key={s.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {s.pricingModel}
                  </span>
                  <span className="font-extrabold text-base text-emerald-700">
                    {formatBDT(s.price)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">{s.name}</h3>
                {s.description && (
                  <p className="text-xs text-slate-500 mt-1">{s.description}</p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center font-medium">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {s.durationMinutes} Minutes
                </span>
                <span className="text-emerald-600 font-semibold flex items-center">
                  <Check className="w-3.5 h-3.5 mr-1" /> Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
