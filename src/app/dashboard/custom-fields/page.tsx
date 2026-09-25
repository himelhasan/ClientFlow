"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sliders,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Loader2,
  X,
  Users,
  Calendar,
  Briefcase,
  UserCheck,
  Target,
} from "lucide-react";

interface CustomFieldDefinition {
  id: string;
  entityType: "CUSTOMER" | "LEAD" | "BOOKING" | "SERVICE" | "STAFF";
  key: string;
  label: string;
  fieldType:
    | "TEXT"
    | "NUMBER"
    | "DATE"
    | "BOOLEAN"
    | "SELECT"
    | "MULTI_SELECT";
  options: string[] | null;
  required: boolean;
  defaultValue: string | null;
  isActive: boolean;
  createdAt: string;
}

const ENTITY_TABS = [
  { key: "ALL", label: "All Entities", icon: Sliders },
  { key: "CUSTOMER", label: "Customers", icon: Users },
  { key: "LEAD", label: "Leads", icon: Target },
  { key: "BOOKING", label: "Bookings", icon: Calendar },
  { key: "SERVICE", label: "Services", icon: Briefcase },
  { key: "STAFF", label: "Staff", icon: UserCheck },
] as const;

const FIELD_TYPES = [
  "TEXT",
  "NUMBER",
  "DATE",
  "BOOLEAN",
  "SELECT",
  "MULTI_SELECT",
] as const;

const ENTITY_BADGE: Record<string, string> = {
  CUSTOMER: "bg-[#E3F5EC] text-[#184E37] border-[#CBEAD9]",
  LEAD: "bg-[#FBF3DC] text-[#5B4712] border-[#F2E2B6]",
  BOOKING: "bg-[#E2F2FA] text-[#174A67] border-[#C4E3F5]",
  SERVICE: "bg-[#F3F1E8] text-[#262930] border-[#EAEAEA]",
  STAFF: "bg-[#FAD4D6] text-[#9E2A2B] border-[#F5BFC2]",
};

