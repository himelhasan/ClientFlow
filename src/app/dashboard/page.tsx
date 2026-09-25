"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Loader2,
  MessageSquare,
  Calendar as CalendarIcon,
  CheckCircle2,
  X,
  Phone,
  UserCheck,
} from "lucide-react";

interface CalendarEvent {
  id: string;
  bookingNumber?: string;
  customerName: string;
  customerPhone?: string;
  serviceName: string;
  staffName?: string;
  dayIndex: number; // 0..3 relative to visible 4-day window
  dateStr: string;
  startHour: number; // 9..17
  durationHours: number; // 1 or 2
  timeLabel: string;
  notes?: string;
  status: string;
  theme: "mint" | "sky" | "amber" | "lavender";
}

const HOURS = [
  { hour: 9, label: "9 AM" },
  { hour: 10, label: "10 AM" },
  { hour: 11, label: "11 AM" },
  { hour: 12, label: "12 PM" },
  { hour: 13, label: "1 PM" },
  { hour: 14, label: "2 PM" },
  { hour: 15, label: "3 PM" },
  { hour: 16, label: "4 PM" },
  { hour: 17, label: "5 PM" },
];

const THEME_STYLES = {
  mint: {
    card: "bg-[#E3F5EC] border-[#CBEAD9] text-[#184E37]",
    badge: "bg-[#B8E6CE] text-[#135D3E]",
    sub: "text-[#3A6B56]",
    note: "text-[#2E5E49]",
  },
  sky: {
    card: "bg-[#E2F2FA] border-[#C4E3F5] text-[#174A67]",
    badge: "bg-[#B2DCF4] text-[#125173]",
    sub: "text-[#3B6985]",
    note: "text-[#446B84]",
  },
  amber: {
    card: "bg-[#FBF3DC] border-[#F2E2B6] text-[#5B4712]",
    badge: "bg-[#F2DF9F] text-[#695110]",
    sub: "text-[#7A6324]",
    note: "text-[#6D561C]",
  },
  lavender: {
    card: "bg-[#F3ECFA] border-[#E2D4F4] text-[#492C6B]",
    badge: "bg-[#DEC9F6] text-[#512E7A]",
    sub: "text-[#68498C]",
    note: "text-[#5B3D7C]",
  },
};

function formatShortDayHeader(date: Date): string {
  const dayNum = date.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${dayNum} ${monthNames[date.getMonth()]}, ${dayNames[date.getDay()]}`;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseHourFromTimeString(t: string): number {
  if (!t) return 10;
  const clean = t.trim().toUpperCase();
  if (clean.includes("AM") || clean.includes("PM")) {
    const [timePart, mer] = clean.split(/\s+/);
    let [h] = timePart.split(":").map(Number);
    if (mer === "PM" && h < 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;
    return Math.min(17, Math.max(9, h));
  }
  const [h] = clean.split(":").map(Number);
  return Number.isFinite(h) ? Math.min(17, Math.max(9, h)) : 10;
}

function format12HourRange(startTime: string, endTime?: string, durationMins = 60): string {
  const startH = parseHourFromTimeString(startTime);
  const endH = endTime
    ? parseHourFromTimeString(endTime)
    : startH + Math.max(1, Math.round(durationMins / 60));
  const fmt = (h: number) => {
    const suffix = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:00 ${suffix}`;
  };
  return `${fmt(startH)} - ${fmt(endH)}`;
}

function buildSparklinePath(buckets: number[]): string {
  const pts = Array.isArray(buckets) && buckets.length === 6 ? buckets : [0, 0, 0, 0, 0, 0];
  const maxVal = Math.max(...pts, 1);
  const xs = [8, 33, 58, 83, 108, 134];
  const coords = pts.map((val, idx) => {
    const y = Math.round(38 - (val / maxVal) * 28);
    return `${idx === 0 ? "M" : "L"}${xs[idx]} ${y}`;
  });
  return coords.join(" ");
}

