"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Phone,
  Loader2,
  Search,
  X,
  Lock,
  Sparkles,
  FileText,
  UserCheck,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { formatBdDate } from "@/lib/utils/bangladesh";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface StaffOption {
  id: string;
  name: string;
  role?: string | null;
}

interface Conversation {
  id: string;
  customerId: string;
  customer: Customer;
  channel: string;
  unreadCount: number;
  assignedStaffId: string | null;
  status: "OPEN" | "ASSIGNED" | "RESOLVED" | "SNOOZED";
  priority: string;
  lastMessageAt: string;
  createdAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  direction: "INBOUND" | "OUTBOUND";
  channel: string;
  content: string;
  isInternalNote?: boolean;
  authorName?: string | null;
  templateId?: string | null;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  channel: string;
  category: string;
  subject?: string | null;
  content: string;
  variables?: string[];
  usageCount?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CHANNEL_TABS = ["ALL", "WHATSAPP", "SMS", "EMAIL", "WEBSITE"] as const;
type ChannelTab = (typeof CHANNEL_TABS)[number];

const TRIAGE_TABS = ["ALL", "UNASSIGNED", "MINE", "RESOLVED"] as const;
type TriageTab = (typeof TRIAGE_TABS)[number];

const CHANNEL_COLORS: Record<string, string> = {
  WHATSAPP: "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]",
  SMS: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
  EMAIL: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  WEBSITE: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  FACEBOOK: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
  INSTAGRAM: "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]",
};

const STATUS_COLORS: Record<string, string> = {
  QUEUED: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  SENDING: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  SENT: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
  DELIVERED: "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]",
  READ: "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]",
  FAILED: "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]",
};

const CONV_STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-[#FBF3DC] text-[#5B4712] border-[#F2E2B6]",
  ASSIGNED: "bg-[#E2F2FA] text-[#174A67] border-[#C4E3F5]",
  RESOLVED: "bg-[#E3F5EC] text-[#184E37] border-[#CBEAD9]",
  SNOOZED: "bg-[#F3F1E8] text-[#73767D] border-[#EAEAEA]",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatBdDate(dateStr);
}

function channelBadge(channel: string) {
  const cls =
    CHANNEL_COLORS[channel] ||
    "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}
    >
      {channel}
    </span>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ConversationSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl animate-pulse"
        >
          <div className="w-9 h-9 rounded-full bg-[#EAEAEA] shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[#EAEAEA] rounded w-2/3" />
            <div className="h-2.5 bg-[#F8F8FA] rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MessagesInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [currentStaffId, setCurrentStaffId] = useState<string>("stf-2");
  const [loadingConvs, setLoadingConvs] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const [triageTab, setTriageTab] = useState<TriageTab>("ALL");
  const [channelTab, setChannelTab] = useState<ChannelTab>("ALL");
  const [search, setSearch] = useState("");

  // Composer state
  const [reply, setReply] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sending, setSending] = useState(false);

