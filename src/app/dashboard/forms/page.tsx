"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileCode,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Eye,
  CheckCircle,
  Plus,
  Loader2,
  Globe,
  Pencil,
  Trash2,
  X,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Settings,
  ArrowLeft,
} from "lucide-react";

// ─── Constants ─────────────────────────────────────────────────────────────────

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "dropdown", label: "Dropdown" },
  { value: "radio", label: "Radio" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "date_time", label: "Date & Time" },
  { value: "service_selector", label: "Service Selector" },
  { value: "staff_selector", label: "Staff Selector" },
  { value: "file", label: "File Upload" },
  { value: "hidden", label: "Hidden Field" },
  { value: "consent", label: "Consent Checkbox" },
];

const FORM_TYPES = [
  { value: "APPOINTMENT", label: "Appointment Booking" },
  { value: "SERVICE_REQUEST", label: "Service Request" },
  { value: "QUOTE_REQUEST", label: "Quote Request" },
  { value: "CONTACT", label: "Contact / Inquiry" },
  { value: "CUSTOM", label: "Custom Form" },
];

interface FormField {
  fieldId: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  helpText: string;
  order: number;
}

interface Form {
  id: string;
  name: string;
  slug: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  viewCount: number;
  submitCount: number;
  fields: FormField[];
  _count?: { submissions: number; bookings: number; leads: number };
}

// ─── Helper ─────────────────────────────────────────────────────────────────────

function newField(order: number): FormField {
  return {
    fieldId: `field_${Date.now()}`,
    type: "text",
    label: "",
    placeholder: "",
    required: false,
    helpText: "",
    order,
  };
}

// ─── Field Row (in builder) ─────────────────────────────────────────────────────

function FieldRow({
  field,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  field: FormField;
  index: number;
  total: number;
  onChange: (f: FormField) => void;
  onRemove: () => void;
  onMove: (dir: "up" | "down") => void;
}) {
  const inp =
    "px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 bg-white";

  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200/80 group hover:border-emerald-200 transition">
      {/* Drag handle / order */}
      <div className="flex flex-col items-center gap-1 pt-0.5">
        <GripVertical className="w-4 h-4 text-slate-300" />
        <button
          type="button"
          onClick={() => onMove("up")}
          disabled={index === 0}
          className="disabled:opacity-20 hover:text-emerald-600"
        >
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        </button>
        <button
          type="button"
          onClick={() => onMove("down")}
          disabled={index === total - 1}
          className="disabled:opacity-20 hover:text-emerald-600"
        >
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Field Type
          </label>
          <select
            value={field.type}
            onChange={(e) => onChange({ ...field, type: e.target.value })}
            className={inp + " w-full"}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Label *
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onChange({ ...field, label: e.target.value })}
            placeholder="e.g. Your Name"
            className={inp + " w-full"}
          />
        </div>
        <div className="lg:col-span-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Placeholder
          </label>
          <input
            type="text"
            value={field.placeholder}
            onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
            placeholder="Optional hint text"
            className={inp + " w-full"}
          />
        </div>
        <div className="lg:col-span-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            Help Text
          </label>
          <input
            type="text"
            value={field.helpText}
            onChange={(e) => onChange({ ...field, helpText: e.target.value })}
            placeholder="Optional guidance"
            className={inp + " w-full"}
          />
        </div>
      </div>

      {/* Required + remove */}
      <div className="flex flex-col items-center gap-3 pt-1 shrink-0">
        <button
          type="button"
          onClick={() => onChange({ ...field, required: !field.required })}
          title={field.required ? "Required" : "Optional"}
          className="flex flex-col items-center gap-0.5"
        >
          {field.required ? (
            <ToggleRight className="w-5 h-5 text-emerald-600" />
          ) : (
            <ToggleLeft className="w-5 h-5 text-slate-300" />
          )}
          <span className="text-[9px] font-bold text-slate-400 uppercase">
            {field.required ? "Req" : "Opt"}
          </span>
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-300 hover:text-red-500 transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Form Builder View ──────────────────────────────────────────────────────────

