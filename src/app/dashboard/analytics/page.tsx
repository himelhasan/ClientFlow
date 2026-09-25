"use client";

import { useEffect, useState } from "react";
import {
  BarChart2,
  TrendingUp,
  Target,
  Users,
  FileCode,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { formatBDT } from "@/lib/utils/bangladesh";

// ── Colour palette for lead status pills ─────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
  CONTACTED: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
  QUALIFIED: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  QUOTE_SENT: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  BOOKING_PENDING: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  BOOKED: "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]",
  COMPLETED: "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]",
  LOST: "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]",
  CANCELLED: "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]",
};

// ── Colour palette for lead source bars ──────────────────────────────────────
const SOURCE_COLORS: Record<string, string> = {
  WEBSITE: "bg-[#F5C94A]",
  FACEBOOK: "bg-[#174A67]",
  INSTAGRAM: "bg-[#5B4712]",
  WHATSAPP: "bg-[#184E37]",
  GOOGLE: "bg-[#F5C94A]",
  QR_CODE: "bg-[#174A67]",
  SMS: "bg-[#184E37]",
  PHONE: "bg-[#5B4712]",
  MANUAL: "bg-[#73767D]",
  OTHER: "bg-[#73767D]",
};

// ── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  sublabel,
  icon: Icon,
  iconColor = "text-[#181A1E]",
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ElementType;
  iconColor?: string;
}) {
  return (
    <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
      <div className="flex items-center justify-between text-[#73767D] mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="text-3xl font-extrabold text-[#181A1E]">{value}</div>
      {sublabel && <span className="text-[11px] text-[#73767D] mt-1 block">{sublabel}</span>}
    </div>
  );
}

// ── Horizontal Bar for pipeline / sources ────────────────────────────────────
function HorizontalBar({
  label,
  count,
  total,
  colorClass,
  badgeClass,
}: {
  label: string;
  count: number;
  total: number;
  colorClass: string;
  badgeClass?: string;
}) {
  const pct = total > 0 ? Math.min(100, (count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 w-36 justify-center ${
          badgeClass ?? "bg-[#F3F1E8] text-[#262930] border border-[#EAEAEA]"
        }`}
      >
        {label}
      </span>
      <div className="flex-1 h-3 bg-[#F8F8FA] border border-[#EAEAEA] rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-[#181A1E] w-8 text-right shrink-0">{count}</span>
    </div>
  );
}

// ── Booking outcome stat pill ─────────────────────────────────────────────────
function OutcomePill({
  label,
  count,
  icon: Icon,
  colorClass,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${colorClass}`}>
      <Icon className="w-4 h-4 shrink-0" />
      <div>
        <p className="text-xl font-extrabold">{count.toLocaleString()}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/analytics");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
      </div>
    );
  }

  const {
    bookingStats = { allTime: {}, last30days: {} },
    leadStats = { total: 0, byStatus: {}, bySource: {} },
    formStats = [],
    revenueStats = { total: 0, last30days: 0, last7days: 0 },
    topServices = [],
  } = data ?? {};

  const allTime = bookingStats.allTime ?? {};
  const totalLeads = leadStats.total ?? 0;

  // Sorted status entries by count desc
  const statusEntries = Object.entries(leadStats.byStatus ?? {}).sort(
    (a, b) => (b[1] as number) - (a[1] as number)
  );
  const sourceEntries = Object.entries(leadStats.bySource ?? {}).sort(
    (a, b) => (b[1] as number) - (a[1] as number)
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-[#181A1E]" />
          Analytics Dashboard
        </h1>
        <p className="text-xs text-[#73767D] mt-1">
          All-time insights across bookings, leads, forms, revenue, and services.
        </p>
      </div>

      {/* ── ROW 1: Key Metrics ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Bookings"
          value={(allTime.total ?? 0).toLocaleString()}
          sublabel={`${bookingStats.last30days?.total ?? 0} in last 30 days`}
          icon={Calendar}
        />
        <MetricCard
          label="Completed"
          value={(allTime.completed ?? 0).toLocaleString()}
          sublabel={`${bookingStats.last30days?.completed ?? 0} in last 30 days`}
          icon={CheckCircle2}
          iconColor="text-[#184E37]"
        />
        <MetricCard
          label="Total Leads"
          value={totalLeads.toLocaleString()}
          sublabel="All-time inquiries"
          icon={Target}
          iconColor="text-[#174A67]"
        />
        <MetricCard
          label="Total Revenue"
          value={formatBDT(revenueStats.total)}
          sublabel={`${formatBDT(revenueStats.last30days)} last 30 days`}
          icon={TrendingUp}
        />
      </div>

      {/* ── ROW 2: Lead Pipeline ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Status */}
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-[#181A1E]" />
            <h3 className="text-sm font-bold text-[#181A1E]">Lead Pipeline by Status</h3>
            <span className="ml-auto text-xs text-[#73767D] font-medium">{totalLeads} total</span>
          </div>
          {statusEntries.length === 0 ? (
            <p className="text-xs text-[#73767D] text-center py-8">No leads yet.</p>
          ) : (
            <div className="space-y-3">
              {statusEntries.map(([status, count]) => (
                <HorizontalBar
                  key={status}
                  label={status.replace(/_/g, " ")}
                  count={count as number}
                  total={totalLeads}
                  colorClass="bg-[#F5C94A]"
                  badgeClass={STATUS_COLORS[status]}
                />
              ))}
            </div>
          )}
        </div>

        {/* By Source */}
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-4 h-4 text-[#181A1E]" />
            <h3 className="text-sm font-bold text-[#181A1E]">Lead Sources</h3>
            <span className="ml-auto text-xs text-[#73767D] font-medium">{totalLeads} total</span>
          </div>
          {sourceEntries.length === 0 ? (
            <p className="text-xs text-[#73767D] text-center py-8">No leads yet.</p>
          ) : (
            <div className="space-y-3">
              {sourceEntries.map(([source, count]) => (
                <HorizontalBar
                  key={source}
                  label={source.replace(/_/g, " ")}
                  count={count as number}
                  total={totalLeads}
                  colorClass={SOURCE_COLORS[source] ?? "bg-[#F5C94A]"}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 3: Form Performance ────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
        <div className="pb-4 mb-4 border-b border-[#EAEAEA] flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[#181A1E]" />
          <h3 className="text-sm font-bold text-[#181A1E]">Form Performance</h3>
        </div>
        {formStats.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#73767D]">
            No forms created yet. Go to <strong className="text-[#181A1E]">Forms</strong> to create your first booking widget.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F8FA] border-b border-[#EAEAEA] text-[#73767D] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Form Name</th>
                  <th className="py-3.5 px-4 text-right">Views</th>
                  <th className="py-3.5 px-4 text-right">Starts</th>
                  <th className="py-3.5 px-4 text-right">Submissions</th>
                  <th className="py-3.5 px-4 text-right">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {formStats.map((f: any) => {
                  const rate = f.conversionRate as number;
                  const rateCls =
                    rate >= 20
                      ? "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]"
                      : rate >= 10
                      ? "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]"
                      : "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]";
                  return (
                    <tr key={f.formId} className="hover:bg-[#F8F8FA] transition">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#181A1E]">{f.name}</p>
                        <p className="text-[11px] text-[#73767D] font-mono">/{f.slug}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-[#181A1E]">
                        {f.viewCount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-[#181A1E]">
                        {f.startCount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-[#181A1E]">
                        {f.submitCount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${rateCls}`}>
                          {rate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ROW 4: Top Services ────────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-[#181A1E]" />
          <h3 className="text-sm font-bold text-[#181A1E]">Top Services</h3>
          <span className="ml-auto text-xs text-[#73767D] font-medium">by booking count</span>
        </div>
        {topServices.length === 0 ? (
          <p className="text-xs text-[#73767D] text-center py-8">No service bookings recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {topServices.map((s: any, i: number) => (
              <div
                key={s.serviceId}
                className="relative bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4 text-xs"
              >
                <span className="absolute top-3 right-3 text-[10px] font-extrabold text-[#73767D]">
                  #{i + 1}
                </span>
                <p className="font-bold text-[#181A1E] pr-6 leading-tight">{s.name}</p>
                <p className="text-[#184E37] font-extrabold text-lg mt-1">
                  {s.bookingCount.toLocaleString()}
                </p>
                <p className="text-[11px] text-[#73767D]">bookings</p>
                <p className="text-xs font-bold text-[#181A1E] mt-2">{formatBDT(s.revenue)}</p>
                <p className="text-[11px] text-[#73767D]">revenue</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ROW 5: Booking Outcomes ────────────────────────────────────────── */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="w-4 h-4 text-[#181A1E]" />
          <h3 className="text-sm font-bold text-[#181A1E]">Booking Outcomes</h3>
          <span className="ml-auto text-xs text-[#73767D] font-medium">
            All-time · {(allTime.total ?? 0).toLocaleString()} total
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <OutcomePill
            label="Completed"
            count={allTime.completed ?? 0}
            icon={CheckCircle2}
            colorClass="bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]"
          />
          <OutcomePill
            label="Confirmed"
            count={allTime.confirmed ?? 0}
            icon={CheckCircle2}
            colorClass="bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]"
          />
          <OutcomePill
            label="Pending"
            count={allTime.pending ?? 0}
            icon={Clock}
            colorClass="bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]"
          />
          <OutcomePill
            label="Cancelled"
            count={allTime.cancelled ?? 0}
            icon={XCircle}
            colorClass="bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]"
          />
          <OutcomePill
            label="No-Show"
            count={allTime.noShow ?? 0}
            icon={AlertCircle}
            colorClass="bg-[#F8F8FA] text-[#73767D] border border-[#EAEAEA]"
          />
        </div>

        {/* Last 30 days context */}
        <div className="mt-5 pt-4 border-t border-[#EAEAEA]">
          <p className="text-[11px] font-bold text-[#73767D] uppercase tracking-wider mb-3">
            Last 30 Days
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Completed", val: bookingStats.last30days?.completed ?? 0 },
              { label: "Confirmed", val: bookingStats.last30days?.confirmed ?? 0 },
              { label: "Pending", val: bookingStats.last30days?.pending ?? 0 },
              { label: "Cancelled", val: bookingStats.last30days?.cancelled ?? 0 },
              { label: "No-Show", val: bookingStats.last30days?.noShow ?? 0 },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4"
              >
                <span className="text-[11px] text-[#73767D] font-semibold">{item.label}</span>
                <span className="text-sm font-extrabold text-[#181A1E]">{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
