"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MessageSquare,
  Send,
  Phone,
  Loader2,
  Circle,
  Search,
  X,
} from "lucide-react";
import { formatBdDate } from "@/lib/utils/bangladesh";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Conversation {
  id: string;
  customerId: string;
  customer: Customer;
  channel: string;
  unreadCount: number;
  lastMessageAt: string;
  createdAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  direction: "INBOUND" | "OUTBOUND";
  channel: string;
  content: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CHANNEL_TABS = ["ALL", "WHATSAPP", "SMS", "EMAIL", "WEBSITE"] as const;
type ChannelTab = (typeof CHANNEL_TABS)[number];

const CHANNEL_COLORS: Record<string, string> = {
  WHATSAPP: "bg-emerald-100 text-emerald-700 border-emerald-200",
  SMS: "bg-blue-100 text-blue-700 border-blue-200",
  EMAIL: "bg-violet-100 text-violet-700 border-violet-200",
  WEBSITE: "bg-amber-100 text-amber-700 border-amber-200",
  FACEBOOK: "bg-indigo-100 text-indigo-700 border-indigo-200",
  INSTAGRAM: "bg-rose-100 text-rose-700 border-rose-200",
};

const STATUS_COLORS: Record<string, string> = {
  QUEUED: "text-slate-400",
  SENDING: "text-amber-500",
  SENT: "text-blue-500",
  DELIVERED: "text-emerald-500",
  READ: "text-emerald-600",
  FAILED: "text-red-500",
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
  const cls = CHANNEL_COLORS[channel] || "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}
    >
      {channel}
    </span>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function ConversationSkeleton() {
  return (
    <div className="space-y-0.5 p-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
          <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-2/3" />
            <div className="h-2.5 bg-slate-100 rounded w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MessagesInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const [channelTab, setChannelTab] = useState<ChannelTab>("ALL");
  const [search, setSearch] = useState("");

  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Load all conversations ──
  async function loadConversations() {
    setLoadingConvs(true);
    try {
      const res = await fetch("/api/v1/messages");
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Failed to load conversations", err);
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
      // Mark as read locally
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send reply ──
  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !selectedId || sending) return;
    setSending(true);

    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      conversationId: selectedId,
      direction: "OUTBOUND",
      channel: activeConv?.channel || "WHATSAPP",
      content: reply.trim(),
      status: "QUEUED",
      sentAt: null,
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
        }),
      });

      const data = await res.json();
      if (res.ok && data.message) {
        // Replace optimistic with real message
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? data.message : m))
        );
        // Update conversation list order
        setConversations((prev) => {
          const updated = prev.map((c) =>
            c.id === selectedId
              ? { ...c, lastMessageAt: new Date().toISOString(), unreadCount: 0 }
              : c
          );
          return updated.sort(
            (a, b) =>
              new Date(b.lastMessageAt).getTime() -
              new Date(a.lastMessageAt).getTime()
          );
        });
      } else {
        // Remove optimistic on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        alert(data.error || "Failed to send message");
      }
    } catch (_) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      alert("Network error — message not sent");
    } finally {
      setSending(false);
    }
  }

  // ── Filtered conversations ──
  const totalUnread = conversations.reduce((n, c) => n + c.unreadCount, 0);

  const filtered = conversations.filter((c) => {
    const matchChannel =
      channelTab === "ALL" || c.channel === channelTab;
    const matchSearch =
      !search ||
      c.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      c.customer.phone.includes(search);
    return matchChannel && matchSearch;
  });

  // ── Last message preview ──
  // We don't load all message content in the list API, so show placeholder
  function previewText(conv: Conversation) {
    return `${relativeTime(conv.lastMessageAt)}`;
  }

  return (
    <div className="flex flex-col h-full -m-4 sm:-m-6 lg:-m-8">
      {/* Page title bar (stays above the two-panel layout) */}
      <div className="px-4 sm:px-6 lg:px-8 pt-4 pb-3 border-b border-slate-200/80 bg-white flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            Inbox
            {totalUnread > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full">
                {totalUnread}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified messaging across all channels
          </p>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Conversation List ── */}
        <aside className="w-full md:w-80 lg:w-96 border-r border-slate-200/80 bg-white flex flex-col shrink-0">
          {/* Search */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Channel Tabs */}
          <div className="px-3 pb-2 shrink-0">
            <div className="flex items-center gap-1 flex-wrap">
              {CHANNEL_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setChannelTab(tab)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                    channelTab === tab
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <ConversationSkeleton />
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 space-y-2 px-4">
                <MessageSquare className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-medium text-slate-500">
                  {search || channelTab !== "ALL"
                    ? "No conversations match your filters"
                    : "No conversations yet"}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {filtered.map((conv) => (
                  <li key={conv.id}>
                    <button
                      onClick={() => setSelectedId(conv.id)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition ${
                        selectedId === conv.id
                          ? "bg-emerald-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-xs font-bold text-slate-600">
                        {conv.customer.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {conv.customer.name}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {relativeTime(conv.lastMessageAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <span className="text-[11px] text-slate-500 truncate flex-1">
                            {conv.customer.phone}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {channelBadge(conv.channel)}
                            {conv.unreadCount > 0 && (
                              <span className="w-4 h-4 flex items-center justify-center rounded-full bg-emerald-600 text-white text-[9px] font-bold">
                                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* ── Right: Message Thread ── */}
        <main className="flex-1 flex flex-col bg-slate-50 min-w-0">
          {!selectedId ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-500">
                Select a conversation
              </p>
              <p className="text-xs text-slate-400">
                Choose a thread from the left to start messaging
              </p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-5 py-3.5 bg-white border-b border-slate-200/80 flex items-center gap-3 shrink-0">
                {loadingMsgs ? (
                  <div className="flex items-center gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-slate-200" />
                    <div className="space-y-1.5">
                      <div className="h-3 bg-slate-200 rounded w-32" />
                      <div className="h-2.5 bg-slate-100 rounded w-24" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 shrink-0">
                      {activeConv?.customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900">
                        {activeConv?.customer.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] text-slate-500 font-mono">
                          {activeConv?.customer.phone}
                        </span>
                        {activeConv && channelBadge(activeConv.channel)}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {loadingMsgs ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                    <p className="text-xs">No messages in this conversation yet</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOut = msg.direction === "OUTBOUND";
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOut ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] space-y-1 ${
                            isOut ? "items-end" : "items-start"
                          } flex flex-col`}
                        >
                          <div
                            className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                              isOut
                                ? "bg-emerald-600 text-white rounded-br-sm"
                                : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-xs"
                            }`}
                          >
                            {msg.content}
                          </div>
                          <div
                            className={`flex items-center gap-1.5 text-[10px] text-slate-400 ${
                              isOut ? "flex-row-reverse" : ""
                            }`}
                          >
                            <span>
                              {formatBdDate(msg.createdAt)}
                            </span>
                            {isOut && (
                              <span
                                className={`font-semibold ${
                                  STATUS_COLORS[msg.status] || "text-slate-400"
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

              {/* Reply input */}
              <form
                onSubmit={handleSend}
                className="px-4 py-3 bg-white border-t border-slate-200/80 flex items-end gap-2 shrink-0"
              >
                <textarea
                  value={reply}
                  onChange={(e) => {
                    setReply(e.target.value);
                    // Allow Shift+Enter for newlines; Enter alone submits
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e as any);
                    }
                  }}
                  placeholder="Type a reply… (Enter to send, Shift+Enter for newline)"
                  rows={2}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none placeholder-slate-400"
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shrink-0"
                >
                  {sending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Send
                </button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