function FormBuilder({
  form,
  onSaved,
  onBack,
}: {
  form: Form | null; // null = creating new
  onSaved: (f: Form) => void;
  onBack: () => void;
}) {
  const isNew = form === null;
  const [name, setName] = useState(form?.name || "");
  const [title, setTitle] = useState(form?.title || "");
  const [description, setDescription] = useState(form?.description || "");
  const [type, setType] = useState(form?.type || "APPOINTMENT");
  const [fields, setFields] = useState<FormField[]>(
    form?.fields?.length
      ? form.fields.map((f) => ({ ...f, placeholder: f.placeholder || "", helpText: f.helpText || "" }))
      : [
          { fieldId: "service_id", type: "service_selector", label: "Select Service", placeholder: "", required: true, helpText: "", order: 1 },
          { fieldId: "booking_date_time", type: "date_time", label: "Appointment Date & Time", placeholder: "", required: true, helpText: "", order: 2 },
          { fieldId: "customer_name", type: "text", label: "Full Name", placeholder: "Enter full name", required: true, helpText: "", order: 3 },
          { fieldId: "customer_phone", type: "phone", label: "Mobile Number", placeholder: "017XXXXXXXX", required: true, helpText: "", order: 4 },
        ]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addField() {
    setFields((prev) => [...prev, newField(prev.length + 1)]);
  }

  function updateField(index: number, updated: FormField) {
    setFields((prev) => prev.map((f, i) => (i === index ? updated : f)));
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i + 1 })));
  }

  function moveField(index: number, dir: "up" | "down") {
    const next = [...fields];
    const swap = dir === "up" ? index - 1 : index + 1;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setFields(next.map((f, i) => ({ ...f, order: i + 1 })));
  }

  async function handleSave() {
    if (!name.trim() || !title.trim()) {
      setError("Form name and title are required.");
      return;
    }
    if (fields.some((f) => !f.label.trim())) {
      setError("All fields must have a label.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        fields: fields.map((f, i) => ({ ...f, order: i + 1 })),
      };

      let res;
      if (isNew) {
        res = await fetch("/api/v1/forms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/v1/forms", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ formId: form!.id, ...payload }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save form.");
        return;
      }
      onSaved(data.form);
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            {isNew ? "Create New Form" : `Edit: ${form?.name}`}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isNew ? "Build your booking form, then embed it on your website." : "Update form fields and settings."}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {saving ? "Saving…" : isNew ? "Create Form" : "Save Changes"}
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
          {error}
        </div>
      )}

      {/* Form Meta */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-800">Form Settings</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Internal Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dental Appointment Form"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Customer-Facing Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Book an Appointment"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Form Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {FORM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional subtitle shown to customers"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Field Builder */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            Form Fields
            <span className="ml-2 text-xs font-normal text-slate-400">({fields.length} fields)</span>
          </h2>
          <button
            type="button"
            onClick={addField}
            className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Field
          </button>
        </div>

        {fields.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-xl">
            No fields yet. Click "Add Field" to build your form.
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((f, i) => (
              <FieldRow
                key={f.fieldId + i}
                field={f}
                index={i}
                total={fields.length}
                onChange={(updated) => updateField(i, updated)}
                onRemove={() => removeField(i)}
                onMove={(dir) => moveField(i, dir)}
              />
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={addField}
            className="w-full py-3 border-2 border-dashed border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 rounded-xl text-xs font-semibold text-slate-400 hover:text-emerald-600 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Field
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [view, setView] = useState<"list" | "builder">("list");
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadForms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/forms");
      const data = await res.json();
      setForms(data.forms || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
    loadForms();
  }, [loadForms]);

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  async function toggleStatus(form: Form) {
    const newStatus = form.status === "PUBLISHED" ? "DISABLED" : "PUBLISHED";
    await fetch("/api/v1/forms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formId: form.id, status: newStatus }),
    });
    setForms((prev) => prev.map((f) => (f.id === form.id ? { ...f, status: newStatus } : f)));
  }

  async function deleteForm(formId: string) {
    if (!confirm("Disable this form? It will stop accepting new submissions.")) return;
    setDeletingId(formId);
    try {
      await fetch(`/api/v1/forms?formId=${formId}`, { method: "DELETE" });
      setForms((prev) => prev.filter((f) => f.id !== formId));
    } finally {
      setDeletingId(null);
    }
  }

  function handleFormSaved(savedForm: Form) {
    setForms((prev) => {
      const exists = prev.find((f) => f.id === savedForm.id);
      if (exists) return prev.map((f) => (f.id === savedForm.id ? savedForm : f));
      return [savedForm, ...prev];
    });
    setView("list");
    setEditingForm(null);
  }

  // ── Builder view ──────────────────────────────────────────────────────────────
  if (view === "builder") {
    return (
      <FormBuilder
        form={editingForm}
        onSaved={handleFormSaved}
        onBack={() => { setView("list"); setEditingForm(null); }}
      />
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Forms &amp; Distribution
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Build booking forms and embed them on your website, WordPress, or share direct links.
          </p>
        </div>
        <button
          onClick={() => { setEditingForm(null); setView("builder"); }}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create New Form
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center space-y-4">
          <FileCode className="w-12 h-12 text-slate-200 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">No forms yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Create your first booking form and embed it on your website.
            </p>
          </div>
          <button
            onClick={() => { setEditingForm(null); setView("builder"); }}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create First Form
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {forms.map((form) => {
            const jsEmbed = `<script src="${origin}/widget.js" data-form="${form.slug}"></script>`;
            const wpShortcode = `[clientflow_form id="${form.slug}"]`;
            const publicUrl = `${origin}/f/${form.slug}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(publicUrl)}`;
            const isDisabled = form.status === "DISABLED";

            return (
              <div
                key={form.id}
                className={`bg-white rounded-2xl border shadow-xs space-y-5 p-6 transition ${
                  isDisabled ? "border-slate-100 opacity-70" : "border-slate-200/80"
                }`}
              >
                {/* Form header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-slate-900">{form.name}</h2>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          form.status === "PUBLISHED"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {form.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600">
                        {form.type.replace("_", " ")}
                      </span>
                    </div>
                    {form.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{form.description}</p>
                    )}
                  </div>

                  {/* Actions + analytics */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="flex items-center text-slate-500">
                      <Eye className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      <strong>{form.viewCount || 0}</strong>&nbsp;views
                    </span>
                    <span className="flex items-center text-slate-500">
                      <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                      <strong>{form._count?.submissions || form.submitCount || 0}</strong>&nbsp;submissions
                    </span>

                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() => { setEditingForm(form); setView("builder"); }}
                        title="Edit form"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => toggleStatus(form)}
                        title={isDisabled ? "Enable form" : "Disable form"}
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                      >
                        {isDisabled ? (
                          <ToggleLeft className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteForm(form.id)}
                        disabled={deletingId === form.id}
                        title="Disable form"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                      >
                        {deletingId === form.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fields summary */}
                <div className="flex flex-wrap gap-1.5">
                  {form.fields.slice(0, 8).map((f) => (
                    <span
                      key={f.fieldId}
                      className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold"
                    >
                      {f.label || f.type}
                      {f.required && <span className="text-red-400 ml-0.5">*</span>}
                    </span>
                  ))}
                  {form.fields.length > 8 && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[10px]">
                      +{form.fields.length - 8} more
                    </span>
                  )}
                </div>

                {/* Installation codes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* JS embed */}
                  <div className="bg-slate-900 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        JavaScript Embed
                      </span>
                      <button
                        onClick={() => copyText(jsEmbed, `js-${form.id}`)}
                        className="text-xs inline-flex items-center gap-1 text-slate-400 hover:text-white"
                      >
                        {copiedKey === `js-${form.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copiedKey === `js-${form.id}` ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <code className="text-[11px] font-mono text-slate-300 block bg-slate-950 p-2.5 rounded-lg border border-slate-800 break-all select-all">
                      {jsEmbed}
                    </code>
                    <p className="text-[10px] text-slate-500">Paste in your website HTML, Shopify, Webflow, Wix.</p>
                  </div>

                  {/* WordPress shortcode */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">WordPress Shortcode</span>
                      <button
                        onClick={() => copyText(wpShortcode, `wp-${form.id}`)}
                        className="text-xs inline-flex items-center gap-1 text-slate-500 hover:text-slate-900"
                      >
                        {copiedKey === `wp-${form.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        {copiedKey === `wp-${form.id}` ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <code className="text-xs font-mono text-slate-900 font-bold block bg-white p-2.5 rounded-lg border border-slate-200 select-all">
                      {wpShortcode}
                    </code>
                    <p className="text-[10px] text-slate-400">Use in our WordPress plugin or Elementor widget.</p>
                  </div>
                </div>

                {/* Direct link + QR */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-500 truncate">
                      <strong className="text-slate-700">{publicUrl}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Open Live Form
                    </a>
                    <a
                      href={qrUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100"
                    >
                      <QrCode className="w-3.5 h-3.5 mr-1.5" />
                      QR Code
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
