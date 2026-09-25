"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  ShieldCheck,
  Receipt,
  Calendar,
  Target,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { formatBDT, formatBdDateTime } from "@/lib/utils/bangladesh";

export default function NotificationsAndAuditPage() {
  const [tab, setTab] = useState<"alerts" | "ledger" | "audit">("alerts");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [usageLedger, setUsageLedger] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setUsageLedger(data.usageLedger || []);
      setAuditLogs(data.auditLogs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function markAllRead() {
    await fetch("/api/v1/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  async function markOneRead(id: string) {
    await fetch("/api/v1/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
            Notifications, Usage Ledger &amp; Audit Trail
          </h1>
          <p className="text-xs text-[#73767D] mt-1">
            Real-time booking alerts, per-message WhatsApp/SMS BDT cost ledger, and tenant security logs.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold rounded-xl transition"
          >
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Mark All Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setTab("alerts")}
          className={`flex items-center gap-1.5 px-3.5 py-2 transition ${
            tab === "alerts"
              ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl"
              : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl"
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Alerts ({notifications.length})
        </button>
        <button
          onClick={() => setTab("ledger")}
          className={`flex items-center gap-1.5 px-3.5 py-2 transition ${
            tab === "ledger"
              ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl"
              : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl"
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          Messaging Cost Ledger ({usageLedger.length})
        </button>
        <button
          onClick={() => setTab("audit")}
          className={`flex items-center gap-1.5 px-3.5 py-2 transition ${
            tab === "audit"
              ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl"
              : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Security Audit Logs ({auditLogs.length})
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
        </div>
      ) : tab === "alerts" ? (
        notifications.length === 0 ? (
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] py-12 text-center space-y-2">
            <Bell className="w-10 h-10 text-[#73767D] mx-auto" />
            <h3 className="text-sm font-bold text-[#181A1E]">
              No notifications yet
            </h3>
            <p className="text-xs text-[#73767D]">
              Alerts for new bookings, leads, and quota thresholds appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markOneRead(n.id)}
                className={`rounded-[14px] border border-[#EAEAEA] p-4 flex items-start justify-between gap-4 transition cursor-pointer ${
                  n.isRead ? "bg-[#F8F8FA]" : "bg-[#FBF3DC]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      n.type === "NEW_BOOKING"
                        ? "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]"
                        : n.type === "QUOTA_ALERT"
                        ? "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]"
                        : "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]"
                    }`}
                  >
                    {n.type === "NEW_BOOKING" ? (
                      <Calendar className="w-4 h-4" />
                    ) : n.type === "QUOTA_ALERT" ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Target className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-[#181A1E]">
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#73767D] mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-[#73767D] mt-1">
                      {formatBdDateTime(n.createdAt)}
                    </p>
                  </div>
                </div>
                {n.link && (
                  <Link
                    href={n.link}
                    className="px-3 py-1.5 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-xs flex items-center shrink-0"
                  >
                    View <ExternalLink className="w-3 h-3 ml-1" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )
      ) : tab === "ledger" ? (
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] overflow-hidden">
          {usageLedger.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#73767D]">
              No outbound messaging usage recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F8FA] border-b border-[#EAEAEA] text-[#73767D] uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Provider</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Unit Cost (BDT)</th>
                    <th className="py-3 px-4">Dispatched At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {usageLedger.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F8F8FA]">
                      <td className="py-3 px-4 font-bold text-[#181A1E]">
                        {u.channel}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#73767D]">
                        {u.provider}
                      </td>
                      <td className="py-3 px-4 text-[#73767D]">
                        {u.messageType}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#184E37]">
                        {formatBDT(u.providerCost)}
                      </td>
                      <td className="py-3 px-4 text-[#73767D]">
                        {formatBdDateTime(u.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#73767D]">
              No audit log events recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F8FA] border-b border-[#EAEAEA] text-[#73767D] uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F8F8FA]">
                      <td className="py-3 px-4 font-bold text-[#181A1E]">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-[#73767D]">
                        {log.entity} {log.entityId ? `(#${log.entityId.slice(-5)})` : ""}
                      </td>
                      <td className="py-3 px-4 text-[#73767D]">
                        {log.user?.name || "System"}
                      </td>
                      <td className="py-3 px-4 text-[#73767D]">
                        {formatBdDateTime(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