export default function DashboardOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const todayDate = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState<Date>(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newBookingForm, setNewBookingForm] = useState({
    customerName: "",
    customerPhone: "",
    serviceId: "",
    date: toIsoDate(new Date()),
    startTime: "10:00",
    notes: "",
  });

  async function fetchStats() {
    try {
      const res = await fetch("/api/v1/dashboard/stats");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  const windowDays = useMemo(() => {
    return [0, 1, 2, 3].map((offset) => {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + offset);
      return d;
    });
  }, [selectedDate]);

  const bookedDateSet = useMemo(() => {
    const s = new Set<string>();
    (data?.calendarBookings || []).forEach((b: any) => {
      if (b.date) {
        s.add(toIsoDate(new Date(b.date)));
      }
    });
    return s;
  }, [data]);

  const miniCalendarCells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { day: number; currentMonth: boolean; date: Date }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        currentMonth: true,
        date: new Date(year, month, d),
      });
    }
    const remainder = (startOffset + cells.length) % 7;
    const nextDaysCount = remainder === 0 ? 0 : 7 - remainder;
    for (let n = 1; n <= nextDaysCount; n++) {
      cells.push({
        day: n,
        currentMonth: false,
        date: new Date(year, month + 1, n),
      });
    }
    return { startOffset, cells };
  }, [viewMonth]);

  const scheduledEvents = useMemo<CalendarEvent[]>(() => {
    const dbBookings: any[] = data?.calendarBookings || [];
    const themes: ("mint" | "sky" | "amber" | "lavender")[] = ["sky", "mint", "amber", "lavender"];

    const mappedDbEvents: CalendarEvent[] = [];
    dbBookings.forEach((b, idx) => {
      const bDate = new Date(b.date);
      const bIso = toIsoDate(bDate);
      const dayIdx = windowDays.findIndex((wd) => toIsoDate(wd) === bIso);
      if (dayIdx !== -1) {
        const startHour = parseHourFromTimeString(b.startTime);
        const durHours = Math.max(
          1,
          Math.round((b.durationMinutes || b.service?.durationMinutes || 60) / 60)
        );
        mappedDbEvents.push({
          id: b.id,
          bookingNumber: b.bookingNumber,
          customerName: b.customer?.name || "Customer",
          customerPhone: b.customer?.phone,
          serviceName: b.service?.name || "Service",
          staffName: b.staff?.name,
          dayIndex: dayIdx,
          dateStr: bIso,
          startHour,
          durationHours: durHours > 1 ? 2 : 1,
          timeLabel: format12HourRange(b.startTime, b.endTime, b.durationMinutes),
          notes: b.notes || undefined,
          status: b.status || "CONFIRMED",
          theme:
            b.status === "PENDING"
              ? "amber"
              : b.status === "COMPLETED"
              ? "mint"
              : themes[idx % themes.length],
        });
      }
    });

    return mappedDbEvents.filter((ev) => {
      if (statusFilter !== "ALL" && ev.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        ev.customerName.toLowerCase().includes(q) ||
        ev.serviceName.toLowerCase().includes(q) ||
        (ev.notes && ev.notes.toLowerCase().includes(q)) ||
        (ev.staffName && ev.staffName.toLowerCase().includes(q))
      );
    });
  }, [data, windowDays, searchQuery, statusFilter]);

  async function handleStatusUpdate(bookingId: string, newStatus: string) {
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/v1/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });
      if (res.ok) {
        await fetchStats();
        setSelectedEvent(null);
      }
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleCreateBooking(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingBooking(true);
    try {
      const servicesList = data?.services || [];
      const chosenService =
        servicesList.find((s: any) => s.id === newBookingForm.serviceId) || servicesList[0];
      if (!chosenService) {
        alert("Please add an active Service in the Services tab first.");
        return;
      }

      const [h, m] = newBookingForm.startTime.split(":").map(Number);
      const endMins = h * 60 + m + (chosenService.durationMinutes || 60);
      const endTime = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(
        endMins % 60
      ).padStart(2, "0")}`;

      const res = await fetch("/api/v1/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newBookingForm,
          serviceId: chosenService.id,
          endTime,
        }),
      });
      if (res.ok) {
        setShowNewModal(false);
        setNewBookingForm({
          customerName: "",
          customerPhone: "",
          serviceId: "",
          date: toIsoDate(selectedDate),
          startTime: "10:00",
          notes: "",
        });
        await fetchStats();
      } else {
        const err = await res.json();
        alert(err.error || "Could not create appointment");
      }
    } finally {
      setSubmittingBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-[#181A1E]" strokeWidth={1.75} />
        <p className="text-xs font-medium text-[#73767D]">Loading workspace data...</p>
      </div>
    );
  }

  const {
    metrics,
    quota,
    latestBooking,
    upcomingBookings = [],
    calendarBookings = [],
    recentLeads = [],
    services = [],
  } = data || {};

  const todayCount = metrics?.todayBookings ?? 0;
  const nextAppt = upcomingBookings[0];
  const nextApptText = nextAppt
    ? `Next: ${nextAppt.startTime} - ${nextAppt.service?.name || "Appointment"} with ${nextAppt.customer?.name}`
    : "No upcoming appointments today";

  const totalAppointmentsCount = metrics?.totalBookings ?? 0;
  const latestBookingText = latestBooking
    ? `Latest: ${formatShortDayHeader(new Date(latestBooking.date)).split(",")[0]}-${latestBooking.startTime}`
    : "No appointments recorded yet";

  const formattedRev = metrics?.totalRevenue ?? "৳0";
  const revDelta = metrics?.revenueDeltaPct ?? 0;
  const sparklinePath = buildSparklinePath(metrics?.revenueBuckets || [0, 0, 0, 0, 0, 0]);

  const monthNamesFull = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const leadPct = Math.min(
    100,
    Math.round(((quota?.leadsUsed ?? 0) / Math.max(1, quota?.leadQuota ?? 50)) * 100)
  );
  const waPct = Math.min(
    100,
    Math.round(((quota?.whatsappUsed ?? 0) / Math.max(1, quota?.whatsappQuota ?? 150)) * 100)
  );

  return (
    <div className="space-y-6 pb-10">
      {/* =====================================================================
          TOP ROW: 4 METRIC CARDS (1 row Desktop, 2x2 Tablet, 1 col Mobile)
          ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Card 1: Today's Appointments */}
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-5 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-[#181A1E] tracking-tight">
              Today&apos;s Appointments
            </h2>
            <Link
              href="/dashboard/bookings"
              className="w-8 h-8 rounded-full border border-[#F5C94A] bg-white hover:bg-[#F5C94A] flex items-center justify-center text-[#181A1E] transition-colors shrink-0"
              title="Open Appointments"
            >
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
            </Link>
          </div>

          <div className="bg-[#F8F8FA] rounded-[14px] p-4 mt-4 flex flex-col justify-between min-h-[132px]">
            <p className="text-[12.5px] text-[#73767D] font-medium truncate">
              {nextApptText}
            </p>
            <div className="pt-4">
              <div className="text-[32px] font-bold text-[#181A1E] leading-none tracking-tight">
                {String(todayCount).padStart(2, "0")}
              </div>
              <p className="text-[12px] text-[#73767D] font-medium mt-1.5">
                Appointments Today
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Total Appointments */}
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-5 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-[#181A1E] tracking-tight">
              Total Appointments
            </h2>
            <Link
              href="/dashboard/bookings"
              className="w-8 h-8 rounded-full border border-[#F5C94A] bg-white hover:bg-[#F5C94A] flex items-center justify-center text-[#181A1E] transition-colors shrink-0"
              title="View All Appointments"
            >
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
            </Link>
          </div>

          <div className="bg-[#F8F8FA] rounded-[14px] p-4 mt-4 flex flex-col justify-between min-h-[132px]">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12.5px] text-[#73767D] font-medium truncate">
                {latestBookingText}
              </p>
              {metrics?.pendingBookings > 0 && (
                <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-[#FBF3DC] text-[#5B4712]">
                  {metrics.pendingBookings} pending
                </span>
              )}
            </div>
            <div className="pt-4">
              <div className="text-[32px] font-bold text-[#181A1E] leading-none tracking-tight">
                {totalAppointmentsCount}
              </div>
              <p className="text-[12px] text-[#73767D] font-medium mt-1.5">
                Total Appointments
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Revenue This Month */}
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-5 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-[#181A1E] tracking-tight">
              Revenue This Month
            </h2>
            <Link
              href="/dashboard/quotes"
              className="w-8 h-8 rounded-full border border-[#F5C94A] bg-white hover:bg-[#F5C94A] flex items-center justify-center text-[#181A1E] transition-colors shrink-0"
              title="Revenue & Quotes"
            >
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
            </Link>
          </div>

          <div className="bg-[#F8F8FA] rounded-[14px] p-4 mt-4 flex flex-col justify-between min-h-[132px] relative overflow-hidden">
            <div className="flex justify-end -mt-1 -mr-1">
              <svg
                viewBox="0 0 140 48"
                className="w-32 h-11 overflow-visible"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d={sparklinePath}
                  stroke={revDelta < 0 ? "#E04F5F" : "#188659"}
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[28px] font-bold text-[#181A1E] leading-none tracking-tight">
                  {formattedRev}
                </span>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    revDelta < 0
                      ? "bg-[#FAD4D6] text-[#9E2A2B]"
                      : "bg-[#E3F5EC] text-[#184E37]"
                  }`}
                >
                  {revDelta > 0 ? `+${revDelta}%` : `${revDelta}%`}
                </span>
              </div>
              <p className="text-[12px] text-[#73767D] font-medium mt-1.5">
                {revDelta < 0
                  ? `${revDelta}% Less than last month`
                  : revDelta > 0
                  ? `+${revDelta}% Higher than last month`
                  : `Last month: ${metrics?.lastMonthRevenue || "৳0"}`}
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: New Enquiries */}
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-5 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-[#181A1E] tracking-tight">
              New Enquiries
            </h2>
            <Link
              href="/dashboard/leads"
              className="w-8 h-8 rounded-full border border-[#F5C94A] bg-white hover:bg-[#F5C94A] flex items-center justify-center text-[#181A1E] transition-colors shrink-0"
              title="Open Enquiries Pipeline"
            >
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
            </Link>
          </div>

          <div className="bg-[#F8F8FA] rounded-[14px] p-4 mt-4 flex flex-col justify-between min-h-[132px] overflow-hidden">
            {recentLeads.length === 0 ? (
              <div className="h-full flex flex-col justify-between">
                <p className="text-[12px] text-[#73767D] leading-relaxed">
                  No customer enquiries captured yet.
                </p>
                <div className="pt-3">
                  <Link
                    href="/dashboard/leads"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#181A1E] bg-[#F5C94A] px-3 py-1.5 rounded-xl hover:bg-[#EBBF3E] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                    Add Enquiry
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentLeads.slice(0, 2).map((lead: any, idx: number) => (
                  <div
                    key={lead.id}
                    className={idx > 0 ? "pt-1.5 border-t border-[#EAEAEA]" : ""}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-[#181A1E] leading-tight truncate">
                        {lead.customer?.name || "Customer"}
                      </p>
                      {lead.source && (
                        <span className="text-[9.5px] font-medium uppercase tracking-wider text-[#73767D] bg-[#EFECE4] px-1.5 py-0.5 rounded-md">
                          {lead.source}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[11.5px] leading-[1.35] mt-0.5 ${
                        idx === 0
                          ? "text-[#73767D] line-clamp-2"
                          : "text-[#9A9EA6] line-clamp-1"
                      }`}
                    >
                      {lead.notes || lead.title || lead.customer?.phone || "No additional notes"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================
          BOTTOM SECTION: SCHEDULED APPOINTMENTS SPLIT CALENDAR INTERFACE
          ===================================================================== */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[16px] font-semibold text-[#181A1E] tracking-tight">
              Scheduled Appointments{" "}
              <sup className="text-[11px] font-semibold text-[#73767D] ml-0.5 -top-1.5">
                ({calendarBookings.length})
              </sup>
            </h2>
            {calendarBookings.length > 0 && scheduledEvents.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  const target = new Date(
                    (upcomingBookings[0] || calendarBookings[0]).date
                  );
                  if (!isNaN(target.getTime())) {
                    setSelectedDate(target);
                    setViewMonth(new Date(target.getFullYear(), target.getMonth(), 1));
                  }
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#181A1E] bg-[#F3F1E8] hover:bg-[#EAE6D7] px-3 py-1 rounded-full transition-colors"
              >
                <CalendarIcon className="w-3 h-3" strokeWidth={1.75} />
                Jump to next booked date
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setNewBookingForm((prev) => ({
                  ...prev,
                  date: toIsoDate(selectedDate),
                  serviceId: services[0]?.id || "",
                }));
                setShowNewModal(true);
              }}
              className="px-4 py-2 rounded-full bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>New Appointment</span>
            </button>
            <Link
              href="/dashboard/bookings"
              className="w-8 h-8 rounded-full border border-[#F5C94A] bg-white hover:bg-[#F5C94A] flex items-center justify-center text-[#181A1E] transition-colors"
              title="Expand Full Bookings Table"
            >
              <ArrowUpRight className="w-4 h-4" strokeWidth={1.75} />
            </Link>
          </div>
        </div>

        {/* Split Calendar Body */}
        <div className="grid grid-cols-1 lg:grid-cols-[248px_1fr] gap-8 mt-6 items-start">
          {/* LEFT COLUMN: Mini Month Calendar + Workspace Quota */}
          <div className="space-y-6">
            <div className="px-1 select-none">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-semibold text-[#181A1E]">
                  {monthNamesFull[viewMonth.getMonth()]} {viewMonth.getFullYear()}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setViewMonth(
                        new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1)
                      )
                    }
                    className="w-6 h-6 rounded-md hover:bg-[#F3F1E8] flex items-center justify-center text-[#73767D] transition-colors"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setViewMonth(
                        new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1)
                      )
                    }
                    className="w-6 h-6 rounded-md hover:bg-[#F3F1E8] flex items-center justify-center text-[#73767D] transition-colors"
                    title="Next Month"
                  >
                    <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center text-[11px] font-medium text-[#73767D] mb-2">
                <span>MO</span>
                <span>TU</span>
                <span>WE</span>
                <span>TH</span>
                <span>FR</span>
                <span>SA</span>
                <span>SU</span>
              </div>

              <div className="grid grid-cols-7 gap-y-1.5 text-center">
                {Array.from({ length: miniCalendarCells.startOffset }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="w-8 h-8 mx-auto" />
                ))}

                {miniCalendarCells.cells.map((cell, idx) => {
                  const cellIso = toIsoDate(cell.date);
                  const isSelected =
                    cell.currentMonth && cellIso === toIsoDate(selectedDate);
                  const isToday =
                    cell.currentMonth && !isSelected && cellIso === toIsoDate(todayDate);
                  const hasBookings = bookedDateSet.has(cellIso);

                  return (
                    <button
                      key={`${cell.day}-${idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedDate(cell.date);
                        if (!cell.currentMonth) {
                          setViewMonth(
                            new Date(cell.date.getFullYear(), cell.date.getMonth(), 1)
                          );
                        }
                      }}
                      className={`w-8 h-8 mx-auto flex flex-col items-center justify-center text-[12px] rounded-[8px] transition-colors relative ${
                        !cell.currentMonth
                          ? "text-[#C5C8CE] font-normal hover:bg-[#F8F8FA]"
                          : isSelected
                          ? "bg-[#118AEF] text-white font-semibold"
                          : isToday
                          ? "border border-[#1D9BF0] text-[#181A1E] font-semibold bg-white"
                          : "text-[#181A1E] font-medium hover:bg-[#F3F1E8]"
                      }`}
                    >
                      <span>{cell.day}</span>
                      {hasBookings && (
                        <span
                          className={`w-1 h-1 rounded-full absolute bottom-1 ${
                            isSelected ? "bg-white" : "bg-[#118AEF]"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Workspace Quota Summary */}
            <div className="bg-[#F8F8FA] border border-[#EAEAEA] rounded-[16px] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#73767D]">
                  Workspace Quota
                </span>
                <Link
                  href="/dashboard/settings"
                  className="text-[11px] font-semibold text-[#181A1E] hover:underline"
                >
                  {data?.business?.subscriptionPlan || "Starter"} Plan
                </Link>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-[#73767D]">Lead Allowance</span>
                  <span className="font-semibold text-[#181A1E]">
                    {quota?.leadsUsed ?? 0} / {quota?.leadQuota ?? 50}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#EAEAEA] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#F5C94A]"
                    style={{ width: `${leadPct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-[#73767D]">WhatsApp Utility</span>
                  <span className="font-semibold text-[#181A1E]">
                    {quota?.whatsappUsed ?? 0} / {quota?.whatsappQuota ?? 150}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#EAEAEA] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#188659]"
                    style={{ width: `${waPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Schedule Grid */}
          <div className="bg-[#F8F8FA] rounded-[16px] p-4 border border-[#EAEAEA] min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="w-full sm:w-80 bg-white border border-[#EAEAEA] rounded-[12px] px-3.5 py-2 flex items-center gap-2 focus-within:border-[#F5C94A] transition-colors">
                <Search className="w-4 h-4 text-[#73767D] shrink-0" strokeWidth={1.75} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-transparent text-xs text-[#181A1E] placeholder:text-[#73767D] focus:outline-none border-0 p-0"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-[#73767D] hover:text-[#181A1E]"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto">
                {["ALL", "CONFIRMED", "PENDING", "COMPLETED"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-[10px] text-[11px] font-semibold transition-colors ${
                      statusFilter === st
                        ? "bg-[#F5C94A] text-[#181A1E]"
                        : "bg-white text-[#73767D] border border-[#EAEAEA] hover:bg-[#F3F1E8]"
                    }`}
                  >
                    {st === "ALL"
                      ? "All"
                      : st.charAt(0) + st.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[14px] border border-[#EAEAEA] overflow-x-auto">
              <div className="min-w-[740px]">
                {/* Day Header Strip */}
                <div className="grid grid-cols-[82px_repeat(4,minmax(160px,1fr))] border-b border-[#EAEAEA]">
                  <div className="h-10 bg-[#FAFAFC] border-r border-[#EAEAEA] flex items-center justify-center gap-3 text-[#73767D]">
                    <button
                      type="button"
                      onClick={() => {
                        const prev = new Date(selectedDate);
                        prev.setDate(prev.getDate() - 1);
                        setSelectedDate(prev);
                      }}
                      className="p-1 rounded hover:bg-[#F3F1E8] transition-colors"
                      title="Previous Day"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = new Date(selectedDate);
                        next.setDate(next.getDate() + 1);
                        setSelectedDate(next);
                      }}
                      className="p-1 rounded hover:bg-[#F3F1E8] transition-colors"
                      title="Next Day"
                    >
                      <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                    </button>
                  </div>

                  {windowDays.map((day, idx) => (
                    <div
                      key={idx}
                      className="h-10 bg-[#F6E3A5] text-[#181A1E] text-[12.5px] font-semibold flex items-center justify-center border-r last:border-r-0 border-[#EAEAEA]"
                    >
                      {formatShortDayHeader(day)}
                    </div>
                  ))}
                </div>

                {/* Time Rows */}
                {HOURS.map(({ hour, label }) => {
                  return (
                    <div
                      key={hour}
                      className="grid grid-cols-[82px_repeat(4,minmax(160px,1fr))] border-b last:border-b-0 border-[#EAEAEA]"
                    >
                      <div className="py-6 px-2 text-center text-[12px] font-semibold text-[#181A1E] border-r border-[#EAEAEA] bg-white select-none">
                        {label}
                      </div>

                      {[0, 1, 2, 3].map((dayIdx) => {
                        const coveredByPrev = scheduledEvents.some(
                          (ev) =>
                            ev.dayIndex === dayIdx &&
                            ev.startHour === hour - 1 &&
                            ev.durationHours >= 2
                        );

                        const eventsStartingHere = scheduledEvents.filter(
                          (ev) => ev.dayIndex === dayIdx && ev.startHour === hour
                        );

                        return (
                          <div
                            key={dayIdx}
                            className="border-r last:border-r-0 border-[#EAEAEA] p-1.5 relative min-h-[88px] group"
                          >
                            {!coveredByPrev && eventsStartingHere.length === 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setNewBookingForm({
                                    customerName: "",
                                    customerPhone: "",
                                    serviceId: services[0]?.id || "",
                                    date: toIsoDate(windowDays[dayIdx]),
                                    startTime: `${String(hour).padStart(2, "0")}:00`,
                                    notes: "",
                                  });
                                  setShowNewModal(true);
                                }}
                                className="w-full h-full min-h-[74px] rounded-[12px] opacity-0 group-hover:opacity-100 hover:bg-[#F8F8F6] border border-dashed border-[#EAEAEA] flex items-center justify-center text-[11px] font-medium text-[#73767D] transition-opacity"
                              >
                                + Book {label}
                              </button>
                            )}

                            {eventsStartingHere.map((ev) => {
                              const style = THEME_STYLES[ev.theme];
                              const isTwoHour = ev.durationHours >= 2;

                              return (
                                <div
                                  key={ev.id}
                                  onClick={() => setSelectedEvent(ev)}
                                  className={`${style.card} border rounded-[14px] p-3 cursor-pointer transition-colors flex flex-col justify-between ${
                                    isTwoHour
                                      ? "min-h-[168px] z-10 relative"
                                      : "min-h-[76px]"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-start gap-2.5">
                                      <div
                                        className={`w-7 h-7 rounded-full ${style.badge} flex items-center justify-center shrink-0 mt-0.5`}
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[12.5px] font-semibold leading-tight truncate">
                                          {ev.customerName}
                                        </p>
                                        <p
                                          className={`text-[11px] ${style.sub} leading-tight truncate mt-0.5`}
                                        >
                                          {ev.serviceName}
                                        </p>
                                      </div>
                                    </div>

                                    <p className="text-[10.5px] font-semibold mt-2.5 tracking-tight">
                                      {ev.timeLabel}
                                    </p>
                                  </div>

                                  {ev.notes && (
                                    <p
                                      className={`text-[11px] ${style.note} leading-[1.35] mt-2.5 line-clamp-2`}
                                    >
                                      &ldquo;{ev.notes}&rdquo;
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODAL 1: APPOINTMENT INSPECTION
          ===================================================================== */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] max-w-md w-full p-6 shadow-[0_12px_32px_-8px_rgba(24,24,27,0.12)] space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10.5px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F3F1E8] text-[#181A1E]">
                  {selectedEvent.status}
                </span>
                <h3 className="text-lg font-bold text-[#181A1E] mt-2">
                  {selectedEvent.customerName}
                </h3>
                <p className="text-xs text-[#73767D] font-medium">
                  {selectedEvent.serviceName} · {selectedEvent.timeLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8 rounded-full bg-[#F8F8FA] hover:bg-[#F3F1E8] flex items-center justify-center text-[#73767D]"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="bg-[#F8F8FA] rounded-[14px] p-4 space-y-2 text-xs border border-[#EAEAEA]">
              {selectedEvent.customerPhone && (
                <div className="flex items-center gap-2 text-[#181A1E]">
                  <Phone className="w-3.5 h-3.5 text-[#73767D]" strokeWidth={1.75} />
                  <span className="font-mono">{selectedEvent.customerPhone}</span>
                </div>
              )}
              {selectedEvent.staffName && (
                <div className="flex items-center gap-2 text-[#181A1E]">
                  <UserCheck className="w-3.5 h-3.5 text-[#73767D]" strokeWidth={1.75} />
                  <span>Assigned Specialist: {selectedEvent.staffName}</span>
                </div>
              )}
              {selectedEvent.notes && (
                <p className="text-[#73767D] italic pt-1 border-t border-[#EAEAEA]">
                  &ldquo;{selectedEvent.notes}&rdquo;
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusUpdate(selectedEvent.id, "CONFIRMED")}
                  className="px-3.5 py-2 rounded-xl bg-[#E3F5EC] hover:bg-[#CBEAD9] text-[#184E37] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Confirm
                </button>
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusUpdate(selectedEvent.id, "COMPLETED")}
                  className="px-3.5 py-2 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold transition-colors"
                >
                  Mark Completed
                </button>
              </div>

              <Link
                href="/dashboard/bookings"
                className="text-xs font-semibold text-[#73767D] hover:text-[#181A1E] underline"
              >
                Full Booking Record
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: SCHEDULE NEW APPOINTMENT
          ===================================================================== */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateBooking}
            className="bg-white rounded-[20px] border border-[#EAEAEA] max-w-md w-full p-6 shadow-[0_12px_32px_-8px_rgba(24,24,27,0.12)] space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#181A1E]">
                  Schedule New Appointment
                </h3>
                <p className="text-xs text-[#73767D]">
                  Saves directly to your workspace database
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="w-8 h-8 rounded-full bg-[#F8F8FA] hover:bg-[#F3F1E8] flex items-center justify-center text-[#73767D]"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Client Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newBookingForm.customerName}
                  onChange={(e) =>
                    setNewBookingForm({ ...newBookingForm, customerName: e.target.value })
                  }
                  placeholder="Enter client name"
                  className="w-full rounded-xl border border-[#EAEAEA] bg-[#F8F8FA] px-3.5 py-2 text-xs text-[#181A1E] focus:outline-none focus:border-[#F5C94A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Phone / WhatsApp Number *
                </label>
                <input
                  type="text"
                  required
                  value={newBookingForm.customerPhone}
                  onChange={(e) =>
                    setNewBookingForm({ ...newBookingForm, customerPhone: e.target.value })
                  }
                  placeholder="01XXXXXXXXX"
                  className="w-full rounded-xl border border-[#EAEAEA] bg-[#F8F8FA] px-3.5 py-2 text-xs text-[#181A1E] focus:outline-none focus:border-[#F5C94A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newBookingForm.date}
                    onChange={(e) =>
                      setNewBookingForm({ ...newBookingForm, date: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#EAEAEA] bg-[#F8F8FA] px-3 py-2 text-xs text-[#181A1E] focus:outline-none focus:border-[#F5C94A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Time Slot *
                  </label>
                  <select
                    value={newBookingForm.startTime}
                    onChange={(e) =>
                      setNewBookingForm({ ...newBookingForm, startTime: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#EAEAEA] bg-[#F8F8FA] px-3 py-2 text-xs text-[#181A1E] focus:outline-none focus:border-[#F5C94A]"
                  >
                    {HOURS.map((h) => (
                      <option
                        key={h.hour}
                        value={`${String(h.hour).padStart(2, "0")}:00`}
                      >
                        {h.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {services.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Service *
                  </label>
                  <select
                    value={newBookingForm.serviceId}
                    onChange={(e) =>
                      setNewBookingForm({ ...newBookingForm, serviceId: e.target.value })
                    }
                    className="w-full rounded-xl border border-[#EAEAEA] bg-[#F8F8FA] px-3.5 py-2 text-xs text-[#181A1E] focus:outline-none focus:border-[#F5C94A]"
                  >
                    {services.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.durationMinutes} mins)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Client Enquiry / Notes
                </label>
                <textarea
                  rows={2}
                  value={newBookingForm.notes}
                  onChange={(e) =>
                    setNewBookingForm({ ...newBookingForm, notes: e.target.value })
                  }
                  placeholder="Optional appointment notes"
                  className="w-full rounded-xl border border-[#EAEAEA] bg-[#F8F8FA] px-3.5 py-2 text-xs text-[#181A1E] focus:outline-none focus:border-[#F5C94A]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-xl bg-[#F3F1E8] text-xs font-semibold text-[#262930]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingBooking}
                className="px-4 py-2 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-xs font-semibold text-[#181A1E] flex items-center gap-1.5"
              >
                {submittingBooking && <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />}
                Save Appointment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