  // Templates Picker & Modal
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [newTpl, setNewTpl] = useState({
    name: "",
    category: "REMINDER",
    channel: "WHATSAPP",
    content:
      "Hi {{customer_name}}, your booking for {{service_name}} on {{date}} at {{time}} is confirmed!",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Load conversations & templates ──
  async function loadConversations() {
    setLoadingConvs(true);
    try {
      const [convRes, tplRes] = await Promise.all([
        fetch("/api/v1/messages"),
        fetch("/api/v1/message-templates"),
      ]);
      const convData = await convRes.json();
      const tplData = await tplRes.json();

      const loadedConvs = convData.conversations || [];
      setConversations(loadedConvs);
      setStaffList(convData.staff || []);
      if (convData.currentStaffId) setCurrentStaffId(convData.currentStaffId);
      setTemplates(tplData.templates || []);

      if (loadedConvs.length > 0 && !selectedId) {
        setSelectedId(loadedConvs[0].id);
      }
    } catch (err) {
      console.error("Failed to load inbox data", err);
    } finally {
      setLoadingConvs(false);
    }
  }

  // ── Load a conversation's messages ──
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/v1/messages?conversationId=${convId}`);
      const data = await res.json();
      setMessages(data.messages || []);
      setActiveConv(data.conversation || null);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedId) loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Interpolate Template Variables ──
  function interpolateTemplate(rawContent: string): string {
    const custName = activeConv?.customer?.name || "Valued Customer";
    const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString(
      "en-GB",
      { day: "numeric", month: "short", year: "numeric" }
    );
    return rawContent
      .replace(/\{\{\s*customer_name\s*\}\}/gi, custName)
      .replace(
        /\{\{\s*service_name\s*\}\}/gi,
        "Executive Consultation & Care"
      )
      .replace(/\{\{\s*date\s*\}\}/gi, tomorrow)
      .replace(/\{\{\s*time\s*\}\}/gi, "11:00 AM");
  }

  // ── Update Conversation Assignment / Status ──
  async function handleUpdateConversation(updates: {
    assignedStaffId?: string | null;
    status?: Conversation["status"];
  }) {
    if (!activeConv) return;
    const nextConv = { ...activeConv, ...updates };
    if (updates.assignedStaffId && !updates.status) {
      nextConv.status = "ASSIGNED";
    }
    setActiveConv(nextConv);
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConv.id ? nextConv : c))
    );

    try {
      await fetch("/api/v1/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConv.id,
          ...updates,
        }),
      });
    } catch (err) {
      console.error("Failed to update conversation assignment", err);
    }
  }

  // ── Send reply or internal whisper note ──
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !selectedId || sending) return;
    setSending(true);

    const assignedStaffName =
      staffList.find((s) => s.id === activeConv?.assignedStaffId)?.name ||
      "Staff Whisper";

    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      conversationId: selectedId,
      direction: "OUTBOUND",
      channel: activeConv?.channel || "WHATSAPP",
      content: reply.trim(),
      isInternalNote,
      authorName: isInternalNote ? assignedStaffName : null,
      status: isInternalNote ? "DELIVERED" : "SENT",
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setReply("");

    try {
      const res = await fetch("/api/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedId,
          content: optimistic.content,
          channel: optimistic.channel,
          isInternalNote: optimistic.isInternalNote,
          authorName: optimistic.authorName,
        }),
      });

      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? data.message : m))
        );
        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.id === selectedId
              ? {
                  ...c,
                  lastMessageAt: new Date().toISOString(),
                  unreadCount: 0,
                }
              : c
          );
          return updated.sort(
            (a, b) =>
              new Date(b.lastMessageAt).getTime() -
              new Date(a.lastMessageAt).getTime()
          );
        });
      }
    } finally {
      setSending(false);
    }
  }

  // ── Create New Message Template ──
  async function handleCreateTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTpl.name.trim() || !newTpl.content.trim()) return;
    try {
      const res = await fetch("/api/v1/message-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTpl),
      });
      const data = await res.json();
      if (res.ok && data.template) {
        setTemplates((prev) => [data.template, ...prev]);
        setShowNewTemplateModal(false);
        setReply(interpolateTemplate(data.template.content));
      }
    } catch (err) {
      console.error("Failed to create template", err);
    }
  }

  // ── Contextual AI Smart Suggestions ──
  const aiSuggestedReplies = [
    {
      label: "Confirm Friday 10:30 AM",
      text: `Wa Alaikum Assalam ${
        activeConv?.customer?.name || ""
      }! Yes, your Friday 10:30 AM slot with Dr. Arman is 100% confirmed. Since you are a VIP member, no advance deposit is needed.`,
    },
    {
      label: "Send bKash Deposit Info",
      text: `Hi ${
        activeConv?.customer?.name || ""
      }, you can send the ৳500 advance deposit via bKash Merchant to 01711-009988 (Reference: Booking) and share the TrxID here!`,
    },
    {
      label: "Share Corporate Pricing",
      text: `Hello ${
        activeConv?.customer?.name || ""
      }! For 10+ team members, we offer a 15% Corporate Wellness discount. Shall I schedule a 10-minute call with our coordinator today?`,
    },
  ];

  // ── Filtered conversations ──
  const totalUnread = conversations.reduce((n, c) => n + c.unreadCount, 0);

  const filtered = conversations.filter((c) => {
    const matchChannel = channelTab === "ALL" || c.channel === channelTab;
    const matchSearch =
      !search ||
      c.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      c.customer.phone.includes(search);

    let matchTriage = true;
    if (triageTab === "UNASSIGNED") {
      matchTriage = !c.assignedStaffId && c.status !== "RESOLVED";
    } else if (triageTab === "MINE") {
      matchTriage = c.assignedStaffId === currentStaffId;
    } else if (triageTab === "RESOLVED") {
      matchTriage = c.status === "RESOLVED";
    }

    return matchChannel && matchSearch && matchTriage;
  });

  return (
    <div className="space-y-6 bg-[#F8F8F6] text-[#181A1E]">
      {/* Page title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#181A1E]" />
            Unified Inbox & Staff Triage
            {totalUnread > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9] text-[10px] font-bold rounded-full">
                {totalUnread} unread
              </span>
            )}
          </h1>
          <p className="text-xs text-[#73767D] mt-0.5">
            Assign conversations, add internal staff whisper notes, and insert
            variable templates
          </p>
        </div>

        {/* Triage Filter Bar: All | Unassigned | Mine | Resolved */}
        <div className="inline-flex bg-[#F3F1E8] p-1 rounded-xl border border-[#EAEAEA]">
          {TRIAGE_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTriageTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                triageTab === tab
                  ? "bg-white text-[#181A1E] shadow-xs"
                  : "text-[#73767D] hover:text-[#181A1E]"
              }`}
            >
              {tab === "ALL"
                ? "All"
                : tab === "UNASSIGNED"
                ? "Unassigned"
                : tab === "MINE"
                ? "Mine"
                : "Resolved"}
            </button>
          ))}
        </div>
      </div>

      {/* Two-panel card layout */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-col md:flex-row gap-6 min-h-[660px]">
        {/* ── Left: Conversation List ── */}
        <aside className="w-full md:w-80 lg:w-96 flex flex-col shrink-0 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#73767D] pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none placeholder-[#73767D]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#73767D] hover:text-[#181A1E]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Channel Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {CHANNEL_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setChannelTab(tab)}
                className={`px-2.5 py-1.5 text-[10px] transition ${
                  channelTab === tab
                    ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl"
                    : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-3 flex-1 overflow-y-auto">
            {loadingConvs ? (
              <ConversationSkeleton />
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-[#73767D] space-y-2 px-4 text-center">
                <MessageSquare className="w-8 h-8 text-[#73767D]" />
                <p className="text-xs font-medium text-[#73767D]">
                  No conversations match this triage filter
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {filtered.map((conv) => {
                  const assignee = staffList.find(
                    (s) => s.id === conv.assignedStaffId
                  );
                  return (
                    <li key={conv.id}>
                      <button
                        onClick={() => setSelectedId(conv.id)}
                        className={`w-full text-left px-3.5 py-3 flex items-start gap-3 transition ${
                          selectedId === conv.id
                            ? "bg-[#F5C94A] text-[#181A1E] font-semibold rounded-xl shadow-xs"
                            : "bg-white hover:bg-[#F3F1E8] text-[#181A1E] rounded-xl border border-[#EAEAEA]"
                        }`}
                      >
                        <div className="w-9 h-9 rounded-full bg-[#F3F1E8] border border-[#EAEAEA] flex items-center justify-center shrink-0 text-xs font-bold text-[#181A1E]">
                          {conv.customer.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-[#181A1E] truncate">
                              {conv.customer.name}
                            </span>
                            <span className="text-[10px] text-[#73767D] shrink-0">
                              {relativeTime(conv.lastMessageAt)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-1 mt-1">
                            <span className="text-[10px] text-[#73767D] truncate">
                              {assignee
                                ? `👤 ${assignee.name}`
                                : "Unassigned"}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                  CONV_STATUS_BADGE[conv.status || "OPEN"] ||
                                  CONV_STATUS_BADGE.OPEN
                                }`}
                              >
                                {conv.status || "OPEN"}
                              </span>
                              {channelBadge(conv.channel)}
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* ── Right: Message Thread ── */}
        <main className="flex-1 flex flex-col bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4 min-w-0">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[#73767D] space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-white border border-[#EAEAEA] flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-[#73767D]" />
              </div>
              <p className="text-sm font-semibold text-[#181A1E]">
                Select a conversation
              </p>
            </div>
          ) : (
            <>
              {/* Thread header with Staff Assignment & Status Triage Dropdowns */}
              <div className="px-4 py-3 bg-white rounded-xl border border-[#EAEAEA] flex flex-wrap items-center justify-between gap-3 shrink-0 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9] flex items-center justify-center text-sm font-bold shrink-0">
                    {activeConv?.customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#181A1E]">
                      {activeConv?.customer.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Phone className="w-3 h-3 text-[#73767D]" />
                      <span className="text-[11px] text-[#73767D] font-mono">
                        {activeConv?.customer.phone}
                      </span>
                      {activeConv && channelBadge(activeConv.channel)}
                    </div>
                  </div>
                </div>

                {/* Assignment & Status Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#F8F8FA] px-2.5 py-1.5 rounded-xl border border-[#EAEAEA]">
                    <UserCheck className="w-3.5 h-3.5 text-[#73767D]" />
                    <select
                      value={activeConv?.assignedStaffId || ""}
                      onChange={(e) =>
                        handleUpdateConversation({
                          assignedStaffId: e.target.value || null,
                        })
                      }
                      className="bg-transparent text-xs font-bold text-[#181A1E] focus:outline-none"
                    >
                      <option value="">Unassigned</option>
                      {staffList.map((stf) => (
                        <option key={stf.id} value={stf.id}>
                          {stf.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <select
                    value={activeConv?.status || "OPEN"}
                    onChange={(e) =>
                      handleUpdateConversation({
                        status: e.target.value as Conversation["status"],
                      })
                    }
                    className="px-3 py-1.5 bg-[#F3F1E8] border border-[#EAEAEA] rounded-xl text-xs font-bold text-[#181A1E]"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="SNOOZED">SNOOZED</option>
                  </select>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
                {loadingMsgs ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-[#181A1E]" />
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOut = msg.direction === "OUTBOUND";
                    const isWhisper = Boolean(msg.isInternalNote);

                    if (isWhisper) {
                      return (
                        <div key={msg.id} className="flex justify-center my-2">
                          <div className="max-w-[85%] w-full bg-[#FEF7E0] border border-[#F2D06B] rounded-2xl px-4 py-3 space-y-1 shadow-2xs">
                            <div className="flex items-center justify-between text-[10px] font-extrabold text-[#7A5908] uppercase tracking-wider">
                              <span className="flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                Internal Whisper Note ·{" "}
                                {msg.authorName || "Staff Only"}
                              </span>
                              <span>{formatBdDate(msg.createdAt)}</span>
                            </div>
                            <p className="text-xs text-[#4A3600] font-medium leading-relaxed">
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${
                          isOut ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] space-y-1 ${
                            isOut ? "items-end" : "items-start"
                          } flex flex-col`}
                        >
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                              isOut
                                ? "bg-[#F5C94A] text-[#181A1E] rounded-br-sm font-medium"
                                : "bg-white border border-[#EAEAEA] text-[#181A1E] rounded-bl-sm"
                            }`}
                          >
                            {msg.content}
                          </div>
                          <div
                            className={`flex items-center gap-1.5 text-[10px] text-[#73767D] ${
                              isOut ? "flex-row-reverse" : ""
                            }`}
                          >
                            <span>{formatBdDate(msg.createdAt)}</span>
                            {isOut && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                  STATUS_COLORS[msg.status] ||
                                  "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]"
                                }`}
                              >
                                {msg.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* AI Suggested Replies Bar */}
              <div className="pt-2 pb-1 flex items-center gap-1.5 overflow-x-auto">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#5B4712] bg-[#FBF3DC] px-2 py-1 rounded-lg border border-[#F2E2B6] shrink-0">
                  <Sparkles className="w-3 h-3" />
                  AI Smart Replies:
                </span>
                {aiSuggestedReplies.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setIsInternalNote(false);
                      setReply(sug.text);
                    }}
                    className="px-2.5 py-1 bg-white hover:bg-[#F3F1E8] border border-[#EAEAEA] rounded-lg text-[11px] font-semibold text-[#181A1E] shrink-0 transition"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>

              {/* Composer Toolbar: Public Reply vs Internal Whisper Note + Templates Picker */}
              <div className="pt-2 border-t border-[#EAEAEA] space-y-2 shrink-0 relative">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex bg-white p-0.5 rounded-xl border border-[#EAEAEA]">
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(false)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                        !isInternalNote
                          ? "bg-[#181A1E] text-white"
                          : "text-[#73767D] hover:text-[#181A1E]"
                      }`}
                    >
                      Public Reply ({activeConv?.channel || "WHATSAPP"})
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(true)}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                        isInternalNote
                          ? "bg-[#F5C94A] text-[#181A1E]"
                          : "text-[#73767D] hover:text-[#181A1E]"
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      Internal Whisper Note
                    </button>
                  </div>

                  {/* Message Templates Picker Button */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setShowTemplatePicker((prev) => !prev)
                      }
                      className="px-3 py-1.5 bg-white hover:bg-[#F3F1E8] border border-[#EAEAEA] rounded-xl text-xs font-bold text-[#181A1E] flex items-center gap-1.5 transition"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#5B4712]" />
                      Templates ({templates.length})
                    </button>
                  </div>
                </div>

                {/* Templates Popover Drawer */}
                {showTemplatePicker && (
                  <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-2.5 max-h-60 overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#181A1E]">
                        Insert Variable Message Template
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowTemplatePicker(false);
                            setShowNewTemplateModal(true);
                          }}
                          className="text-[11px] font-bold text-[#5B4712] bg-[#FBF3DC] px-2.5 py-1 rounded-lg border border-[#F2E2B6] flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          New Template
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowTemplatePicker(false)}
                          className="text-[#73767D] hover:text-[#181A1E]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {templates.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            setReply(interpolateTemplate(tpl.content));
                            setShowTemplatePicker(false);
                          }}
                          className="text-left p-2.5 rounded-xl bg-[#F8F8FA] hover:bg-[#FBF3DC]/60 border border-[#EAEAEA] transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#181A1E]">
                              {tpl.name}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#EAEAEA] text-[#73767D]">
                              {tpl.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#73767D] mt-1 line-clamp-2">
                            {tpl.content}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reply Input Form */}
                <form
                  onSubmit={handleSend}
                  className="flex items-end gap-2"
                >
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e as any);
                      }
                    }}
                    placeholder={
                      isInternalNote
                        ? "Write a private internal whisper note visible only to staff…"
                        : "Type a reply or select a template above… (Enter to send)"
                    }
                    rows={2}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs text-[#181A1E] focus:outline-none resize-none placeholder-[#73767D] border ${
                      isInternalNote
                        ? "bg-[#FEF7E0] border-[#F2D06B]"
                        : "bg-white border-[#EAEAEA] focus:border-[#F5C94A]"
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className={`h-10 px-4 font-bold rounded-xl disabled:opacity-50 text-xs flex items-center gap-1.5 transition shrink-0 ${
                      isInternalNote
                        ? "bg-[#181A1E] hover:bg-[#2D3139] text-white"
                        : "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E]"
                    }`}
                  >
                    {sending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isInternalNote ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    {isInternalNote ? "Save Note" : "Send"}
                  </button>
                </form>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ─── New Message Template Modal ─────────────────────────────────────── */}
      {showNewTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] max-w-md w-full p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#181A1E]">
                Create Message Template
              </h2>
              <button
                type="button"
                onClick={() => setShowNewTemplateModal(false)}
                className="p-1.5 rounded-lg text-[#73767D] hover:text-[#181A1E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#181A1E] mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTpl.name}
                  onChange={(e) =>
                    setNewTpl((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Friday VIP Slot Confirmation"
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#181A1E] mb-1">
                    Category
                  </label>
                  <select
                    value={newTpl.category}
                    onChange={(e) =>
                      setNewTpl((p) => ({ ...p, category: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs"
                  >
                    <option value="CONFIRMATION">CONFIRMATION</option>
                    <option value="REMINDER">REMINDER</option>
                    <option value="FOLLOW_UP">FOLLOW_UP</option>
                    <option value="REVIEW_REQUEST">REVIEW_REQUEST</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#181A1E] mb-1">
                    Channel
                  </label>
                  <select
                    value={newTpl.channel}
                    onChange={(e) =>
                      setNewTpl((p) => ({ ...p, channel: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs"
                  >
                    <option value="WHATSAPP">WHATSAPP</option>
                    <option value="SMS">SMS</option>
                    <option value="EMAIL">EMAIL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#181A1E] mb-1">
                  Content (supports{" "}
                  <code className="text-[#5B4712]">
                    {"{{customer_name}} {{service_name}} {{date}} {{time}}"}
                  </code>
                  )
                </label>
                <textarea
                  rows={4}
                  required
                  value={newTpl.content}
                  onChange={(e) =>
                    setNewTpl((p) => ({ ...p, content: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTemplateModal(false)}
                  className="px-4 py-2 bg-[#F3F1E8] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] rounded-xl text-xs font-extrabold"
                >
                  Save & Insert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
