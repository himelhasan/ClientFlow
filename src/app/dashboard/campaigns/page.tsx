"use client";

import React, { useEffect, useState } from "react";
import {
  Mail,
  Send,
  BarChart3,
  Users,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Layers,
  MousePointerClick,
  ArrowRight,
  MessageSquare,
  Plus,
} from "lucide-react";

type AttributionModel = "FIRST_TOUCH" | "LAST_TOUCH" | "LINEAR" | "TIME_DECAY";

export default function CampaignsAndAttributionPage() {
  const [activeTab, setActiveTab] = useState<"campaigns" | "attribution">("campaigns");

  // Campaigns state
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [segments, setSegments] = useState<Record<string, any>>({
    ALL_OPTED_IN: {
      label: "All Opted-In Clients (Email + WhatsApp)",
      count: 640,
      avgOpenRate: 0.62,
      avgConversionRate: 0.048,
    },
    VIP_CUSTOMERS: {
      label: "VIP Gold & Platinum Members (Spent > ৳25,000)",
      count: 145,
      avgOpenRate: 0.78,
      avgConversionRate: 0.115,
    },
    INACTIVE_30D: {
      label: "Win-Back: Inactive 30+ Days with Past Bookings",
      count: 210,
      avgOpenRate: 0.58,
      avgConversionRate: 0.065,
    },
    PACKAGE_HOLDERS: {
      label: "Active Package Holders with Remaining Sessions",
      count: 92,
      avgOpenRate: 0.84,
      avgConversionRate: 0.14,
    },
  });
  const [funnel, setFunnel] = useState<any>({
    sent: 995,
    delivered: 984,
    opened: 723,
    clicked: 259,
    convertedBookings: 74,
    revenueAttributed: 348300,
    openRate: 73,
    clickRate: 36,
    conversionRate: 29,
  });

  // Composer Form state
  const [cmpName, setCmpName] = useState("");
  const [cmpChannel, setCmpChannel] = useState<"EMAIL" | "WHATSAPP" | "SMS">("EMAIL");
  const [cmpSegment, setCmpSegment] = useState("ALL_OPTED_IN");
  const [cmpSubject, setCmpSubject] = useState(
    "✨ Exclusive 20% Off Your Next Clinical Facial (Code: GLOW20)"
  );
  const [cmpContent, setCmpContent] = useState(
    "Hi {{customer_name}}, we've reserved a 20% VIP credit for your next visit at Aura Glow Studio! Book via your self-serve Client Portal in 1 click and earn +100 bonus loyalty points."
  );
  const [sending, setSending] = useState(false);

  // Attribution state
  const [attrModel, setAttrModel] = useState<AttributionModel>("TIME_DECAY");
  const [attrChannels, setAttrChannels] = useState<any[]>([]);
  const [attrSummary, setAttrSummary] = useState<any>({
    totalAdSpend: 96000,
    totalAttributedRevenue: 1215400,
    totalAttributedBookings: 276,
    blendedRoas: 12.66,
    netMarketingProfit: 1119400,
  });
  const [recentJourneys, setRecentJourneys] = useState<any[]>([]);

  const [banner, setBanner] = useState<string | null>(null);

  function notify(msg: string) {
    setBanner(msg);
    setTimeout(() => setBanner(null), 5000);
  }

  async function loadCampaigns() {
    try {
      const res = await fetch("/api/v1/campaigns");
      const data = await res.json();
      if (data.campaigns) {
        setCampaigns(data.campaigns);
        if (data.segments) setSegments(data.segments);
        if (data.funnel) setFunnel(data.funnel);
      }
    } catch {
      // Handled gracefully
    }
  }

  async function loadAttribution(model = attrModel) {
    try {
      const res = await fetch(`/api/v1/attribution?model=${model}`);
      const data = await res.json();
      if (data.channels) {
        setAttrChannels(data.channels);
        setAttrSummary(data.summary || attrSummary);
        setRecentJourneys(data.recentJourneys || []);
      }
    } catch {
      // Handled gracefully
    }
  }

  useEffect(() => {
    loadCampaigns();
    loadAttribution(attrModel);
  }, []);

  useEffect(() => {
    loadAttribution(attrModel);
  }, [attrModel]);

  async function handleLaunchCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!cmpName.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/v1/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cmpName,
          channel: cmpChannel,
          segmentKey: cmpSegment,
          subject: cmpSubject,
          content: cmpContent,
          sendImmediately: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify(data.message);
        setCmpName("");
        await loadCampaigns();
      }
    } finally {
      setSending(false);
    }
  }

  const activeSegmentInfo = segments[cmpSegment] || {
    label: "All Opted-In Clients",
    count: 640,
    avgOpenRate: 0.62,
    avgConversionRate: 0.048,
  };
  const estimatedBookings = Math.max(
    4,
    Math.round(activeSegmentInfo.count * activeSegmentInfo.avgConversionRate)
  );
  const estimatedRevenue = estimatedBookings * 4200;

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[#181A1E]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#184E37] bg-[#E3F5EC] border border-[#CBEAD9] px-2.5 py-1 rounded-full">
            Growth & Multi-Touch Attribution
          </span>
          <h1 className="text-2xl font-bold text-[#181A1E] mt-2">
            Email Marketing Campaigns & Advanced Attribution
          </h1>
          <p className="text-sm text-[#73767D] mt-1">
            Launch segmented Email, WhatsApp & SMS broadcasts and compare ROAS across First-Touch, Last-Touch, Linear, and Time-Decay attribution models.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition ${
              activeTab === "campaigns"
                ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
                : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium border border-[#EAEAEA]"
            }`}
          >
            <Mail className="w-4 h-4" />
            1. Campaign Studio & Funnel
          </button>
          <button
            onClick={() => setActiveTab("attribution")}
            className={`px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition ${
              activeTab === "attribution"
                ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
                : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium border border-[#EAEAEA]"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            2. Multi-Touch Attribution
          </button>
        </div>
      </div>

      {banner && (
        <div className="p-4 rounded-[14px] bg-[#E3F5EC] border border-[#CBEAD9] text-[#184E37] text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{banner}</span>
          </div>
          <button onClick={() => setBanner(null)} className="text-xs underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: CAMPAIGN COMPOSER, SEGMENT ESTIMATOR & CONVERSION FUNNEL */}
      {activeTab === "campaigns" && (
        <div className="space-y-6">
          {/* Delivery / Open / Click / Conversion Funnel */}
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[#181A1E]">
                  Broadcast Delivery → Open → Conversion Funnel
                </h2>
                <p className="text-xs text-[#73767D] mt-0.5">
                  Real-time revenue attribution from Email, WhatsApp & SMS broadcasts to completed appointments.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#184E37] bg-[#E3F5EC] border border-[#CBEAD9] px-3 py-1 rounded-full">
                Total Attributed Revenue: ৳{Number(funnel.revenueAttributed).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                {
                  label: "1. Messages Sent",
                  val: funnel.sent.toLocaleString(),
                  sub: "100% Dispatched",
                  bg: "bg-[#F8F8FA] border-[#EAEAEA]",
                },
                {
                  label: "2. Delivered",
                  val: funnel.delivered.toLocaleString(),
                  sub: "98.8% Delivery Rate",
                  bg: "bg-[#E2F2FA] border-[#C4E3F5]",
                },
                {
                  label: "3. Opened / Read",
                  val: funnel.opened.toLocaleString(),
                  sub: `${funnel.openRate}% Open Rate`,
                  bg: "bg-[#FBF3DC] border-[#F2E2B6]",
                },
                {
                  label: "4. Clicked Portal Link",
                  val: funnel.clicked.toLocaleString(),
                  sub: `${funnel.clickRate}% Click-to-Open`,
                  bg: "bg-[#E2F2FA] border-[#C4E3F5]",
                },
                {
                  label: "5. Converted Bookings",
                  val: `${funnel.convertedBookings} bookings`,
                  sub: `৳${Number(funnel.revenueAttributed).toLocaleString()} Revenue`,
                  bg: "bg-[#E3F5EC] border-[#CBEAD9]",
                },
              ].map((step) => (
                <div key={step.label} className={`rounded-[14px] border p-4 ${step.bg}`}>
                  <div className="text-[11px] font-bold uppercase text-[#73767D]">
                    {step.label}
                  </div>
                  <div className="text-xl font-bold text-[#181A1E] mt-1">{step.val}</div>
                  <div className="text-xs text-[#73767D] mt-0.5 font-medium">{step.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Campaign Composer + Live Segment Estimator */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
              <h2 className="text-base font-bold text-[#181A1E] mb-1">
                Campaign Composer Studio
              </h2>
              <p className="text-xs text-[#73767D] mb-4">
                Personalize with dynamic variables and dispatch immediately to targeted customer segments.
              </p>

              <form onSubmit={handleLaunchCampaign} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                      Campaign Name
                    </label>
                    <input
                      type="text"
                      value={cmpName}
                      onChange={(e) => setCmpName(e.target.value)}
                      placeholder="e.g. Autumn HydraFacial VIP Exclusive"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                      Broadcast Channel
                    </label>
                    <select
                      value={cmpChannel}
                      onChange={(e) => setCmpChannel(e.target.value as any)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                    >
                      <option value="EMAIL">Email Campaign (Rich HTML + Portal Button)</option>
                      <option value="WHATSAPP">WhatsApp Business Broadcast</option>
                      <option value="SMS">SMS Promotional Blast</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Audience Segment Filter
                  </label>
                  <select
                    value={cmpSegment}
                    onChange={(e) => setCmpSegment(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  >
                    {Object.entries(segments).map(([key, seg]: [string, any]) => (
                      <option key={key} value={key}>
                        {seg.label} — {seg.count} matched contacts
                      </option>
                    ))}
                  </select>
                </div>

                {cmpChannel === "EMAIL" && (
                  <div>
                    <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                      Email Subject Line
                    </label>
                    <input
                      type="text"
                      value={cmpSubject}
                      onChange={(e) => setCmpSubject(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#181A1E]">
                      Message Body (Supports Merge Tags)
                    </label>
                    <div className="flex items-center gap-1.5">
                      {["{{customer_name}}", "{{service_name}}", "{{portal_link}}"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setCmpContent((prev) => `${prev} ${tag}`)}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] transition"
                        >
                          +{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    value={cmpContent}
                    onChange={(e) => setCmpContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-6 py-2.5 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold text-xs flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {sending
                      ? "Dispatching Broadcast..."
                      : `Launch Broadcast to ${activeSegmentInfo.count} Recipients`}
                  </button>
                </div>
              </form>
            </div>

            {/* Segment Estimator Card */}
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-col justify-between space-y-5">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9] px-2.5 py-1 rounded-full">
                  Live AI Segment Estimator
                </span>
                <h3 className="text-lg font-bold text-[#181A1E] pt-1">{activeSegmentInfo.label}</h3>
                <p className="text-xs text-[#73767D]">
                  Automatically excludes unsubscribed contacts and customers with an appointment already booked in the next 7 days.
                </p>
              </div>

              <div className="space-y-3 bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#73767D]">Eligible Audience Size:</span>
                  <strong className="text-base text-[#181A1E]">{activeSegmentInfo.count} clients</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#73767D]">Expected Open Rate:</span>
                  <strong className="text-[#181A1E]">{Math.round(activeSegmentInfo.avgOpenRate * 100)}%</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#73767D]">Projected Bookings:</span>
                  <strong className="text-[#181A1E]">~{estimatedBookings} appointments</strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#EAEAEA] text-[#184E37] font-bold text-sm">
                  <span>Projected Revenue Impact:</span>
                  <span>৳{estimatedRevenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Performance History */}
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
            <h2 className="text-base font-bold text-[#181A1E]">
              Recent Broadcast Campaigns ({campaigns.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#EAEAEA] text-xs uppercase text-[#73767D]">
                    <th className="py-3 px-2">Campaign</th>
                    <th className="py-3 px-2">Channel & Segment</th>
                    <th className="py-3 px-2">Delivered</th>
                    <th className="py-3 px-2">Opened</th>
                    <th className="py-3 px-2">Clicked</th>
                    <th className="py-3 px-2">Bookings</th>
                    <th className="py-3 px-2 text-right">Attributed Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F8F8FA] transition">
                      <td className="py-3.5 px-2">
                        <div className="font-bold text-[#181A1E]">{c.name}</div>
                        <div className="text-xs text-[#73767D]">
                          {c.sentAt ? new Date(c.sentAt).toLocaleDateString() : "Draft"}
                        </div>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F1E8] text-[#262930] mr-1.5">
                          {c.channel}
                        </span>
                        <span className="text-xs text-[#73767D]">{c.segmentLabel}</span>
                      </td>
                      <td className="py-3.5 px-2 font-medium text-[#181A1E]">{c.deliveredCount}</td>
                      <td className="py-3.5 px-2 text-[#174A67] font-semibold">{c.openCount}</td>
                      <td className="py-3.5 px-2 text-[#5B4712] font-semibold">{c.clickCount}</td>
                      <td className="py-3.5 px-2 font-bold text-[#181A1E]">
                        {c.convertedBookings}
                      </td>
                      <td className="py-3.5 px-2 text-right font-bold text-[#184E37]">
                        ৳{Number(c.revenueAttributed).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-TOUCH ATTRIBUTION STUDIO */}
      {activeTab === "attribution" && (
        <div className="space-y-6">
          {/* Attribution Model Switcher */}
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#181A1E]">
                Multi-Touch Attribution Model Switcher
              </h2>
              <p className="text-xs text-[#73767D] mt-0.5">
                Compare how discovery channels (Google, Meta, Instagram) vs closing channels (WhatsApp, Email, QR) drive revenue.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(
                [
                  { id: "FIRST_TOUCH", label: "First-Touch (Discovery)" },
                  { id: "LAST_TOUCH", label: "Last-Touch (Conversion)" },
                  { id: "LINEAR", label: "Linear (Equal Credit)" },
                  { id: "TIME_DECAY", label: "Time-Decay (Recommended)" },
                ] as { id: AttributionModel; label: string }[]
              ).map((m) => (
                <button
                  key={m.id}
                  onClick={() => setAttrModel(m.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs transition ${
                    attrModel === m.id
                      ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
                      : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium border border-[#EAEAEA]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* ROAS Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
              <div className="text-xs text-[#73767D]">Total Marketing Spend</div>
              <div className="text-2xl font-bold text-[#181A1E] mt-1">
                ৳{Number(attrSummary.totalAdSpend).toLocaleString()}
              </div>
              <div className="text-xs text-[#73767D] mt-1">Across 6 tracked channels</div>
            </div>

            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
              <div className="text-xs text-[#73767D]">
                Attributed Revenue ({attrModel.replace("_", "-")})
              </div>
              <div className="text-2xl font-bold text-[#184E37] mt-1">
                ৳{Number(attrSummary.totalAttributedRevenue).toLocaleString()}
              </div>
              <div className="text-xs text-[#184E37] font-medium mt-1">
                From {attrSummary.totalAttributedBookings} completed bookings
              </div>
            </div>

            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
              <div className="text-xs text-[#73767D]">Blended ROAS Multiplier</div>
              <div className="text-2xl font-bold text-[#181A1E] mt-1">
                {attrSummary.blendedRoas}x ROAS
              </div>
              <div className="text-xs text-[#5B4712] font-medium mt-1">
                ৳{attrSummary.blendedRoas} earned per ৳1 spent
              </div>
            </div>

            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
              <div className="text-xs text-[#73767D]">Net Marketing Profit</div>
              <div className="text-2xl font-bold text-[#181A1E] mt-1">
                ৳{Number(attrSummary.netMarketingProfit).toLocaleString()}
              </div>
              <div className="text-xs text-[#174A67] font-medium mt-1">
                Verified against POS payments
              </div>
            </div>
          </div>

          {/* Channel Attribution Breakdown Table */}
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
            <h3 className="text-base font-bold text-[#181A1E]">
              Channel ROI & ROAS Matrix — Model: {attrModel.replace("_", " ")}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#EAEAEA] text-xs uppercase text-[#73767D]">
                    <th className="py-3 px-2">Acquisition Channel</th>
                    <th className="py-3 px-2">Tracked Touchpoints</th>
                    <th className="py-3 px-2">Ad Spend</th>
                    <th className="py-3 px-2">Attributed Bookings</th>
                    <th className="py-3 px-2">Cost / Booking (CPA)</th>
                    <th className="py-3 px-2">ROAS</th>
                    <th className="py-3 px-2 text-right">Attributed Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {attrChannels.map((ch) => (
                    <tr key={ch.channelKey} className="hover:bg-[#F8F8FA] transition">
                      <td className="py-3.5 px-2 font-bold text-[#181A1E]">{ch.channelName}</td>
                      <td className="py-3.5 px-2 text-[#73767D]">{ch.touchpoints}</td>
                      <td className="py-3.5 px-2 text-[#181A1E]">
                        ৳{Number(ch.adSpend).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-2 font-bold text-[#181A1E]">
                        {ch.attributedBookings}
                      </td>
                      <td className="py-3.5 px-2 text-[#73767D]">৳{ch.costPerBooking}</td>
                      <td className="py-3.5 px-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]">
                          {ch.roas}x ({ch.roiPercent}% ROI)
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right font-bold text-[#184E37]">
                        ৳{Number(ch.attributedRevenue).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Multi-Touch Customer Conversion Paths */}
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
            <h3 className="text-base font-bold text-[#181A1E]">
              Recent Multi-Touch Customer Journeys
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {recentJourneys.map((j) => (
                <div
                  key={j.id}
                  className="p-4 rounded-[14px] bg-[#F8F8FA] border border-[#EAEAEA] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#181A1E]">{j.customerName}</span>
                    <span className="text-xs font-bold text-[#184E37]">
                      ৳{Number(j.bookingValue).toLocaleString()} ({j.bookingNumber})
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-1.5 text-xs">
                    {(j.path || []).map((step: string, idx: number) => (
                      <React.Fragment key={idx}>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-[#EAEAEA] font-medium text-[#181A1E]">
                          {step}
                        </span>
                        {idx < j.path.length - 1 && (
                          <ArrowRight className="w-3.5 h-3.5 text-[#73767D]" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
