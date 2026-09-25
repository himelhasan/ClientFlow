"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Code2,
  User,
  Globe,
  Clock,
  Activity,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { formatBdDate } from "@/lib/utils/bangladesh";

interface TimelineEvent {
  id: string;
  sourceType: "AUDIT_LOG" | "BOOKING_EVENT" | "LEAD_EVENT" | "AUTOMATION_RUN";
  action: string;
  entity: string;
  entityId: string;
  actorName: string;
  actorRole: string;
  ipAddress: string;
  securityBadge: string;
  description: string;
  oldData: any;
  newData: any;
  createdAt: string;
}

const SOURCE_BADGE: Record<string, string> = {
  AUDIT_LOG: "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]",
  BOOKING_EVENT: "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]",
  LEAD_EVENT: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  AUTOMATION_RUN: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
};

const SECURITY_BADGE: Record<string, string> = {
  SECURITY_AUDIT: "bg-[#181A1E] text-[#F5C94A] border border-[#181A1E]",
  PII_ACCESS: "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]",
  VERIFIED: "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]",
  AUTOMATED: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
  AI_SCORED: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
};

export default function AuditTimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [entityFilter, setEntityFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showLogModal, setShowLogModal] = useState(false);
  const [newLog, setNewLog] = useState({
    action: "SECURITY_REVIEW",
    entity: "Customer",
    entityId: "cust-fallback-1",
    description: "Verified GDPR / Bangladesh Data Privacy opt-in compliance",
  });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/audit-logs");
      const data = await res.json();
      setEvents(data.events || []);
      if (data.events?.length > 0 && !expandedId) {
        setExpandedId(data.events[0].id);
      }
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  }, [expandedId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  async function handleRecordComplianceEvent(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/v1/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newLog,
          oldData: { complianceStatus: "PENDING_REVIEW" },
          newData: {
            complianceStatus: "APPROVED",
            reviewedBy: "Security Officer",
            timestamp: new Date().toISOString(),
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.event) {
        setEvents((prev) => [data.event, ...prev]);
        setExpandedId(data.event.id);
        setShowLogModal(false);
      }
    } catch (err) {
      console.error("Failed to log audit event", err);
    }
  }

  const filtered = events.filter((ev) => {
    if (
      entityFilter !== "ALL" &&
      ev.entity.toUpperCase() !== entityFilter.toUpperCase()
    ) {
      return false;
    }
    if (sourceFilter !== "ALL" && ev.sourceType !== sourceFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        ev.description.toLowerCase().includes(q) ||
        ev.actorName.toLowerCase().includes(q) ||
        ev.action.toLowerCase().includes(q) ||
        ev.entityId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 bg-[#F8F8F6] text-[#181A1E]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#F5C94A] flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-[#181A1E]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
              Audit & Activity Timeline
            </h1>
            <p className="text-xs text-[#73767D]">
              Unified security audit trail combining AuditLogs, BookingEvents,
              LeadEvents & AutomationRuns
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowLogModal(true)}
          className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Log Security Event
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#73767D] flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Entity:
          </span>
          {["ALL", "Customer", "Booking", "Lead", "Automation"].map((ent) => (
            <button
              key={ent}
              type="button"
              onClick={() => setEntityFilter(ent)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                entityFilter === ent
                  ? "bg-[#F5C94A] text-[#181A1E]"
                  : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930]"
              }`}
            >
              {ent}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs font-medium text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
          >
            <option value="ALL">All Event Streams</option>
            <option value="AUDIT_LOG">Security AuditLog</option>
            <option value="BOOKING_EVENT">BookingEvent</option>
            <option value="LEAD_EVENT">LeadEvent</option>
            <option value="AUTOMATION_RUN">AutomationRun</option>
          </select>

          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#73767D]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actor, action, ID…"
              className="w-full pl-9 pr-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] placeholder:text-[#73767D] focus:border-[#F5C94A] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Chronological Activity Timeline Feed */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#181A1E]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Activity className="w-10 h-10 text-[#73767D] mx-auto" />
            <p className="text-sm font-semibold text-[#181A1E]">
              No activity events match your filters
            </p>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-[#EAEAEA] space-y-4">
            {filtered.map((ev) => {
              const isExpanded = expandedId === ev.id;
              return (
                <div key={ev.id} className="relative">
                  {/* Timeline node dot */}
                  <div className="absolute -left-[31px] top-4 w-3.5 h-3.5 rounded-full bg-[#F5C94A] border-2 border-white" />

                  <div className="bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4 hover:border-[#F5C94A] transition">
                    <div
                      onClick={() =>
                        setExpandedId((prev) =>
                          prev === ev.id ? null : ev.id
                        )
                      }
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              SOURCE_BADGE[ev.sourceType] ||
                              SOURCE_BADGE.AUDIT_LOG
                            }`}
                          >
                            {ev.sourceType}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              SECURITY_BADGE[ev.securityBadge] ||
                              SECURITY_BADGE.VERIFIED
                            }`}
                          >
                            {ev.securityBadge}
                          </span>
                          <span className="font-mono text-xs font-semibold text-[#181A1E]">
                            {ev.action}
                          </span>
                          <span className="text-xs text-[#73767D]">
                            on{" "}
                            <strong className="text-[#181A1E]">
                              {ev.entity}
                            </strong>{" "}
                            ({ev.entityId})
                          </span>
                        </div>

                        <p className="text-xs font-medium text-[#181A1E]">
                          {ev.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#73767D]">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {ev.actorName} ({ev.actorRole})
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Globe className="w-3 h-3" />
                            IP: {ev.ipAddress}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatBdDate(ev.createdAt)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1.5 bg-white hover:bg-[#F3F1E8] border border-[#EAEAEA] rounded-xl text-[11px] font-semibold text-[#181A1E] flex items-center gap-1.5 shrink-0 transition"
                      >
                        <Code2 className="w-3.5 h-3.5 text-[#181A1E]" />
                        Payload Diff
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Expandable JSON Payload Diff Viewer */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-[#EAEAEA] grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white rounded-xl border border-[#EAEAEA] p-3">
                          <p className="text-[10px] font-semibold text-[#9E2A2B] uppercase tracking-wider mb-1.5">
                            Previous State (oldData)
                          </p>
                          <pre className="text-[11px] font-mono text-[#181A1E] overflow-x-auto whitespace-pre-wrap">
                            {ev.oldData
                              ? JSON.stringify(ev.oldData, null, 2)
                              : "// No previous state (New creation / trigger)"}
                          </pre>
                        </div>

                        <div className="bg-white rounded-xl border border-[#CBEAD9] p-3">
                          <p className="text-[10px] font-semibold text-[#184E37] uppercase tracking-wider mb-1.5">
                            Updated State / Metadata (newData)
                          </p>
                          <pre className="text-[11px] font-mono text-[#181A1E] overflow-x-auto whitespace-pre-wrap">
                            {ev.newData
                              ? JSON.stringify(ev.newData, null, 2)
                              : "{}"}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Record Manual Security Event Modal ──────────────────────────────── */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] max-w-md w-full p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#181A1E]">
                Record Security Audit Event
              </h2>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="p-1.5 rounded-lg text-[#73767D] hover:text-[#181A1E] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordComplianceEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Action Code *
                </label>
                <input
                  type="text"
                  required
                  value={newLog.action}
                  onChange={(e) =>
                    setNewLog((p) => ({ ...p, action: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs font-mono text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Entity
                  </label>
                  <select
                    value={newLog.entity}
                    onChange={(e) =>
                      setNewLog((p) => ({ ...p, entity: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                  >
                    <option value="Customer">Customer</option>
                    <option value="Booking">Booking</option>
                    <option value="Lead">Lead</option>
                    <option value="Automation">Automation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Entity ID
                  </label>
                  <input
                    type="text"
                    value={newLog.entityId}
                    onChange={(e) =>
                      setNewLog((p) => ({ ...p, entityId: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs font-mono text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Audit Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={newLog.description}
                  onChange={(e) =>
                    setNewLog((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] rounded-xl text-xs font-semibold text-[#262930] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] rounded-xl text-xs font-semibold transition"
                >
                  Append to Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
