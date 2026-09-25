"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  CheckCircle2,
  Loader2,
  Languages,
  Cpu,
  Target,
  MessageSquareReply,
  CalendarPlus,
  Copy,
  Check,
  Flame,
  Zap,
  Snowflake,
  Users,
  Clock,
  ShieldCheck,
} from "lucide-react";

type AIModeTab =
  | "RECEPTIONIST"
  | "QUALIFY_LEAD"
  | "SUGGEST_REPLIES"
  | "AI_BOOKING";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  intent?: string;
  detectedLanguage?: string;
  confidence?: number;
  policyNote?: string;
  suggestedSlots?: string[];
}

const SAMPLE_PROMPTS = [
  "আসসালামু আলাইকুম, আপনাদের সেবাসমূহের দাম কত টাকা?",
  "Vaiya kal bikale ki appointment serial pawa jabe? Deposit policy ki?",
  "How much do you charge and what is your bKash advance policy?",
  "আপনাদের ঠিকানা কোথায় এবং শুক্রবার কখন খোলা থাকে?",
  "Can I reschedule my slot without losing my advance deposit?",
];

const SAMPLE_CUSTOMER_MESSAGES = [
  {
    name: "Nusrat Jahan",
    channel: "WHATSAPP",
    text: "আসসালামু আলাইকুম আপু, আগামীকাল বিকালে কি ব্রাইডাল ফেসিয়াল ও হেয়ার স্পা স্লট ফাঁকা আছে? খরচ কত পড়বে?",
  },
  {
    name: "Tanvir Ahmed",
    channel: "INSTAGRAM",
    text: "Hey! Do you have any appointment slots open tomorrow around 4pm? Also can I pay the booking advance via bKash?",
  },
  {
    name: "Farhana Karim",
    channel: "FACEBOOK",
    text: "I had to cancel last week's session due to traffic. Can I book again for this Friday afternoon?",
  },
];

const SAMPLE_BOOKING_PROMPTS = [
  "Book Sarah Rahman for a Hair Spa tomorrow at 4pm with 2 people",
  "Schedule Tanvir (01711223344) for Dental Scaling tomorrow at 11:30am",
  "Reserve Bridal Makeover Package for Nusrat tomorrow at 6pm with 3 people",
  "Book HydraFacial Glow Session for Rashed tomorrow at 5pm",
];