export default function CustomFieldsPage() {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityTab, setEntityTab] = useState<string>("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingDef, setEditingDef] = useState<CustomFieldDefinition | null>(
    null
  );
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    entityType: "CUSTOMER",
    label: "",
    key: "",
    fieldType: "TEXT",
    optionsText: "Standard, Silver, Gold, Platinum",
    required: false,
    defaultValue: "",
    isActive: true,
  });

  const loadDefinitions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/custom-fields");
      const data = await res.json();
      setDefinitions(data.definitions || []);
    } catch (err) {
      console.error("Failed to load custom fields", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDefinitions();
  }, [loadDefinitions]);

  function openNewModal() {
    setEditingDef(null);
    setForm({
      entityType: entityTab === "ALL" ? "CUSTOMER" : entityTab,
      label: "",
      key: "",
      fieldType: "TEXT",
      optionsText: "Option A, Option B, Option C",
      required: false,
      defaultValue: "",
      isActive: true,
    });
    setShowModal(true);
  }

  function openEditModal(def: CustomFieldDefinition) {
    setEditingDef(def);
    setForm({
      entityType: def.entityType,
      label: def.label,
      key: def.key,
      fieldType: def.fieldType,
      optionsText: Array.isArray(def.options) ? def.options.join(", ") : "",
      required: def.required,
      defaultValue: def.defaultValue || "",
      isActive: def.isActive,
    });
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label.trim()) return;
    setSaving(true);

    const optionsArray =
      form.fieldType === "SELECT" || form.fieldType === "MULTI_SELECT"
        ? form.optionsText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : null;

    try {
      if (editingDef) {
        const res = await fetch("/api/v1/custom-fields", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingDef.id,
            label: form.label,
            fieldType: form.fieldType,
            options: optionsArray,
            required: form.required,
            defaultValue: form.defaultValue,
            isActive: form.isActive,
          }),
        });
        if (res.ok) {
          setDefinitions((prev) =>
            prev.map((d) =>
              d.id === editingDef.id
                ? {
                    ...d,
                    label: form.label,
                    fieldType: form.fieldType as any,
                    options: optionsArray,
                    required: form.required,
                    defaultValue: form.defaultValue,
                    isActive: form.isActive,
                  }
                : d
            )
          );
          setShowModal(false);
        }
      } else {
        const res = await fetch("/api/v1/custom-fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entityType: form.entityType,
            label: form.label,
            key:
              form.key.trim() ||
              form.label
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_|_$/g, ""),
            fieldType: form.fieldType,
            options: optionsArray,
            required: form.required,
            defaultValue: form.defaultValue,
          }),
        });
        const data = await res.json();
        if (res.ok && data.definition) {
          setDefinitions((prev) => [data.definition, ...prev]);
          setShowModal(false);
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(def: CustomFieldDefinition) {
    const nextActive = !def.isActive;
    setDefinitions((prev) =>
      prev.map((d) => (d.id === def.id ? { ...d, isActive: nextActive } : d))
    );
    await fetch("/api/v1/custom-fields", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: def.id, isActive: nextActive }),
    });
  }

  async function handleDelete(id: string) {
    setDefinitions((prev) => prev.filter((d) => d.id !== id));
    await fetch(`/api/v1/custom-fields?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  const filtered = definitions.filter((d) =>
    entityTab === "ALL" ? true : d.entityType === entityTab
  );

  return (
    <div className="space-y-6 bg-[#F8F8F6] text-[#181A1E]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#F5C94A] text-[#181A1E] flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
              Custom Fields Primitive
            </h1>
            <p className="text-xs text-[#73767D]">
              Extend Customers, Leads, Bookings, Services & Staff with custom
              schema attributes
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openNewModal}
          className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Custom Field
        </button>
      </div>

      {/* Entity Type Filter Tabs */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-wrap items-center gap-2">
        {ENTITY_TABS.map((t) => {
          const Icon = t.icon;
          const active = entityTab === t.key;
          const count =
            t.key === "ALL"
              ? definitions.length
              : definitions.filter((d) => d.entityType === t.key).length;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setEntityTab(t.key)}
              className={`px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition ${
                active
                  ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
                  : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white border border-[#EAEAEA] text-[#181A1E]">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Fields Table / Cards */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#181A1E]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Sliders className="w-10 h-10 text-[#73767D] mx-auto" />
            <p className="text-sm font-bold text-[#181A1E]">
              No custom fields configured for this entity
            </p>
            <button
              type="button"
              onClick={openNewModal}
              className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] rounded-xl text-xs font-semibold transition"
            >
              + Add Custom Field
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F8FA] border-b border-[#EAEAEA] text-[#73767D] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Field Label & API Key</th>
                  <th className="py-3.5 px-4">Data Type</th>
                  <th className="py-3.5 px-4">Options / Default</th>
                  <th className="py-3.5 px-4">Required</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {filtered.map((def) => (
                  <tr key={def.id} className="hover:bg-[#F8F8FA] transition">
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                          ENTITY_BADGE[def.entityType] || ENTITY_BADGE.CUSTOMER
                        }`}
                      >
                        {def.entityType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#181A1E]">{def.label}</p>
                      <p className="font-mono text-[10px] text-[#73767D]">
                        {def.key}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-xl bg-[#F3F1E8] text-[#262930] font-mono text-[10px] font-semibold border border-[#EAEAEA]">
                        {def.fieldType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#73767D]">
                      {Array.isArray(def.options) && def.options.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {def.options.map((opt) => (
                            <span
                              key={opt}
                              className="px-1.5 py-0.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded text-[10px] text-[#181A1E]"
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      ) : def.defaultValue ? (
                        <span>Default: {def.defaultValue}</span>
                      ) : (
                        <span className="italic">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {def.required ? (
                        <span className="text-[#9E2A2B] font-semibold">
                          Required
                        </span>
                      ) : (
                        <span className="text-[#73767D]">Optional</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(def)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                          def.isActive
                            ? "bg-[#E3F5EC] text-[#184E37] border-[#CBEAD9]"
                            : "bg-[#F8F8FA] text-[#73767D] border-[#EAEAEA]"
                        }`}
                      >
                        {def.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(def)}
                          className="p-1.5 rounded-xl bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#181A1E] transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(def.id)}
                          className="p-1.5 rounded-xl bg-[#F8F8FA] hover:bg-[#FAD4D6] text-[#73767D] hover:text-[#9E2A2B] transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Create / Edit Custom Field Modal ────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] max-w-lg w-full p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#181A1E]">
                  {editingDef
                    ? `Edit Custom Field: ${editingDef.label}`
                    : "Create New Custom Field"}
                </h2>
                <p className="text-xs text-[#73767D]">
                  Define typed custom attributes exposed in forms, API, and CRM
                  360
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-[#73767D] hover:text-[#181A1E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Target Entity *
                  </label>
                  <select
                    disabled={Boolean(editingDef)}
                    value={form.entityType}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, entityType: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs font-semibold text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="LEAD">LEAD</option>
                    <option value="BOOKING">BOOKING</option>
                    <option value="SERVICE">SERVICE</option>
                    <option value="STAFF">STAFF</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Field Data Type *
                  </label>
                  <select
                    value={form.fieldType}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, fieldType: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs font-semibold text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft} value={ft}>
                        {ft}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Display Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.label}
                    onChange={(e) => {
                      const lbl = e.target.value;
                      setForm((p) => ({
                        ...p,
                        label: lbl,
                        key: editingDef
                          ? p.key
                          : lbl
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "_")
                              .replace(/^_|_$/g, ""),
                      }));
                    }}
                    placeholder="e.g. Membership Tier"
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    API Key (`snake_case`)
                  </label>
                  <input
                    type="text"
                    disabled={Boolean(editingDef)}
                    value={form.key}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, key: e.target.value }))
                    }
                    placeholder="membership_tier"
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs font-mono text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>
              </div>

              {(form.fieldType === "SELECT" ||
                form.fieldType === "MULTI_SELECT") && (
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Dropdown Options (comma-separated) *
                  </label>
                  <input
                    type="text"
                    value={form.optionsText}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, optionsText: e.target.value }))
                    }
                    placeholder="Standard, Silver, Gold, Platinum"
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Default Value
                  </label>
                  <input
                    type="text"
                    value={form.defaultValue}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, defaultValue: e.target.value }))
                    }
                    placeholder="Optional default…"
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-[#181A1E] pt-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.required}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, required: e.target.checked }))
                    }
                    className="rounded text-[#181A1E]"
                  />
                  <span>Required field on forms</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] rounded-xl text-xs font-medium text-[#262930] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingDef ? "Update Field" : "Create Field"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
