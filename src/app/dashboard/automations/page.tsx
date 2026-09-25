"use client";

import { useEffect, useState } from "react";
import {
  Zap,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
  MessageCircle,
  Phone,
  Mail,
  Loader2,
  X,
} from "lucide-react";

const TRIGGERS = [
  { value: "BOOKING_CONFIRMED", label: "When Booking is Confirmed" },
  { value: "24H_BEFORE_BOOKING", label: "24 Hours Before Appointment" },
  { value: "2H_BEFORE_BOOKING", label: "2 Hours Before Appointment" },
  { value: "LEAD_CREATED", label: "When New Lead is Captured" },
  { value: "BOOKING_COMPLETED", label: "After Appointment Completed (Review Request)" },
  { value: "BOOKING_CANCELLED", label: "When Booking is Cancelled" },
];

const ACTIONS = [
  { value: "SEND_WHATSAPP", label: "Send WhatsApp Message", icon: MessageCircle },
  { value: "SEND_SMS", label: "Send Bangladesh SMS", icon: Phone },
  { value: "SEND_EMAIL", label: "Send Email Notification", icon: Mail },
];

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    trigger: "BOOKING_CONFIRMED",
    actionType: "SEND_WHATSAPP",
    messageTemplate:
      "Hi {{customerName}}, your booking for {{serviceName}} on {{date}} at {{time}} is confirmed!",
  });

  async function loadAutomations() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/automations");
      const data = await res.json();
      setAutomations(data.automations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAutomations();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowAdd(false);
        setForm({
          name: "",
          trigger: "BOOKING_CONFIRMED",
          actionType: "SEND_WHATSAPP",
          messageTemplate:
            "Hi {{customerName}}, your booking for {{serviceName}} on {{date}} at {{time}} is confirmed!",
        });
        await loadAutomations();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleRule(rule: any) {
    const nextState = !rule.isActive;
    setAutomations((prev) =>
      prev.map((a) => (a.id === rule.id ? { ...a, isActive: nextState } : a))
    );
    await fetch("/api/v1/automations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ automationId: rule.id, isActive: nextState }),
    });
  }

  async function deleteRule(id: string) {
    if (!confirm("Delete this automation rule?")) return;
    setAutomations((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/v1/automations?automationId=${id}`, {
      method: "DELETE",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Workflow Automations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Trigger automatic WhatsApp confirmations, SMS appointment reminders, and lead follow-ups.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          New Automation Rule
        </button>
      </div>

      {/* Add Rule Form */}
      {showAdd && (
        <form
          onSubmit={handleCreate}
          className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Create Trigger → Action Rule
            </h3>
            <button type="button" onClick={() => setShowAdd(false)}>
              <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Rule Name *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. 2-Hour SMS Reminder"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                When Trigger Happens (IF)
              </label>
              <select
                value={form.trigger}
                onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              >
                {TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Execute Action (THEN)
              </label>
              <select
                value={form.actionType}
                onChange={(e) =>
                  setForm({ ...form, actionType: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              >
                {ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 uppercase">
                Message Template
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Variables: &#123;&#123;customerName&#125;&#125;, &#123;&#123;serviceName&#125;&#125;, &#123;&#123;date&#125;&#125;, &#123;&#123;time&#125;&#125;
              </span>
            </div>
            <textarea
              rows={3}
              required
              value={form.messageTemplate}
              onChange={(e) =>
                setForm({ ...form, messageTemplate: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 flex items-center"
            >
              {submitting && (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              )}
              Save Automation
            </button>
          </div>
        </form>
      )}

      {/* Automations List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : automations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-2">
          <Zap className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            No automations configured
          </h3>
        </div>
      ) : (
        <div className="space-y-4">
          {automations.map((rule) => {
            const firstAction = Array.isArray(rule.actions)
              ? rule.actions[0]
              : null;
            const triggerLabel =
              TRIGGERS.find((t) => t.value === rule.trigger)?.label ||
              rule.trigger;

            return (
              <div
                key={rule.id}
                className={`bg-white p-5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  rule.isActive
                    ? "border-slate-200/80 shadow-xs"
                    : "border-slate-100 opacity-60"
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        rule.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {rule.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rule.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {rule.isActive ? "ACTIVE" : "PAUSED"}
                    </span>
                  </div>

                  {/* Visual Trigger -> Action pill flow */}
                  <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold">
                      IF: {triggerLabel}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                      THEN: {firstAction?.type?.replace("_", " ") || "SEND MESSAGE"}
                    </span>
                  </div>

                  {firstAction?.template && (
                    <p className="text-xs text-slate-500 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      &ldquo;{firstAction.template}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <button
                    onClick={() => toggleRule(rule)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                    title={rule.isActive ? "Pause rule" : "Activate rule"}
                  >
                    {rule.isActive ? (
                      <ToggleRight className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                    title="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
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
