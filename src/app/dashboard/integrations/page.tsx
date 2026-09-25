"use client";

import { useEffect, useState } from "react";
import {
  Plug,
  MessageCircle,
  Globe,
  Phone,
  CreditCard,
  Webhook as WebhookIcon,
  CheckCircle2,
  Plus,
  Trash2,
  Send,
  Loader2,
  Copy,
  Check,
  X,
} from "lucide-react";

const PROVIDERS = [
  {
    id: "WHATSAPP_META",
    name: "WhatsApp Business Cloud API",
    category: "Messaging",
    description: "Send automated booking confirmations, 24h reminders, and two-way inbox replies.",
    fields: ["Phone Number ID", "Permanent Access Token", "Business Account ID"],
  },
  {
    id: "FACEBOOK_PAGE",
    name: "Facebook Page & Lead Ads",
    category: "Social Lead Capture",
    description: "Auto-capture Facebook Lead Ads and Messenger inquiries into your CRM pipeline.",
    fields: ["Facebook Page ID", "Page Access Token"],
  },
  {
    id: "INSTAGRAM_BUSINESS",
    name: "Instagram Business DMs",
    category: "Social Lead Capture",
    description: "Sync Instagram Direct Messages and story replies into the Unified Inbox.",
    fields: ["Instagram Account ID", "Connected Page Token"],
  },
  {
    id: "BD_SMS_GATEWAY",
    name: "Bangladesh SMS Gateway (BulkSMSBD / SSL Wireless)",
    category: "Messaging",
    description: "High-deliverability masking & non-masking SMS across Grameenphone, Robi, Banglalink.",
    fields: ["API Key", "Sender ID / Masking Name"],
  },
  {
    id: "BKASH_MERCHANT",
    name: "bKash Tokenized Checkout",
    category: "Payments (BDT)",
    description: "Collect advance booking deposits and quote payments via bKash.",
    fields: ["App Key", "App Secret", "Merchant Username"],
  },
];

