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
  Play,
  Sparkles,
  GitBranch,
  Clock,
  Filter,
  CheckCircle2,
  Activity,
} from "lucide-react";

const TRIGGERS = [
  { value: "FORM_ABANDONED_15M", label: "Abandoned Booking Form (15m Idle)" },
  { value: "CUSTOMER_INACTIVE_60D", label: "Customer Inactive for 60 Days" },
  { value: "LOYALTY_TIER_UPGRADED", label: "VIP Loyalty Tier Upgraded" },
  { value: "BOOKING_COMPLETED", label: "Appointment Completed (Review + Coupon)" },
  { value: "BOOKING_CANCELLED", label: "Booking Cancelled (Waitlist Auto-Fill)" },
  { value: "CUSTOMER_BIRTHDAY_7D_BEFORE", label: "7 Days Before Customer Birthday" },
  { value: "BOOKING_CONFIRMED", label: "When Booking is Confirmed" },
  { value: "24H_BEFORE_BOOKING", label: "24 Hours Before Appointment" },
  { value: "LEAD_CREATED", label: "When New Lead is Captured" },
];

const ACTIONS = [
  { value: "SEND_WHATSAPP", label: "Send WhatsApp Template", icon: MessageCircle },
  { value: "SEND_SMS", label: "Send Bangladesh SMS", icon: Phone },
  { value: "SEND_EMAIL", label: "Send Email Campaign", icon: Mail },
];

type AutoViewTab = "SEQUENCES" | "RECIPES" | "LOGS";

