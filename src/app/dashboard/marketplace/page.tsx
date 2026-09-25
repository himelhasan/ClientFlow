"use client";

import { useEffect, useState } from "react";
import {
  Blocks,
  KeyRound,
  Webhook,
  CheckCircle2,
  Plus,
  Copy,
  Check,
  Trash2,
  Send,
  Loader2,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";

type HubTab = "APPS" | "API_KEYS" | "WEBHOOKS";

const APP_CATEGORIES = [
  "ALL",
  "CALENDAR",
  "PAYMENTS",
  "CRM",
  "MARKETING",
  "ACCOUNTING",
  "AI",
] as const;

const AVAILABLE_SCOPES = [
  { id: "bookings:read", label: "bookings:read — Read schedules & slots" },
  { id: "bookings:write", label: "bookings:write — Create & reschedule bookings" },
  { id: "customers:write", label: "customers:write — Create & update CRM profiles" },
  { id: "webhooks:manage", label: "webhooks:manage — Subscribe to real-time events" },
];

export default function MarketplaceAndDeveloperHubPage() {
  const [activeTab, setActiveTab] = useState<HubTab>("APPS");
  const [apps, setApps] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [configuringApp, setConfiguringApp] = useState<any | null>(null);

  // API Key Creation
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState("Mobile App & Custom Booking Frontend");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    "bookings:read",
    "bookings:write",
    "customers:write",
  ]);
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(
    null
  );
  const [creatingKey, setCreatingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Webhook Tester
  const [webhookUrl, setWebhookUrl] = useState(
    "https://hooks.zapier.com/hooks/catch/clientflow/booking-created"
  );
  const [webhookEvent, setWebhookEvent] = useState("booking.created");
  const [pingResult, setPingResult] = useState<any>(null);
  const [pinging, setPinging] = useState(false);

  async function loadMarketplace() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/marketplace");
      const data = await res.json();
      setApps(data.apps || []);
      setApiKeys(data.apiKeys || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMarketplace();
  }, []);

  async function toggleInstallApp(app: any) {
    const nextState = !app.isInstalled;
    setTogglingSlug(app.appSlug);
    try {
      const res = await fetch("/api/v1/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appSlug: app.appSlug,
          isInstalled: nextState,
        }),
      });
      if (res.ok) {
        setApps((prev) =>
          prev.map((a) =>
            a.appSlug === app.appSlug ? { ...a, isInstalled: nextState } : a
          )
        );
      }
    } finally {
      setTogglingSlug(null);
    }
  }

  async function handleGenerateKey(e: React.FormEvent) {
    e.preventDefault();
    setCreatingKey(true);
    try {
      const res = await fetch("/api/v1/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_API_KEY",
          name: keyName,
          scopes: selectedScopes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.apiKey) {
        setNewlyCreatedSecret(data.apiKey.fullSecretKey);
        setApiKeys((prev) => [data.apiKey, ...prev]);
        setShowKeyModal(false);
      }
    } finally {
      setCreatingKey(false);
    }
  }

  async function handleRevokeKey(id: string) {
    if (!confirm("Revoke this API key immediately?")) return;
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
    await fetch(`/api/v1/marketplace?keyId=${id}`, { method: "DELETE" });
  }

  async function handlePingWebhook(e: React.FormEvent) {
    e.preventDefault();
    setPinging(true);
    try {
      const res = await fetch("/api/v1/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PING_WEBHOOK",
          url: webhookUrl,
          eventType: webhookEvent,
        }),
      });
      const data = await res.json();
      if (data.pingResult) setPingResult(data.pingResult);
    } finally {
      setPinging(false);
    }
  }

  const filteredApps = apps.filter((a) =>
    categoryFilter === "ALL" ? true : a.category === categoryFilter
  );

  return (
    <div className="space-y-6 bg-[#F8F8F6] text-[#181A1E]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F5C94A] text-[#181A1E] flex items-center justify-center">
              <Blocks className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
                v2 API Marketplace &amp; Developer Hub
              </h1>
              <p className="text-xs text-[#73767D] mt-0.5">
                1-click native integrations (Google Calendar, bKash, SSLCommerz,
                Stripe, Zapier, HubSpot), `cf_live_` API keys, and Webhook
                debugger.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveTab("API_KEYS");
            setShowKeyModal(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold rounded-xl transition"
        >
          <KeyRound className="w-4 h-4 mr-1.5" />
          Generate `cf_live_` API Key
        </button>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 bg-[#F8F8FA] p-1.5 rounded-[14px] border border-[#EAEAEA] w-fit">
        {[
          {
            id: "APPS" as HubTab,
            label: `App Directory (${apps.length})`,
            icon: Blocks,
          },
          {
            id: "API_KEYS" as HubTab,
            label: `API Key Manager (${apiKeys.length})`,
            icon: KeyRound,
          },
          {
            id: "WEBHOOKS" as HubTab,
            label: "Interactive Webhook Tester",
            icon: Webhook,
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition ${
                active
                  ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
                  : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* TAB 1: APP DIRECTORY                                                */}
      {/* =================================================================== */}
      {activeTab === "APPS" && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {APP_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition ${
                  categoryFilter === cat
                    ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
                    : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium border border-[#EAEAEA]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApps.map((app) => (
                <div
                  key={app.appSlug}
                  className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 flex flex-col justify-between space-y-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F3F1E8] text-[#262930] border border-[#EAEAEA]">
                        {app.category}
                      </span>
                      {app.isInstalled ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]">
                          <CheckCircle2 className="w-3 h-3" /> CONNECTED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F8F8FA] text-[#73767D] border border-[#EAEAEA]">
                          AVAILABLE
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-extrabold text-[#181A1E]">
                      {app.name}
                    </h3>
                    <p className="text-xs text-[#73767D] leading-relaxed">
                      {app.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => toggleInstallApp(app)}
                      disabled={togglingSlug === app.appSlug}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${
                        app.isInstalled
                          ? "bg-[#F3F1E8] hover:bg-[#FAD4D6] text-[#262930] hover:text-[#9E2A2B]"
                          : "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E]"
                      }`}
                    >
                      {togglingSlug === app.appSlug
                        ? "Updating..."
                        : app.isInstalled
                        ? "Disconnect"
                        : "1-Click Install"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfiguringApp(app)}
                      className="p-2 rounded-xl bg-[#F8F8FA] hover:bg-[#EAE6D7] border border-[#EAEAEA] text-[#181A1E] transition"
                      title="Configure Integration"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: API KEY MANAGER                                              */}
      {/* =================================================================== */}
      {activeTab === "API_KEYS" && (
        <div className="space-y-4">
          {newlyCreatedSecret && (
            <div className="p-4 rounded-[14px] bg-[#E3F5EC] border border-[#CBEAD9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-extrabold text-[#184E37] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  New Production API Key Generated — Copy Secret Now!
                </p>
                <p className="font-mono text-xs font-bold text-[#181A1E] bg-white px-3 py-1.5 rounded-xl border border-[#CBEAD9]">
                  {newlyCreatedSecret}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(newlyCreatedSecret);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="px-3.5 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start transition"
              >
                {copiedKey ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#184E37]" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Secret Key
                  </>
                )}
              </button>
            </div>
          )}

          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#181A1E]">
                  Scoped REST API Keys (`Bearer cf_live_...`)
                </h3>
                <p className="text-xs text-[#73767D]">
                  Authenticate external websites, mobile apps, and custom CRM
                  middlewares.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(true)}
                className="px-3.5 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Create API Key
              </button>
            </div>

            <div className="space-y-3">
              {apiKeys.map((k) => (
                <div
                  key={k.id}
                  className="p-4 rounded-[14px] bg-[#F8F8FA] border border-[#EAEAEA] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-[#181A1E]">
                        {k.name}
                      </span>
                      <span className="font-mono text-[11px] bg-white text-[#181A1E] px-2.5 py-0.5 rounded-lg border border-[#EAEAEA]">
                        {k.maskedKey}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(k.scopes || []).map((sc: string) => (
                        <span
                          key={sc}
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]"
                        >
                          {sc}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRevokeKey(k.id)}
                    className="p-2 rounded-xl bg-white hover:bg-[#FAD4D6] text-[#73767D] hover:text-[#9E2A2B] border border-[#EAEAEA] self-end sm:self-center transition"
                    title="Revoke API Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: INTERACTIVE WEBHOOK TESTER                                   */}
      {/* =================================================================== */}
      {activeTab === "WEBHOOKS" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handlePingWebhook}
            className="lg:col-span-5 bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-[#181A1E]">
                Interactive Webhook Ping Dispatcher
              </h3>
              <p className="text-xs text-[#73767D]">
                Fire a signed HMAC-SHA256 test event payload to verify your
                listener endpoint.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                Destination Webhook URL
              </label>
              <input
                type="url"
                required
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs font-mono text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                Event Trigger Payload
              </label>
              <select
                value={webhookEvent}
                onChange={(e) => setWebhookEvent(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs font-semibold text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
              >
                <option value="booking.created">booking.created</option>
                <option value="booking.confirmed">booking.confirmed</option>
                <option value="lead.hot_qualified">
                  lead.hot_qualified (AI Score 94/100)
                </option>
                <option value="loyalty.tier_upgraded">
                  loyalty.tier_upgraded
                </option>
                <option value="gift_card.issued">gift_card.issued</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={pinging}
              className="w-full py-2.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              {pinging ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send Signed Test Webhook Ping
            </button>
          </form>

          <div className="lg:col-span-7 bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
            <h3 className="text-sm font-bold text-[#181A1E]">
              Live Webhook Delivery Inspector
            </h3>
            {pingResult ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9] text-xs font-bold">
                  <span>✓ {pingResult.statusText}</span>
                  <span className="font-mono">{pingResult.latencyMs}ms</span>
                </div>
                <pre className="p-4 rounded-[14px] bg-[#181A1E] text-[#F8F8FA] text-[11px] font-mono overflow-x-auto leading-relaxed border border-[#262930]">
                  {JSON.stringify(pingResult.payloadSent, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#73767D]">
                Click &ldquo;Send Signed Test Webhook Ping&rdquo; to inspect the
                live payload and HTTP response.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Generate API Key */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleGenerateKey}
            className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 max-w-md w-full space-y-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#181A1E]">
                Create Granular `cf_live_` API Key
              </h3>
              <button type="button" onClick={() => setShowKeyModal(false)}>
                <X className="w-4 h-4 text-[#73767D]" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                Key Label / Application Name
              </label>
              <input
                type="text"
                required
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#73767D] uppercase">
                Granular Permission Scopes
              </label>
              {AVAILABLE_SCOPES.map((sc) => {
                const checked = selectedScopes.includes(sc.id);
                return (
                  <label
                    key={sc.id}
                    className="flex items-center gap-2 p-2.5 rounded-[14px] bg-[#F8F8FA] border border-[#EAEAEA] text-xs cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedScopes((prev) =>
                          checked
                            ? prev.filter((x) => x !== sc.id)
                            : [...prev, sc.id]
                        );
                      }}
                    />
                    <span className="font-mono text-[11px] font-semibold text-[#181A1E]">
                      {sc.label}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] rounded-xl text-xs font-medium text-[#262930] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingKey}
                className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] rounded-xl text-xs font-semibold transition"
              >
                Generate Secret Key
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: App Configuration */}
      {configuringApp && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 max-w-md w-full space-y-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#181A1E]">
                Configure {configuringApp.name}
              </h3>
              <button type="button" onClick={() => setConfiguringApp(null)}>
                <X className="w-4 h-4 text-[#73767D]" />
              </button>
            </div>
            <pre className="p-3.5 rounded-[14px] bg-[#F8F8FA] border border-[#EAEAEA] text-xs font-mono text-[#181A1E]">
              {JSON.stringify(configuringApp.config || {}, null, 2)}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfiguringApp(null)}
                className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] rounded-xl text-xs font-semibold transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