export default function AICommandCenterPage() {
  const [activeTab, setActiveTab] = useState<AIModeTab>("RECEPTIONIST");
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [businessContext, setBusinessContext] = useState<any>(null);
  const [tenantLeads, setTenantLeads] = useState<any[]>([]);

  // ── Tab 1: AI Receptionist State ──
  const [input, setInput] = useState("");
  const [loadingReceptionist, setLoadingReceptionist] = useState(false);
  const [history, setHistory] = useState<ChatTurn[]>([
    {
      role: "assistant",
      content:
        "আসসালামু আলাইকুম! Welcome to the ClientFlow v2 Bilingual AI Receptionist (English + বাংলা + Banglish). Ask about service prices, working hours, 20% bKash deposit policy, or clinic location.",
      intent: "SYSTEM_READY",
      detectedLanguage: "Bilingual (BN/EN)",
      confidence: 1.0,
      policyNote: "20% bKash/Nagad deposit secures prime slots.",
      suggestedSlots: ["Tomorrow 11:30 AM", "Tomorrow 4:00 PM"],
    },
  ]);

  // ── Tab 2: AI Lead Qualification State ──
  const [qualForm, setQualForm] = useState({
    leadId: "",
    customerName: "Nadia Islam",
    source: "WHATSAPP",
    title: "Full Bridal Makeover & Hair Spa Package",
    notes:
      "Urgent booking needed for tomorrow afternoon for 2 people. Asked for bKash merchant number to send advance deposit right away.",
  });
  const [qualResult, setQualResult] = useState<any>({
    aiScore: 92,
    aiQualification: "HOT",
    aiSummary:
      "High-intent WHATSAPP enquiry for Full Bridal Makeover & Hair Spa Package. Strong urgency & budget readiness (92/100). Ready for immediate slot confirmation.",
    bant: { budget: 24, authority: 23, need: 24, timeline: 21 },
    recommendedAction:
      "Send instant WhatsApp booking link + hold priority slot for 2 hours",
  });
  const [loadingQual, setLoadingQual] = useState(false);
  const [loadingBulkQual, setLoadingBulkQual] = useState(false);

  // ── Tab 3: AI Suggested Replies State ──
  const [replyForm, setReplyForm] = useState({
    customerName: SAMPLE_CUSTOMER_MESSAGES[0].name,
    channel: SAMPLE_CUSTOMER_MESSAGES[0].channel,
    customerMessage: SAMPLE_CUSTOMER_MESSAGES[0].text,
  });
  const [replySuggestions, setReplySuggestions] = useState<any[]>([]);
  const [detectedSentiment, setDetectedSentiment] =
    useState("HIGH BUYING INTENT");
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showBanglaScript, setShowBanglaScript] = useState(false);

  // ── Tab 4: AI Conversational Booking State ──
  const [bookingPrompt, setBookingPrompt] = useState(SAMPLE_BOOKING_PROMPTS[0]);
  const [parsedBooking, setParsedBooking] = useState<any>(null);
  const [createdBookingRecord, setCreatedBookingRecord] = useState<any>(null);
  const [confirmationText, setConfirmationText] = useState("");
  const [loadingBooking, setLoadingBooking] = useState(false);

  useEffect(() => {
    async function fetchContext() {
      try {
        const res = await fetch("/api/v1/ai/suite");
        const data = await res.json();
        if (data.business) setBusinessContext(data.business);
        if (data.leads) setTenantLeads(data.leads);
      } catch (e) {
        console.error(e);
      }
    }
    fetchContext();
    generateReplies(
      SAMPLE_CUSTOMER_MESSAGES[0].text,
      SAMPLE_CUSTOMER_MESSAGES[0].name,
      SAMPLE_CUSTOMER_MESSAGES[0].channel
    );
    runBookingParser(SAMPLE_BOOKING_PROMPTS[0], false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ──
  async function sendReceptionistPrompt(textToSend: string) {
    if (!textToSend.trim()) return;
    const userMsg = textToSend.trim();
    setInput("");
    setHistory((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoadingReceptionist(true);

    try {
      const res = await fetch("/api/v1/ai/suite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "RECEPTIONIST", message: userMsg }),
      });
      const data = await res.json();
      setHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Sorry, I could not process that request.",
          intent: data.intent,
          detectedLanguage: data.detectedLanguage,
          confidence: data.confidence,
          policyNote: data.policyNote,
          suggestedSlots: data.suggestedSlots,
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingReceptionist(false);
    }
  }

  async function runLeadQualification(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoadingQual(true);
    try {
      const res = await fetch("/api/v1/ai/suite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "QUALIFY_LEAD",
          leadId: qualForm.leadId || undefined,
          customerName: qualForm.customerName,
          source: qualForm.source,
          title: qualForm.title,
          notes: qualForm.notes,
        }),
      });
      const data = await res.json();
      setQualResult(data);
    } finally {
      setLoadingQual(false);
    }
  }

  async function runBulkQualifyAll() {
    setLoadingBulkQual(true);
    try {
      const res = await fetch("/api/v1/ai/suite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "QUALIFY_LEAD", bulk: true }),
      });
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        setQualResult(data.results[0]);
      }
      // Refresh leads
      const ctxRes = await fetch("/api/v1/ai/suite");
      const ctxData = await ctxRes.json();
      if (ctxData.leads) setTenantLeads(ctxData.leads);
    } finally {
      setLoadingBulkQual(false);
    }
  }

  async function generateReplies(
    msg = replyForm.customerMessage,
    name = replyForm.customerName,
    channel = replyForm.channel
  ) {
    setLoadingReplies(true);
    try {
      const res = await fetch("/api/v1/ai/suite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "SUGGEST_REPLIES",
          customerMessage: msg,
          customerName: name,
          channel,
        }),
      });
      const data = await res.json();
      if (data.suggestions) {
        setReplySuggestions(data.suggestions);
        setDetectedSentiment(data.detectedSentiment || "HIGH BUYING INTENT");
      }
    } finally {
      setLoadingReplies(false);
    }
  }

  async function runBookingParser(promptText: string, createBooking = false) {
    setLoadingBooking(true);
    if (!createBooking) setCreatedBookingRecord(null);
    try {
      const res = await fetch("/api/v1/ai/suite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "AI_BOOKING",
          prompt: promptText,
          createBooking,
        }),
      });
      const data = await res.json();
      if (data.parsed) setParsedBooking(data.parsed);
      if (data.createdBooking) setCreatedBookingRecord(data.createdBooking);
      if (data.confirmationMessage)
        setConfirmationText(data.confirmationMessage);
    } finally {
      setLoadingBooking(false);
    }
  }

  function copyReply(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const TABS: { id: AIModeTab; label: string; sub: string; icon: any }[] = [
    {
      id: "RECEPTIONIST",
      label: "AI Receptionist",
      sub: "24/7 Bangla & English",
      icon: Bot,
    },
    {
      id: "QUALIFY_LEAD",
      label: "AI Lead Qualification",
      sub: "0–100 BANT Scorer",
      icon: Target,
    },
    {
      id: "SUGGEST_REPLIES",
      label: "AI Suggested Replies",
      sub: "3 Contextual Options",
      icon: MessageSquareReply,
    },
    {
      id: "AI_BOOKING",
      label: "AI Conversational Booking",
      sub: "NLP Slot & Party Parser",
      icon: CalendarPlus,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F5C94A] text-[#181A1E] flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
                  v2 AI Command Center
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]">
                  4 AI ENGINES LIVE
                </span>
              </div>
              <p className="text-xs text-[#73767D] mt-0.5">
                Bilingual 24/7 AI Receptionist, Lead BANT Scoring, 1-Click Smart
                Inbox Replies, and Natural Language Booking.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
          className={`inline-flex items-center px-4 py-2 rounded-xl text-xs transition ${
            autoReplyEnabled
              ? "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9] font-semibold"
              : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          {autoReplyEnabled
            ? "24/7 AI Autopilot: ACTIVE"
            : "24/7 AI Autopilot: PAUSED"}
        </button>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`text-left p-4 rounded-[18px] border transition flex items-start gap-3 ${
                isActive
                  ? "bg-[#181A1E] text-white border-[#181A1E] shadow-sm"
                  : "bg-white text-[#181A1E] border-[#EAEAEA] hover:border-[#F5C94A]"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive
                    ? "bg-[#F5C94A] text-[#181A1E]"
                    : "bg-[#F8F8FA] text-[#181A1E]"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">{t.label}</p>
                <p
                  className={`text-[11px] mt-0.5 ${
                    isActive ? "text-gray-300" : "text-[#73767D]"
                  }`}
                >
                  {t.sub}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: AI RECEPTIONIST                                                */}
      {/* ===================================================================== */}
      {activeTab === "RECEPTIONIST" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-5 flex items-center gap-3">
              <Languages className="w-5 h-5 text-[#181A1E] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#181A1E]">
                  Bangla, Banglish &amp; English
                </p>
                <p className="text-[11px] text-[#73767D]">
                  Auto-detects script and responds naturally
                </p>
              </div>
            </div>
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-5 flex items-center gap-3">
              <Cpu className="w-5 h-5 text-[#181A1E] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#181A1E]">
                  Pricing, Hours &amp; Location
                </p>
                <p className="text-[11px] text-[#73767D]">
                  {businessContext?.workingHours || "10:00 AM – 8:30 PM Daily"}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-5 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#181A1E] shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#181A1E]">
                  Deposit &amp; Cancellation Policy
                </p>
                <p className="text-[11px] text-[#73767D]">
                  20% bKash/Nagad advance • Free reschedule 12h prior
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-col h-[540px] space-y-4">
            <div className="bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#181A1E]" />
                <span className="text-xs font-bold text-[#181A1E]">
                  24/7 Bilingual AI Receptionist Simulator
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]">
                Grounded on {businessContext?.name || "Live Tenant Catalog"}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendReceptionistPrompt(prompt)}
                  className="px-3 py-1.5 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-[11px] transition"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4 space-y-4">
              {history.map((turn, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${
                    turn.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {turn.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9] flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-xl rounded-2xl p-3.5 text-xs space-y-2 ${
                      turn.role === "user"
                        ? "bg-[#F5C94A] text-[#181A1E] font-medium"
                        : "bg-white text-[#181A1E] border border-[#EAEAEA]"
                    }`}
                  >
                    <p className="leading-relaxed">{turn.content}</p>
                    {turn.intent && (
                      <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-[#EAEAEA] text-[10px]">
                        <span className="px-2 py-0.5 rounded-full bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9] font-bold">
                          Intent: {turn.intent}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5] font-semibold">
                          {turn.detectedLanguage}
                        </span>
                        {turn.confidence && (
                          <span className="text-[#73767D] font-mono">
                            {Math.round(turn.confidence * 100)}% confidence
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {turn.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-[#F3F1E8] text-[#262930] flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {loadingReceptionist && (
                <div className="flex items-center gap-2 text-xs text-[#73767D]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#181A1E]" />
                  AI Receptionist is composing bilingual response...
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendReceptionistPrompt(input);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Ask in Bangla, Banglish, or English (e.g. আপনাদের বিকাশ ডিপোজিট নিয়ম কী?)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
              />
              <button
                type="submit"
                disabled={loadingReceptionist}
                className="px-4 py-2.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: AI LEAD QUALIFICATION                                          */}
      {/* ===================================================================== */}
      {activeTab === "QUALIFY_LEAD" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Lead Selector & Input */}
          <div className="lg:col-span-6 bg-white rounded-[20px] border border-[#EAEAEA] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#181A1E]">
                  AI Lead Qualification Engine (BANT)
                </h3>
                <p className="text-xs text-[#73767D]">
                  Analyze enquiry notes, urgency, and channel to calculate 0–100
                  score.
                </p>
              </div>
              <button
                type="button"
                onClick={runBulkQualifyAll}
                disabled={loadingBulkQual}
                className="px-3 py-1.5 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#181A1E] rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                {loadingBulkQual ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Bulk Qualify Pipeline ({tenantLeads.length})
              </button>
            </div>

            {tenantLeads.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-[#73767D] uppercase mb-1">
                  Load Existing Pipeline Lead (Optional)
                </label>
                <select
                  value={qualForm.leadId}
                  onChange={(e) => {
                    const selected = tenantLeads.find(
                      (l) => l.id === e.target.value
                    );
                    if (selected) {
                      setQualForm({
                        leadId: selected.id,
                        customerName: selected.customerName,
                        source: selected.source,
                        title: selected.title || "Service Enquiry",
                        notes:
                          selected.notes ||
                          "Interested in booking an appointment slot soon.",
                      });
                    } else {
                      setQualForm({ ...qualForm, leadId: "" });
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E]"
                >
                  <option value="">-- Custom Enquiry Sandbox --</option>
                  {tenantLeads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.customerName} ({l.source}) — {l.title} [{l.aiScore}/100{" "}
                      {l.aiQualification}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={runLeadQualification} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#73767D] uppercase mb-1">
                    Prospect Name
                  </label>
                  <input
                    type="text"
                    value={qualForm.customerName}
                    onChange={(e) =>
                      setQualForm({ ...qualForm, customerName: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#73767D] uppercase mb-1">
                    Acquisition Source
                  </label>
                  <select
                    value={qualForm.source}
                    onChange={(e) =>
                      setQualForm({ ...qualForm, source: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E]"
                  >
                    <option value="WHATSAPP">WHATSAPP</option>
                    <option value="WEBSITE">WEBSITE</option>
                    <option value="INSTAGRAM">INSTAGRAM</option>
                    <option value="FACEBOOK">FACEBOOK</option>
                    <option value="PHONE">PHONE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#73767D] uppercase mb-1">
                  Requested Service / Package
                </label>
                <input
                  type="text"
                  value={qualForm.title}
                  onChange={(e) =>
                    setQualForm({ ...qualForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#73767D] uppercase mb-1">
                  Enquiry Notes / Customer Transcript
                </label>
                <textarea
                  rows={3}
                  value={qualForm.notes}
                  onChange={(e) =>
                    setQualForm({ ...qualForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E]"
                />
              </div>

              <button
                type="submit"
                disabled={loadingQual}
                className="w-full py-2.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                {loadingQual ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Target className="w-4 h-4" />
                )}
                Calculate AI Lead Score &amp; BANT Breakdown
              </button>
            </form>
          </div>

          {/* Right: BANT Scorecard Output */}
          <div className="lg:col-span-6 bg-white rounded-[20px] border border-[#EAEAEA] p-6 space-y-5">
            {qualResult && (
              <>
                <div className="flex items-center justify-between bg-[#F8F8FA] p-4 rounded-2xl border border-[#EAEAEA]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#73767D]">
                      AI Qualification Verdict
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {qualResult.aiQualification === "HOT" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-[#FAD4D6] text-[#9E2A2B]">
                          <Flame className="w-3.5 h-3.5" /> HOT LEAD 🔥
                        </span>
                      )}
                      {qualResult.aiQualification === "WARM" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-[#FBF3DC] text-[#5B4712]">
                          <Zap className="w-3.5 h-3.5" /> WARM LEAD ⚡
                        </span>
                      )}
                      {qualResult.aiQualification === "COLD" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-[#E2F2FA] text-[#174A67]">
                          <Snowflake className="w-3.5 h-3.5" /> COLD LEAD ❄️
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-[#181A1E]">
                      {qualResult.aiScore}
                    </span>
                    <span className="text-xs font-bold text-[#73767D]">
                      /100
                    </span>
                  </div>
                </div>

                {/* BANT Bars */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[#181A1E]">
                    BANT Dimension Breakdown (25 pts each)
                  </p>
                  {[
                    {
                      label: "Budget Readiness (Package & Deposit Intent)",
                      val: qualResult.bant?.budget ?? 22,
                    },
                    {
                      label: "Authority (Decision Maker Confidence)",
                      val: qualResult.bant?.authority ?? 21,
                    },
                    {
                      label: "Need Alignment (Service Match)",
                      val: qualResult.bant?.need ?? 23,
                    },
                    {
                      label: "Timeline & Urgency (Immediate vs Later)",
                      val: qualResult.bant?.timeline ?? 22,
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#262930] font-medium">
                          {item.label}
                        </span>
                        <span className="font-bold text-[#181A1E]">
                          {item.val} / 25
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#F3F1E8] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F5C94A] rounded-full transition-all"
                          style={{ width: `${(item.val / 25) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-[#F8F8FA] border border-[#EAEAEA] space-y-2">
                  <p className="text-[11px] font-bold text-[#181A1E] uppercase">
                    AI Executive Summary
                  </p>
                  <p className="text-xs text-[#262930] leading-relaxed">
                    {qualResult.aiSummary}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#E3F5EC] border border-[#CBEAD9] space-y-1">
                  <p className="text-[10px] font-bold text-[#184E37] uppercase">
                    Recommended Next Action
                  </p>
                  <p className="text-xs font-bold text-[#184E37]">
                    {qualResult.recommendedAction}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: AI SUGGESTED REPLIES                                           */}
      {/* ===================================================================== */}
      {activeTab === "SUGGEST_REPLIES" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white rounded-[20px] border border-[#EAEAEA] p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#181A1E]">
                Customer Message Context
              </h3>
              <p className="text-xs text-[#73767D]">
                Paste any WhatsApp, Instagram, or Facebook message to generate 3
                contextual reply tones.
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-[#73767D] uppercase">
                Quick Presets
              </p>
              <div className="flex flex-col gap-1.5">
                {SAMPLE_CUSTOMER_MESSAGES.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setReplyForm({
                        customerName: item.name,
                        channel: item.channel,
                        customerMessage: item.text,
                      });
                      generateReplies(item.text, item.name, item.channel);
                    }}
                    className="text-left p-2.5 rounded-xl bg-[#F8F8FA] hover:bg-[#F3F1E8] border border-[#EAEAEA] text-xs transition"
                  >
                    <span className="font-bold text-[#181A1E]">
                      {item.name} ({item.channel}):
                    </span>{" "}
                    <span className="text-[#73767D] line-clamp-1">
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#73767D] uppercase mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={replyForm.customerName}
                  onChange={(e) =>
                    setReplyForm({ ...replyForm, customerName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#73767D] uppercase mb-1">
                  Channel
                </label>
                <select
                  value={replyForm.channel}
                  onChange={(e) =>
                    setReplyForm({ ...replyForm, channel: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs"
                >
                  <option value="WHATSAPP">WHATSAPP</option>
                  <option value="INSTAGRAM">INSTAGRAM</option>
                  <option value="FACEBOOK">FACEBOOK</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#73767D] uppercase mb-1">
                Inbound Customer Message
              </label>
              <textarea
                rows={3}
                value={replyForm.customerMessage}
                onChange={(e) =>
                  setReplyForm({
                    ...replyForm,
                    customerMessage: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => generateReplies()}
              disabled={loadingReplies}
              className="w-full py-2.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-bold rounded-xl text-xs flex items-center justify-center gap-2"
            >
              {loadingReplies ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquareReply className="w-4 h-4" />
              )}
              Generate 3 Smart Reply Options
            </button>
          </div>

          {/* Right: 3 Generated Replies */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E3F5EC] text-[#184E37]">
                  Sentiment: {detectedSentiment}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowBanglaScript(!showBanglaScript)}
                className="px-3 py-1.5 rounded-xl bg-[#F3F1E8] hover:bg-[#EAE6D7] text-xs font-semibold text-[#181A1E]"
              >
                {showBanglaScript
                  ? "Showing: বাংলা Script"
                  : "Showing: English Script (Click for বাংলা)"}
              </button>
            </div>

            {replySuggestions.map((item) => {
              const displayMsg = showBanglaScript ? item.banglaText : item.text;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-[20px] border border-[#EAEAEA] p-5 space-y-3 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-[#181A1E]">
                        {item.tone}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF3DC] text-[#5B4712]">
                        {item.badge}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyReply(item.id, displayMsg)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Reply
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[#262930] bg-[#F8F8FA] p-3.5 rounded-xl border border-[#EAEAEA] leading-relaxed">
                    {displayMsg}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: AI CONVERSATIONAL BOOKING                                      */}
      {/* ===================================================================== */}
      {activeTab === "AI_BOOKING" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-[20px] border border-[#EAEAEA] p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#181A1E]">
                Natural Language Conversational Booking Parser
              </h3>
              <p className="text-xs text-[#73767D]">
                Type a plain sentence to extract customer, service, date, time,
                party size, check slot conflicts, and create the booking.
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-[#73767D] uppercase">
                Try Sample Voice / Text Commands
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_BOOKING_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setBookingPrompt(p);
                      runBookingParser(p, false);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#181A1E] text-[11px] font-medium text-left transition"
                  >
                    &ldquo;{p}&rdquo;
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#73767D] uppercase mb-1">
                Natural Language Command
              </label>
              <textarea
                rows={3}
                value={bookingPrompt}
                onChange={(e) => setBookingPrompt(e.target.value)}
                placeholder="e.g. Book Sarah for a Hair Spa tomorrow at 4pm with 2 people"
                className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] font-medium"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => runBookingParser(bookingPrompt, false)}
                disabled={loadingBooking}
                className="flex-1 py-2.5 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#181A1E] font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                {loadingBooking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Parse Entities &amp; Check Slot
              </button>
              <button
                type="button"
                onClick={() => runBookingParser(bookingPrompt, true)}
                disabled={loadingBooking}
                className="flex-1 py-2.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <CalendarPlus className="w-4 h-4" />
                Confirm &amp; Create Booking
              </button>
            </div>
          </div>

          {/* Right: Extracted Structured Payload */}
          <div className="lg:col-span-6 bg-white rounded-[20px] border border-[#EAEAEA] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#181A1E]">
                Extracted Structured Booking Entities
              </h3>
              {parsedBooking?.slotAvailable ? (
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]">
                  ✓ SLOT AVAILABLE
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FBF3DC] text-[#5B4712]">
                  WAITLIST / ALT SLOTS
                </span>
              )}
            </div>

            {parsedBooking && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA]">
                  <p className="text-[10px] font-bold text-[#73767D] uppercase">
                    Customer
                  </p>
                  <p className="text-xs font-extrabold text-[#181A1E] mt-0.5">
                    {parsedBooking.customerName}
                  </p>
                  <p className="text-[11px] text-[#73767D] font-mono">
                    {parsedBooking.customerPhone}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA]">
                  <p className="text-[10px] font-bold text-[#73767D] uppercase">
                    Matched Service
                  </p>
                  <p className="text-xs font-extrabold text-[#181A1E] mt-0.5">
                    {parsedBooking.serviceName}
                  </p>
                  <p className="text-[11px] text-[#73767D]">
                    {parsedBooking.durationMinutes} mins session
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA]">
                  <p className="text-[10px] font-bold text-[#73767D] uppercase">
                    Date &amp; Time Window
                  </p>
                  <p className="text-xs font-extrabold text-[#181A1E] mt-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {parsedBooking.date}
                  </p>
                  <p className="text-[11px] text-[#73767D] font-mono">
                    {parsedBooking.startTime} – {parsedBooking.endTime}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA]">
                  <p className="text-[10px] font-bold text-[#73767D] uppercase">
                    Party Size &amp; Fee (BDT)
                  </p>
                  <p className="text-xs font-extrabold text-[#181A1E] mt-0.5 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {parsedBooking.partySize}{" "}
                    person(s) • ৳{parsedBooking.totalPrice}
                  </p>
                  <p className="text-[11px] text-[#184E37] font-semibold">
                    20% Deposit: ৳{parsedBooking.depositRequired}
                  </p>
                </div>
              </div>
            )}

            {confirmationText && (
              <div className="p-4 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-xs text-[#181A1E]">
                <p className="font-bold mb-1">AI Summary:</p>
                <p>{confirmationText}</p>
              </div>
            )}

            {createdBookingRecord && (
              <div className="p-4 rounded-xl bg-[#E3F5EC] border border-[#CBEAD9] text-xs text-[#184E37] flex items-center justify-between">
                <div>
                  <p className="font-extrabold">
                    Booking Confirmed: {createdBookingRecord.bookingNumber}
                  </p>
                  <p className="text-[11px] mt-0.5">
                    Saved to calendar &amp; WhatsApp confirmation queued!
                  </p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-[#184E37]" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
