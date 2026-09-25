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
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Notifications, Usage Ledger &amp; Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time booking alerts, per-message WhatsApp/SMS BDT cost ledger, and tenant security logs.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Mark All Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 w-fit text-xs font-bold">
        <button
          onClick={() => setTab("alerts")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
            tab === "alerts"
              ? "bg-emerald-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Alerts ({notifications.length})
        </button>
        <button
          onClick={() => setTab("ledger")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
            tab === "ledger"
              ? "bg-emerald-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          Messaging Cost Ledger ({usageLedger.length})
        </button>
        <button
          onClick={() => setTab("audit")}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
            tab === "audit"
              ? "bg-emerald-600 text-white"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Security Audit Logs ({auditLogs.length})
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : tab === "alerts" ? (
        notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-2">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              No notifications yet
            </h3>
            <p className="text-xs text-slate-400">
              Alerts for new bookings, leads, and quota thresholds appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && markOneRead(n.id)}
                className={`p-4 flex items-start justify-between gap-4 transition cursor-pointer ${
                  n.isRead ? "bg-white" : "bg-emerald-50/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      n.type === "NEW_BOOKING"
                        ? "bg-emerald-100 text-emerald-700"
                        : n.type === "QUOTA_ALERT"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
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
                      <p className="text-xs font-bold text-slate-900">
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {formatBdDateTime(n.createdAt)}
                    </p>
                  </div>
                </div>
                {n.link && (
                  <Link
                    href={n.link}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center shrink-0"
                  >
                    View <ExternalLink className="w-3 h-3 ml-1" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        )
      ) : tab === "ledger" ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          {usageLedger.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No outbound messaging usage recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Unit Cost (BDT)</th>
                  <th className="py-3 px-4">Dispatched At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usageLedger.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {u.channel}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {u.provider}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {u.messageType}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      {formatBDT(u.providerCost)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {formatBdDateTime(u.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No audit log events recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {log.entity} {log.entityId ? `(#${log.entityId.slice(-5)})` : ""}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {log.user?.name || "System"}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {formatBdDateTime(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