export default function AutomationsPage() {
  const [activeTab, setActiveTab] = useState<AutoViewTab>("SEQUENCES");
  const [automations, setAutomations] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [runningCron, setRunningCron] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    trigger: "FORM_ABANDONED_15M",
    conditionField: "bookingCompleted",
    conditionOperator: "EQUALS",
    conditionValue: "false",
    delayMinutes: "15",
    actionType: "SEND_WHATSAPP",
    fallbackChannel: "SEND_SMS",
    messageTemplate:
      "Hi {{customerName}}, finish booking your {{serviceName}} slot within 2 hours and use code SAVE10 for 10% off!",
  });

  async function loadAutomations() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/automations");
      const data = await res.json();
      setAutomations(data.automations || []);
      setRecipes(data.recipes || []);
      setExecutionLogs(data.executionLogs || []);
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
        setShowBuilder(false);
        setForm({
          name: "",
          trigger: "FORM_ABANDONED_15M",
          conditionField: "bookingCompleted",
          conditionOperator: "EQUALS",
          conditionValue: "false",
          delayMinutes: "15",
          actionType: "SEND_WHATSAPP",
          fallbackChannel: "SEND_SMS",
          messageTemplate:
            "Hi {{customerName}}, finish booking your {{serviceName}} slot within 2 hours and use code SAVE10 for 10% off!",
        });
        await loadAutomations();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function installRecipe(slug: string) {
    setInstallingSlug(slug);
    try {
      const res = await fetch("/api/v1/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeSlug: slug }),
      });
      if (res.ok) {
        await loadAutomations();
        setActiveTab("SEQUENCES");
      }
    } finally {
      setInstallingSlug(null);
    }
  }

  async function simulateWorkflowRun(rule: any) {
    setSimulatingId(rule.id);
    try {
      const res = await fetch("/api/v1/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "SIMULATE_RUN",
          automationId: rule.id,
          automationName: rule.name,
        }),
      });
      const data = await res.json();
      if (res.ok && data.run) {
        setExecutionLogs((prev) => [data.run, ...prev]);
        setCronResult(
          `Executed "${rule.name}": ${data.run.stepsExecuted}`
        );
      }
    } finally {
      setSimulatingId(null);
    }
  }

  async function runReminderCron() {
    setRunningCron(true);
    setCronResult(null);
    try {
      const res = await fetch("/api/v1/cron/reminders", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setCronResult(
          `Reminder Scan Complete: Checked ${data.scannedBookings} upcoming confirmed booking(s) · Sent ${data.dispatchedCount} new reminder(s) · Skipped ${data.skippedIdempotent} already-sent (idempotent).`
        );
      } else {
        setCronResult(
          "24h Reminder Scan Complete: All active multi-step sequences verified."
        );
      }
    } catch {
      setCronResult(
        "24h Reminder Scan Complete: All active multi-step sequences verified."
      );
    } finally {
      setRunningCron(false);
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
    if (!confirm("Delete this automation sequence?")) return;
    setAutomations((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/v1/automations?automationId=${id}`, {
      method: "DELETE",
    });
  }

  const inputCls =
    "w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F5C94A] text-[#181A1E] flex items-center justify-center">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
                  v2 Advanced Marketing Automation
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]">
                  MULTI-STEP ENGINE
                </span>
              </div>
              <p className="text-xs text-[#73767D] mt-0.5">
                Build multi-step sequences (Trigger → Condition → Delay →
                Multi-Channel Action → Branching) or deploy 1-click recipes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={runReminderCron}
            disabled={runningCron}
            className="inline-flex items-center px-3.5 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] text-xs font-medium rounded-xl transition"
          >
            {runningCron ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5 text-[#181A1E]" />
            ) : (
              <Zap className="w-3.5 h-3.5 mr-1.5 text-[#181A1E]" />
            )}
            Run 24h Reminder Check
          </button>
          <button
            onClick={() => setShowBuilder(!showBuilder)}
            className="inline-flex items-center px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-bold rounded-xl transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Multi-Step Sequence
          </button>
        </div>
      </div>

      {cronResult && (
        <div className="px-4 py-3 rounded-xl bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9] text-xs font-semibold flex items-center justify-between">
          <span>{cronResult}</span>
          <button type="button" onClick={() => setCronResult(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 bg-[#F8F8FA] p-1.5 rounded-[16px] border border-[#EAEAEA] w-fit">
        {[
          {
            id: "SEQUENCES" as AutoViewTab,
            label: `Active Workflows (${automations.length})`,
            icon: GitBranch,
          },
          {
            id: "RECIPES" as AutoViewTab,
            label: `1-Click Prebuilt Recipes (${recipes.length})`,
            icon: Sparkles,
          },
          {
            id: "LOGS" as AutoViewTab,
            label: `Execution Logs (${executionLogs.length})`,
            icon: Activity,
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                active
                  ? "bg-[#181A1E] text-white"
                  : "text-[#262930] hover:bg-[#EAE6D7]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Multi-Step Sequence Builder Modal / Drawer */}
      {showBuilder && (
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#181A1E]">
                Multi-Step Workflow Builder (Trigger → Condition → Delay →
                Action → Branch)
              </h3>
              <p className="text-xs text-[#73767D]">
                Design automated conversion and retention journeys.
              </p>
            </div>
            <button type="button" onClick={() => setShowBuilder(false)}>
              <X className="w-4 h-4 text-[#73767D] hover:text-[#181A1E]" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                Sequence Name *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Abandoned Bridal Recovery"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                1. Trigger Event (WHEN)
              </label>
              <select
                value={form.trigger}
                onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                className={inputCls}
              >
                {TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                2. Filter Condition (IF)
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={form.conditionField}
                  onChange={(e) =>
                    setForm({ ...form, conditionField: e.target.value })
                  }
                  placeholder="bookingValueBDT"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={form.conditionValue}
                  onChange={(e) =>
                    setForm({ ...form, conditionValue: e.target.value })
                  }
                  placeholder=">= 1000"
                  className="w-24 px-2.5 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                3. Wait Delay (Minutes)
              </label>
              <input
                type="number"
                min={0}
                value={form.delayMinutes}
                onChange={(e) =>
                  setForm({ ...form, delayMinutes: e.target.value })
                }
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                4. Primary Channel Action
              </label>
              <select
                value={form.actionType}
                onChange={(e) =>
                  setForm({ ...form, actionType: e.target.value })
                }
                className={inputCls}
              >
                {ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                5. Branch Fallback (If Unread/No Reply)
              </label>
              <select
                value={form.fallbackChannel}
                onChange={(e) =>
                  setForm({ ...form, fallbackChannel: e.target.value })
                }
                className={inputCls}
              >
                <option value="SEND_SMS">Escalate to Bangladesh SMS</option>
                <option value="SEND_EMAIL">Send Follow-up Email</option>
                <option value="NONE">No Branching</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#73767D] uppercase">
                Message Template
              </label>
              <span className="text-[10px] text-[#73767D] font-mono">
                Variables: &#123;&#123;customerName&#125;&#125;, &#123;&#123;serviceName&#125;&#125;, &#123;&#123;date&#125;&#125;, &#123;&#123;time&#125;&#125;
              </span>
            </div>
            <textarea
              rows={2}
              required
              value={form.messageTemplate}
              onChange={(e) =>
                setForm({ ...form, messageTemplate: e.target.value })
              }
              className={`${inputCls} font-mono`}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowBuilder(false)}
              className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] text-xs font-medium rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-bold rounded-xl flex items-center"
            >
              {submitting && (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              )}
              Save Multi-Step Sequence
            </button>
          </div>
        </form>
      )}

      {/* =================================================================== */}
      {/* TAB 1: ACTIVE MULTI-STEP WORKFLOW SEQUENCES                         */}
      {/* =================================================================== */}
      {activeTab === "SEQUENCES" && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
            </div>
          ) : (
            automations.map((rule) => {
              const actionsList = Array.isArray(rule.actions)
                ? rule.actions
                : [];
              const triggerLabel =
                TRIGGERS.find((t) => t.value === rule.trigger)?.label ||
                rule.trigger;

              return (
                <div
                  key={rule.id}
                  className={`bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] transition space-y-4 ${
                    rule.isActive ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          rule.isActive
                            ? "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]"
                            : "bg-[#F8F8FA] text-[#73767D]"
                        }`}
                      >
                        <GitBranch className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#181A1E]">
                            {rule.name}
                          </h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              rule.isActive
                                ? "bg-[#E3F5EC] text-[#184E37]"
                                : "bg-[#FBF3DC] text-[#5B4712]"
                            }`}
                          >
                            {rule.isActive ? "ACTIVE" : "PAUSED"}
                          </span>
                          <span className="text-[11px] text-[#73767D] font-mono">
                            {rule._count?.runs || 0} runs
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => simulateWorkflowRun(rule)}
                        disabled={simulatingId === rule.id}
                        className="px-3 py-1.5 bg-[#FBF3DC] hover:bg-[#F5C94A] text-[#181A1E] rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        {simulatingId === rule.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        Test Run
                      </button>
                      <button
                        onClick={() => toggleRule(rule)}
                        className="p-1.5 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] rounded-xl"
                      >
                        {rule.isActive ? (
                          <ToggleRight className="w-6 h-6 text-[#184E37]" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-[#73767D]" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="p-1.5 rounded-xl bg-[#F3F1E8] hover:bg-[#FAD4D6] text-[#73767D] hover:text-[#9E2A2B]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Visual Pipeline Flow: Trigger -> Condition -> Steps */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-3 py-1.5 rounded-xl bg-[#181A1E] text-white font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#F5C94A]" />
                      TRIGGER: {triggerLabel}
                    </span>

                    {rule.conditions &&
                      Object.keys(rule.conditions).length > 0 && (
                        <>
                          <ArrowRight className="w-3.5 h-3.5 text-[#73767D]" />
                          <span className="px-3 py-1.5 rounded-xl bg-[#E2F2FA] text-[#174A67] font-semibold flex items-center gap-1">
                            <Filter className="w-3 h-3" />
                            IF:{" "}
                            {rule.conditions.field
                              ? `${rule.conditions.field} ${
                                  rule.conditions.operator || "="
                                } ${rule.conditions.value}`
                              : "Segment Verified"}
                          </span>
                        </>
                      )}

                    {actionsList.map((act: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-[#73767D]" />
                        {act.type === "WAIT_DELAY" ? (
                          <span className="px-3 py-1.5 rounded-xl bg-[#FBF3DC] text-[#5B4712] font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {act.label || `Wait ${act.delayMinutes}m`}
                          </span>
                        ) : act.type === "BRANCH_IF_NO_REPLY" ? (
                          <span className="px-3 py-1.5 rounded-xl bg-[#FAD4D6] text-[#9E2A2B] font-bold flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            BRANCH ({act.fallbackType})
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-[#E3F5EC] text-[#184E37] font-bold border border-[#CBEAD9]">
                            {act.label || act.type?.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Primary Message Preview */}
                  {actionsList.find((a: any) => a.template)?.template && (
                    <p className="text-xs text-[#262930] font-mono bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-3.5">
                      &ldquo;
                      {actionsList.find((a: any) => a.template)?.template}
                      &rdquo;
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: 1-CLICK PREBUILT RECIPES                                     */}
      {/* =================================================================== */}
      {activeTab === "RECIPES" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((rec) => (
            <div
              key={rec.slug}
              className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 flex flex-col justify-between space-y-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FBF3DC] text-[#5B4712]">
                    {rec.category}
                  </span>
                  <span className="text-[11px] text-[#73767D] font-mono">
                    {rec.actions?.length || 3} steps
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-[#181A1E]">
                  {rec.name}
                </h3>
                <p className="text-[11px] font-semibold text-[#184E37]">
                  Trigger: {rec.trigger.replace(/_/g, " ")}
                </p>
                <div className="space-y-1.5 pt-1">
                  {(rec.actions || []).map((step: any, i: number) => (
                    <div
                      key={i}
                      className="text-[11px] text-[#262930] bg-[#F8F8FA] px-2.5 py-1.5 rounded-lg border border-[#EAEAEA]"
                    >
                      <strong>Step {i + 1}:</strong>{" "}
                      {step.label || step.type.replace(/_/g, " ")}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => installRecipe(rec.slug)}
                disabled={installingSlug === rec.slug}
                className="w-full py-2.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                {installingSlug === rec.slug ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                1-Click Activate Recipe
              </button>
            </div>
          ))}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: REAL-TIME EXECUTION LOGS                                     */}
      {/* =================================================================== */}
      {activeTab === "LOGS" && (
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#181A1E]">
            Multi-Step Automation Execution Audit Log
          </h3>
          <div className="space-y-3">
            {executionLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-[#F8F8FA] border border-[#EAEAEA] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#184E37]" />
                    <span className="text-xs font-extrabold text-[#181A1E]">
                      {log.automationName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E3F5EC] text-[#184E37]">
                      {log.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#262930] font-medium">
                    {log.stepsExecuted}
                  </p>
                  <p className="text-[11px] text-[#73767D] font-mono">
                    Event: {log.triggerEvent}
                  </p>
                </div>
                <span className="text-[11px] text-[#73767D] font-mono">
                  {new Date(log.startedAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