export default function IntegrationsPage() {
  const [tenantId, setTenantId] = useState("");
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  // Modal state for configuring a provider
  const [activeProvider, setActiveProvider] = useState<any | null>(null);
  const [credValues, setCredValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Outgoing webhook form
  const [webhookUrl, setWebhookUrl] = useState("");

  // Simulator state
  const [simForm, setSimForm] = useState({
    channel: "FACEBOOK",
    customerName: "Nusrat Jahan",
    customerPhone: "01712345678",
    messageContent:
      "আসসালামু আলাইকুম, আমি আগামীকাল দাঁতের স্কেলিং এর জন্য অ্যাপয়েন্টমেন্ট নিতে চাই।",
  });
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/integrations");
      const data = await res.json();
      setTenantId(data.tenantId || "");
      setIntegrations(data.integrations || []);
      setWebhooks(data.webhooks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setOrigin(window.location.origin);
    loadData();
  }, []);

  async function handleSaveProvider(e: React.FormEvent) {
    e.preventDefault();
    if (!activeProvider) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: activeProvider.id,
          credentials: credValues,
          status: "ACTIVE",
        }),
      });
      if (res.ok) {
        setActiveProvider(null);
        setCredValues({});
        await loadData();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAddWebhook(e: React.FormEvent) {
    e.preventDefault();
    if (!webhookUrl) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v1/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity: "WEBHOOK", url: webhookUrl }),
      });
      if (res.ok) {
        setWebhookUrl("");
        await loadData();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSimulateWebhook(e: React.FormEvent) {
    e.preventDefault();
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await fetch("/api/v1/webhooks/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          ...simForm,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSimResult(
          `Captured! Created Lead #${data.leadId.slice(-6)} and added inbound thread to Unified Inbox.`
        );
      } else {
        setSimResult(`Error: ${data.error}`);
      }
    } finally {
      setSimulating(false);
    }
  }

  const metaCallbackUrl = `${origin}/api/v1/webhooks/meta`;

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
          Social, Messaging &amp; Payment Integrations
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Connect Meta WhatsApp Cloud API, Facebook Lead Ads, Instagram DMs, Bangladesh SMS Gateways, and bKash.
        </p>
      </div>

      {/* Meta Webhook Endpoint Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Meta Graph API Webhook Callback URL
          </span>
          <p className="text-xs font-mono text-slate-200 break-all">
            {metaCallbackUrl}
          </p>
          <p className="text-[11px] text-slate-400">
            Verify Token: <code className="text-emerald-300">clientflow_meta_verify_2026</code>
          </p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(metaCallbackUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="inline-flex items-center px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1.5" /> Copied URL
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Webhook URL
            </>
          )}
        </button>
      </div>

      {/* Configure Provider Modal */}
      {activeProvider && (
        <form
          onSubmit={handleSaveProvider}
          className="bg-white p-6 rounded-2xl border border-emerald-300 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Connect {activeProvider.name}
            </h3>
            <button type="button" onClick={() => setActiveProvider(null)}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {activeProvider.fields.map((fieldLabel: string) => (
              <div key={fieldLabel}>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {fieldLabel} *
                </label>
                <input
                  required
                  type="text"
                  placeholder={`Enter ${fieldLabel}`}
                  value={credValues[fieldLabel] || ""}
                  onChange={(e) =>
                    setCredValues({
                      ...credValues,
                      [fieldLabel]: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setActiveProvider(null)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
            >
              Save &amp; Activate
            </button>
          </div>
        </form>
      )}

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROVIDERS.map((p) => {
          const connected = integrations.find(
            (i) => i.provider === p.id && i.status === "ACTIVE"
          );
          return (
            <div
              key={p.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {p.category}
                  </span>
                  {connected ? (
                    <span className="inline-flex items-center text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Connected
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400">
                      Not connected
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveProvider(p);
                  setCredValues(connected?.credentials || {});
                }}
                className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                  connected
                    ? "border border-slate-200 text-slate-700 hover:bg-slate-50"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {connected ? "Update Credentials" : "Connect Integration"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Live Social Lead & Message Webhook Simulator */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            Test Inbound Social Lead &amp; Inbox Simulator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Simulate an incoming Facebook Lead Ad, Instagram DM, or WhatsApp customer inquiry to test your pipeline &amp; Unified Inbox.
          </p>
        </div>

        <form
          onSubmit={handleSimulateWebhook}
          className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Channel
            </label>
            <select
              value={simForm.channel}
              onChange={(e) =>
                setSimForm({ ...simForm, channel: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            >
              <option value="FACEBOOK">Facebook Lead / Messenger</option>
              <option value="INSTAGRAM">Instagram Business DM</option>
              <option value="WHATSAPP">WhatsApp Cloud API</option>
              <option value="SMS">Inbound SMS</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              Customer Name
            </label>
            <input
              required
              type="text"
              value={simForm.customerName}
              onChange={(e) =>
                setSimForm({ ...simForm, customerName: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
              BD Phone
            </label>
            <input
              required
              type="text"
              value={simForm.customerPhone}
              onChange={(e) =>
                setSimForm({ ...simForm, customerPhone: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={simulating}
              className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
            >
              {simulating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Simulate Inbound Lead
            </button>
          </div>
          <div className="sm:col-span-4">
            <input
              required
              type="text"
              value={simForm.messageContent}
              onChange={(e) =>
                setSimForm({ ...simForm, messageContent: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </form>

        {simResult && (
          <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            {simResult}
          </div>
        )}
      </div>

      {/* Outgoing Developer Webhooks */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <WebhookIcon className="w-4 h-4 text-slate-500" /> Outgoing
              Developer Webhooks ({webhooks.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Receive real-time JSON POST payloads on Zapier, Make, n8n, or your custom ERP when bookings or leads occur.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddWebhook} className="flex gap-2">
          <input
            required
            type="url"
            placeholder="https://hooks.zapier.com/hooks/catch/..."
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
          >
            Add Endpoint
          </button>
        </form>

        {webhooks.length > 0 && (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="p-3.5 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-mono font-bold text-slate-800">{wh.url}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Secret: {wh.secret}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await fetch(`/api/v1/integrations?webhookId=${wh.id}`, {
                      method: "DELETE",
                    });
                    setWebhooks((prev) => prev.filter((w) => w.id !== wh.id));
                  }}
                  className="text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
