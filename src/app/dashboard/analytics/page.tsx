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
  NEW: "bg-blue-100 text-blue-800 border-blue-200",
  CONTACTED: "bg-sky-100 text-sky-800 border-sky-200",
  QUALIFIED: "bg-violet-100 text-violet-800 border-violet-200",
  QUOTE_SENT: "bg-amber-100 text-amber-800 border-amber-200",
  BOOKING_PENDING: "bg-orange-100 text-orange-800 border-orange-200",
  BOOKED: "bg-teal-100 text-teal-800 border-teal-200",
  COMPLETED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  LOST: "bg-red-100 text-red-800 border-red-200",
  CANCELLED: "bg-slate-100 text-slate-700 border-slate-200",
};

// ── Colour palette for lead source bars ──────────────────────────────────────
const SOURCE_COLORS: Record<string, string> = {
  WEBSITE: "bg-emerald-500",
  FACEBOOK: "bg-blue-500",
  INSTAGRAM: "bg-pink-500",
  WHATSAPP: "bg-green-500",
  GOOGLE: "bg-yellow-500",
  QR_CODE: "bg-violet-500",
  SMS: "bg-cyan-500",
  PHONE: "bg-orange-500",
  MANUAL: "bg-slate-500",
  OTHER: "bg-gray-400",
};

// ── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({
  label,
  value,
  sublabel,
  icon: Icon,
  iconColor = "text-emerald-600",
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ElementType;
  iconColor?: string;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between text-slate-500 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="text-3xl font-extrabold text-slate-900">{value}</div>
      {sublabel && <span className="text-[11px] text-slate-400 mt-1 block">{sublabel}</span>}
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
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 w-36 justify-center ${
          badgeClass ?? "bg-slate-100 text-slate-700 border-slate-200"
        }`}
      >
        {label}
      </span>
      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-slate-700 w-8 text-right shrink-0">{count}</span>
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
    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${colorClass}`}>
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
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
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
        <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-emerald-600" />
          Analytics Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-1">
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
          iconColor="text-emerald-600"
        />
        <MetricCard
          label="Total Leads"
          value={totalLeads.toLocaleString()}
          sublabel="All-time inquiries"
          icon={Target}
          iconColor="text-blue-600"
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
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Lead Pipeline by Status</h3>
            <span className="ml-auto text-xs text-slate-400 font-medium">{totalLeads} total</span>
          </div>
          {statusEntries.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No leads yet.</p>
          ) : (
            <div className="space-y-3">
              {statusEntries.map(([status, count]) => (
                <HorizontalBar
                  key={status}
                  label={status.replace(/_/g, " ")}
                  count={count as number}
                  total={totalLeads}
                  colorClass="bg-blue-500"
                  badgeClass={STATUS_COLORS[status]}
                />
              ))}
            </div>
          )}
        </div>

        {/* By Source */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Lead Sources</h3>
            <span className="ml-auto text-xs text-slate-400 font-medium">{totalLeads} total</span>
          </div>
          {sourceEntries.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No leads yet.</p>
          ) : (
            <div className="space-y-3">
              {sourceEntries.map(([source, count]) => (
                <HorizontalBar
                  key={source}
                  label={source.replace(/_/g, " ")}
                  count={count as number}
                  total={totalLeads}
                  colorClass={SOURCE_COLORS[source] ?? "bg-slate-400"}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 3: Form Performance ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Form Performance</h3>
        </div>
        {formStats.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No forms created yet. Go to <strong>Forms</strong> to create your first booking widget.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Form Name</th>
                  <th className="py-3.5 px-4 text-right">Views</th>
                  <th className="py-3.5 px-4 text-right">Starts</th>
                  <th className="py-3.5 px-4 text-right">Submissions</th>
                  <th className="py-3.5 px-4 text-right">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formStats.map((f: any) => {
                  const rate = f.conversionRate as number;
                  const rateCls =
                    rate >= 20
                      ? "text-emerald-700 font-bold"
                      : rate >= 10
                      ? "text-amber-700 font-bold"
                      : "text-red-600 font-bold";
                  return (
                    <tr key={f.formId} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{f.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">/{f.slug}</p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                        {f.viewCount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                        {f.startCount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                        {f.submitCount.toLocaleString()}
                      </td>
                      <td className={`py-3.5 px-4 text-right ${rateCls}`}>{rate.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ROW 4: Top Services ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Top Services</h3>
          <span className="ml-auto text-xs text-slate-400 font-medium">by booking count</span>
        </div>
        {topServices.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">No service bookings recorded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {topServices.map((s: any, i: number) => (
              <div
                key={s.serviceId}
                className="relative bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs"
              >
                <span className="absolute top-3 right-3 text-[10px] font-extrabold text-slate-300">
                  #{i + 1}
                </span>
                <p className="font-bold text-slate-900 pr-6 leading-tight">{s.name}</p>
                <p className="text-emerald-700 font-extrabold text-lg mt-1">
                  {s.bookingCount.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500">bookings</p>
                <p className="text-xs font-bold text-slate-700 mt-2">{formatBDT(s.revenue)}</p>
                <p className="text-[11px] text-slate-400">revenue</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ROW 5: Booking Outcomes ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">Booking Outcomes</h3>
          <span className="ml-auto text-xs text-slate-400 font-medium">
            All-time · {(allTime.total ?? 0).toLocaleString()} total
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <OutcomePill
            label="Completed"
            count={allTime.completed ?? 0}
            icon={CheckCircle2}
            colorClass="bg-emerald-50 text-emerald-800 border-emerald-200"
          />
          <OutcomePill
            label="Confirmed"
            count={allTime.confirmed ?? 0}
            icon={CheckCircle2}
            colorClass="bg-teal-50 text-teal-800 border-teal-200"
          />
          <OutcomePill
            label="Pending"
            count={allTime.pending ?? 0}
            icon={Clock}
            colorClass="bg-amber-50 text-amber-800 border-amber-200"
          />
          <OutcomePill
            label="Cancelled"
            count={allTime.cancelled ?? 0}
            icon={XCircle}
            colorClass="bg-red-50 text-red-800 border-red-200"
          />
          <OutcomePill
            label="No-Show"
            count={allTime.noShow ?? 0}
            icon={AlertCircle}
            colorClass="bg-slate-100 text-slate-700 border-slate-200"
          />
        </div>

        {/* Last 30 days context */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
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
                className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border border-slate-200"
              >
                <span className="text-[11px] text-slate-500 font-semibold">{item.label}</span>
                <span className="text-sm font-extrabold text-slate-900">{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
