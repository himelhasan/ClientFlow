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
        <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
      </div>
    );
  }

  const inputCls =
    "w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
          Social, Messaging &amp; Payment Integrations
        </h1>
        <p className="text-xs text-[#73767D] mt-1">
          Connect Meta WhatsApp Cloud API, Facebook Lead Ads, Instagram DMs, Bangladesh SMS Gateways, and bKash.
        </p>
      </div>

      {/* Meta Webhook Endpoint Banner */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]">
            Meta Graph API Webhook Callback URL
          </span>
          <p className="text-xs font-mono font-bold text-[#181A1E] break-all pt-1">
            {metaCallbackUrl}
          </p>
          <p className="text-[11px] text-[#73767D]">
            Verify Token: <code className="text-[#181A1E] bg-[#F8F8FA] px-1.5 py-0.5 rounded border border-[#EAEAEA] font-mono">clientflow_meta_verify_2026</code>
          </p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(metaCallbackUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="inline-flex items-center px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs shrink-0 transition"
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
          className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#181A1E]">
              Connect {activeProvider.name}
            </h3>
            <button type="button" onClick={() => setActiveProvider(null)}>
              <X className="w-4 h-4 text-[#73767D] hover:text-[#181A1E]" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {activeProvider.fields.map((fieldLabel: string) => (
              <div key={fieldLabel}>
                <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
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
                  className={`${inputCls} font-mono`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setActiveProvider(null)}
              className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs"
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
              className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]">
                    {p.category}
                  </span>
                  {connected ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-[#73767D]">
                      Not connected
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-[#181A1E]">{p.name}</h3>
                <p className="text-xs text-[#73767D] leading-relaxed">
                  {p.description}
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveProvider(p);
                  setCredValues(connected?.credentials || {});
                }}
                className={`w-full py-2 text-xs transition ${
                  connected
                    ? "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl"
                    : "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl"
                }`}
              >
                {connected ? "Update Credentials" : "Connect Integration"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Live Social Lead & Message Webhook Simulator */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#181A1E] flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[#181A1E]" />
            Test Inbound Social Lead &amp; Inbox Simulator
          </h2>
          <p className="text-xs text-[#73767D] mt-0.5">
            Simulate an incoming Facebook Lead Ad, Instagram DM, or WhatsApp customer inquiry to test your pipeline &amp; Unified Inbox.
          </p>
        </div>

        <form
          onSubmit={handleSimulateWebhook}
          className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-[10px] font-bold text-[#73767D] uppercase mb-1">
              Channel
            </label>
            <select
              value={simForm.channel}
              onChange={(e) =>
                setSimForm({ ...simForm, channel: e.target.value })
              }
              className={inputCls}
            >
              <option value="FACEBOOK">Facebook Lead / Messenger</option>
              <option value="INSTAGRAM">Instagram Business DM</option>
              <option value="WHATSAPP">WhatsApp Cloud API</option>
              <option value="SMS">Inbound SMS</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#73767D] uppercase mb-1">
              Customer Name
            </label>
            <input
              required
              type="text"
              value={simForm.customerName}
              onChange={(e) =>
                setSimForm({ ...simForm, customerName: e.target.value })
              }
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#73767D] uppercase mb-1">
              BD Phone
            </label>
            <input
              required
              type="text"
              value={simForm.customerPhone}
              onChange={(e) =>
                setSimForm({ ...simForm, customerPhone: e.target.value })
              }
              className={`${inputCls} font-mono`}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={simulating}
              className="w-full py-2 px-4 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
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
              className={inputCls}
            />
          </div>
        </form>

        {simResult && (
          <div
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold ${
              simResult.startsWith("Error")
                ? "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]"
                : "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]"
            }`}
          >
            {simResult}
          </div>
        )}
      </div>

      {/* Outgoing Developer Webhooks */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#181A1E] flex items-center gap-2">
              <WebhookIcon className="w-4 h-4 text-[#73767D]" /> Outgoing
              Developer Webhooks ({webhooks.length})
            </h2>
            <p className="text-xs text-[#73767D] mt-0.5">
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
            className="flex-1 px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none font-mono"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold rounded-xl"
          >
            Add Endpoint
          </button>
        </form>

        {webhooks.length > 0 && (
          <div className="space-y-2">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-mono font-bold text-[#181A1E]">{wh.url}</p>
                  <p className="text-[11px] text-[#73767D] font-mono">
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
                  className="p-1.5 rounded-xl bg-[#F3F1E8] hover:bg-[#FAD4D6] text-[#73767D] hover:text-[#9E2A2B] transition"
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
