"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  Clock,
  Sparkles,
  Package,
  Gift,
  Star,
  Bell,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Plus,
  Phone,
  ShieldCheck,
  MapPin,
  Award,
  CreditCard,
  ChevronRight,
  LogOut,
  MessageSquare,
  X,
} from "lucide-react";

type PortalTab =
  | "appointments"
  | "book"
  | "packages"
  | "rewards"
  | "reviews"
  | "preferences";

export default function CustomerPortalPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "aura-glow-medspa";

  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [phoneInput, setPhoneInput] = useState("+8801711223344");
  const [activeTab, setActiveTab] = useState<PortalTab>("appointments");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "info" | "warning"; text: string } | null>(null);

  const [portalData, setPortalData] = useState<any>(null);

  // Modals / Interactive states
  const [rescheduleTarget, setRescheduleTarget] = useState<any | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("11:00 AM");

  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // New Booking Form state
  const [selectedServiceId, setSelectedServiceId] = useState("srv-1");
  const [selectedStaffName, setSelectedStaffName] = useState("Dr. Samira Rahman");
  const [bookingDate, setBookingDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
  );
  const [bookingTime, setBookingTime] = useState("02:00 PM");
  const [usePackageId, setUsePackageId] = useState<string>("");
  const [bookingNotes, setBookingNotes] = useState("");

  // Review Form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewService, setReviewService] = useState("HydraFacial MD & LED Glow Therapy");
  const [reviewStaff, setReviewStaff] = useState("Dr. Samira Rahman");

  async function loadPortal(phone = phoneInput) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/v1/portal/${encodeURIComponent(slug)}?phone=${encodeURIComponent(phone)}`
      );
      const data = await res.json();
      setPortalData(data);
      if (data?.services?.[0]?.id) {
        setSelectedServiceId(data.services[0].id);
        setReviewService(data.services[0].name);
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPortal();
  }, [slug]);

  function showToast(type: "success" | "info" | "warning", text: string) {
    setBanner({ type, text });
    setTimeout(() => setBanner(null), 5500);
  }

  async function handleBookAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!portalData) return;
    setSubmitting(true);
    try {
      const serviceObj =
        portalData.services.find((s: any) => s.id === selectedServiceId) ||
        portalData.services[0];

      const res = await fetch(`/api/v1/portal/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BOOK",
          phone: phoneInput,
          serviceId: serviceObj.id,
          serviceName: serviceObj.name,
          staffName: selectedStaffName,
          date: bookingDate,
          startTime: bookingTime,
          price: serviceObj.price,
          usePackageId: usePackageId || undefined,
          notes: bookingNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message);
        await loadPortal();
        setActiveTab("appointments");
        setUsePackageId("");
        setBookingNotes("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmReschedule() {
    if (!rescheduleTarget || !newDate) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/portal/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESCHEDULE",
          phone: phoneInput,
          bookingId: rescheduleTarget.id,
          newDate,
          newStartTime: newTime,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message);
        setRescheduleTarget(null);
        await loadPortal();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmCancel() {
    if (!cancelTarget) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/portal/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CANCEL",
          phone: phoneInput,
          bookingId: cancelTarget.id,
          reason: cancelReason,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.isLateCancel ? "warning" : "info", json.message);
        setCancelTarget(null);
        setCancelReason("");
        await loadPortal();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTogglePreference(key: string, value: boolean) {
    if (!portalData) return;
    const updated = {
      ...portalData.customer.communicationPrefs,
      [key]: value,
    };
    setPortalData({
      ...portalData,
      customer: {
        ...portalData.customer,
        communicationPrefs: updated,
      },
    });
    await fetch(`/api/v1/portal/${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "UPDATE_PREFERENCES",
        phone: phoneInput,
        preferences: updated,
      }),
    });
    showToast("success", "Communication preference updated.");
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/portal/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_REVIEW",
          phone: phoneInput,
          rating: reviewRating,
          comment: reviewComment,
          serviceName: reviewService,
          staffName: reviewStaff,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", json.message);
        setReviewComment("");
        await loadPortal();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8F8F6] text-[#181A1E] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <div className="w-12 h-12 rounded-[14px] bg-[#F5C94A] text-[#181A1E] flex items-center justify-center mb-5 font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#181A1E]">
            {portalData?.business?.name || "Customer Self-Serve Portal"}
          </h1>
          <p className="text-sm text-[#73767D] mt-1 mb-6">
            Sign in with your mobile number to manage appointments, packages, loyalty points, and gift cards.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#73767D] mb-1.5">
                Mobile Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#73767D] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  placeholder="+8801711223344"
                />
              </div>
            </div>
            <button
              onClick={() => {
                setIsAuthenticated(true);
                loadPortal(phoneInput);
              }}
              className="w-full py-3 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold text-sm transition"
            >
              Continue to My Portal
            </button>
            <button
              onClick={() => {
                setPhoneInput("+8801711223344");
                setIsAuthenticated(true);
                loadPortal("+8801711223344");
              }}
              className="w-full py-2.5 rounded-xl bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium text-xs border border-[#EAEAEA] transition"
            >
              1-Click Instant Demo Login (Nusrat Jahan · Gold Tier)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const business = portalData?.business || {
    name: "Aura Glow Studio & MedSpa",
    category: "Aesthetics & Wellness",
    address: "Gulshan-2, Dhaka",
    phone: "+880 1711-009988",
    cancellationPolicy: {
      freeCancelHours: 24,
      lateCancelFeePercent: 20,
      depositPercent: 25,
      policySummary:
        "Free rescheduling or full deposit refund up to 24 hours before appointment. Cancellations under 24 hours incur a 20% late fee.",
    },
  };

  const customer = portalData?.customer || {
    name: "Nusrat Jahan",
    phone: phoneInput,
    email: "nusrat.jahan@example.com",
    memberSince: "Jan 2025",
    totalVisits: 14,
    totalSpent: 48500,
    communicationPrefs: {
      whatsappOptIn: true,
      smsOptIn: true,
      emailOptIn: true,
      marketingOptIn: true,
    },
  };

  const upcomingBookings = portalData?.upcomingBookings || [];
  const pastBookings = portalData?.pastBookings || [];
  const packages = portalData?.packages || [];
  const loyalty = portalData?.loyalty || {
    pointsBalance: 1450,
    lifetimePoints: 3200,
    tier: "GOLD",
    nextTier: "PLATINUM",
    pointsToNextTier: 550,
    transactions: [],
  };
  const giftCards = portalData?.giftCards || [];
  const reviews = portalData?.reviews || [];

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#181A1E] pb-16">
      {/* Top Brand Header */}
      <header className="bg-white border-b border-[#EAEAEA] sticky top-0 z-30 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[14px] bg-[#F5C94A] text-[#181A1E] flex items-center justify-center font-bold text-lg">
              {business.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-[#181A1E]">{business.name}</h1>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]">
                  Verified Client Portal
                </span>
              </div>
              <p className="text-xs text-[#73767D] flex items-center gap-2 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#73767D]" />
                {business.address} · {business.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-[#181A1E]">{customer.name}</div>
              <div className="text-xs text-[#73767D]">
                {customer.phone} ·{" "}
                <span className="font-semibold text-[#5B4712]">{loyalty.tier} MEMBER</span>
              </div>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-3 py-2 rounded-xl border border-[#EAEAEA] bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] text-xs font-medium flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Switch Account
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Toast Banner */}
        {banner && (
          <div
            className={`p-4 rounded-[14px] border flex items-center justify-between text-sm font-medium ${
              banner.type === "success"
                ? "bg-[#E3F5EC] border-[#CBEAD9] text-[#184E37]"
                : banner.type === "warning"
                ? "bg-[#FBF3DC] border-[#F2E2B6] text-[#5B4712]"
                : "bg-[#E2F2FA] border-[#C4E3F5] text-[#174A67]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{banner.text}</span>
            </div>
            <button onClick={() => setBanner(null)} className="text-xs underline ml-4 hover:opacity-80">
              Dismiss
            </button>
          </div>
        )}

        {/* Quick Wallet Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
            <div className="flex items-center justify-between text-xs text-[#73767D] mb-1">
              <span>Upcoming Visits</span>
              <Calendar className="w-4 h-4 text-[#184E37]" />
            </div>
            <div className="text-2xl font-bold text-[#181A1E]">{upcomingBookings.length}</div>
            <div className="text-[11px] text-[#184E37] font-medium mt-1">
              24h Free Reschedule Active
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
            <div className="flex items-center justify-between text-xs text-[#73767D] mb-1">
              <span>Active Package Sessions</span>
              <Package className="w-4 h-4 text-[#174A67]" />
            </div>
            <div className="text-2xl font-bold text-[#181A1E]">
              {packages.reduce((acc: number, p: any) => acc + (p.remainingSessions || 0), 0)} left
            </div>
            <div className="text-[11px] text-[#174A67] font-medium mt-1">
              Across {packages.length} active plans
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
            <div className="flex items-center justify-between text-xs text-[#73767D] mb-1">
              <span>Loyalty Points ({loyalty.tier})</span>
              <Award className="w-4 h-4 text-[#5B4712]" />
            </div>
            <div className="text-2xl font-bold text-[#181A1E]">
              {loyalty.pointsBalance.toLocaleString()} pts
            </div>
            <div className="text-[11px] text-[#5B4712] font-medium mt-1">
              Worth ৳{Math.round(loyalty.pointsBalance * 0.5)} in rewards
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
            <div className="flex items-center justify-between text-xs text-[#73767D] mb-1">
              <span>Gift Card Balance</span>
              <Gift className="w-4 h-4 text-[#181A1E]" />
            </div>
            <div className="text-2xl font-bold text-[#181A1E]">
              ৳
              {giftCards
                .reduce((acc: number, g: any) => acc + Number(g.currentBalance || 0), 0)
                .toLocaleString()}
            </div>
            <div className="text-[11px] text-[#73767D] font-medium mt-1">
              {giftCards.length} active card(s) ready
            </div>
          </div>
        </div>

        {/* Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "appointments", label: "My Appointments", icon: Calendar },
            { id: "book", label: "Book Appointment", icon: Plus },
            { id: "packages", label: "Packages & Memberships", icon: Package },
            { id: "rewards", label: "Loyalty & Gift Cards", icon: Gift },
            { id: "reviews", label: "Leave a 5-Star Review", icon: Star },
            { id: "preferences", label: "Communication Prefs", icon: Bell },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PortalTab)}
                className={`px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 whitespace-nowrap transition ${
                  active
                    ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
                    : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium border border-[#EAEAEA]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: UPCOMING & PAST APPOINTMENTS */}
        {activeTab === "appointments" && (
          <div className="space-y-6">
            {/* Deposit & Cancellation Policy Callout */}
            <div className="bg-[#E2F2FA] border border-[#C4E3F5] rounded-[14px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#174A67] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#174A67]">
                    Transparent Deposit & Cancellation Protection
                  </h3>
                  <p className="text-xs text-[#174A67] mt-0.5">
                    {business.cancellationPolicy.policySummary}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("book")}
                className="px-4 py-2 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold shrink-0 transition"
              >
                + Book New Visit
              </button>
            </div>

            {/* Upcoming Bookings */}
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#181A1E]">
                  Upcoming Appointments ({upcomingBookings.length})
                </h2>
                <button
                  onClick={() => loadPortal()}
                  className="text-xs text-[#73767D] hover:text-[#181A1E] flex items-center gap-1 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8 text-[#73767D] text-sm">
                  No upcoming appointments scheduled. Click &ldquo;Book Appointment&rdquo; to reserve your next session!
                </div>
              ) : (
                <div className="grid gap-4">
                  {upcomingBookings.map((bk: any) => (
                    <div
                      key={bk.id}
                      className="rounded-[14px] bg-[#F8F8FA] border border-[#EAEAEA] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]">
                            {bk.status}
                          </span>
                          <span className="text-xs font-mono text-[#73767D]">
                            {bk.bookingNumber}
                          </span>
                          <span className="text-xs text-[#73767D]">· {bk.branchName}</span>
                        </div>
                        <h3 className="text-base font-bold text-[#181A1E]">{bk.serviceName}</h3>
                        <p className="text-xs text-[#73767D]">
                          Specialist: <span className="font-semibold text-[#181A1E]">{bk.staffName}</span> ·{" "}
                          <span className="font-semibold text-[#181A1E]">
                            {bk.date} at {bk.startTime}
                          </span>
                        </p>
                        {bk.notes && (
                          <p className="text-xs text-[#73767D] italic">&ldquo;{bk.notes}&rdquo;</p>
                        )}
                        <div className="flex items-center gap-4 pt-1 text-xs">
                          <span className="text-[#73767D]">
                            Service Fee: <strong className="text-[#181A1E]">৳{bk.price}</strong>
                          </span>
                          <span className="text-[#184E37] font-medium">
                            Deposit Paid: ৳{bk.depositPaid} (100% Refundable &gt;24h)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setRescheduleTarget(bk);
                            setNewDate(bk.date);
                            setNewTime(bk.startTime);
                          }}
                          className="px-3.5 py-2 rounded-xl border border-[#EAEAEA] bg-[#F3F1E8] hover:bg-[#EAE6D7] text-xs font-semibold text-[#262930] transition"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => setCancelTarget(bk)}
                          className="px-3.5 py-2 rounded-xl border border-[#F5BFC2] bg-[#FAD4D6] hover:bg-[#f5bfc2] text-xs font-semibold text-[#9E2A2B] transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Bookings */}
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
              <h2 className="text-base font-bold text-[#181A1E]">
                Past Visits & Receipts ({pastBookings.length})
              </h2>
              <div className="divide-y divide-[#EAEAEA]">
                {pastBookings.map((bk: any) => (
                  <div
                    key={bk.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#181A1E]">
                          {bk.serviceName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            bk.status === "COMPLETED"
                              ? "bg-[#E3F5EC] text-[#184E37] border-[#CBEAD9]"
                              : "bg-[#FAD4D6] text-[#9E2A2B] border-[#F5BFC2]"
                          }`}
                        >
                          {bk.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#73767D] mt-0.5">
                        {bk.date} · {bk.staffName} · Total: ৳{bk.price}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!bk.hasReviewed && bk.status === "COMPLETED" && (
                        <button
                          onClick={() => {
                            setReviewService(bk.serviceName);
                            setReviewStaff(bk.staffName);
                            setActiveTab("reviews");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6] text-xs font-semibold hover:bg-[#F2E2B6] transition"
                        >
                          ★ Leave Review (+50 pts)
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedServiceId(bk.serviceId || "srv-1");
                          setActiveTab("book");
                        }}
                        className="px-3 py-1.5 rounded-xl border border-[#EAEAEA] bg-[#F3F1E8] hover:bg-[#EAE6D7] text-xs font-medium text-[#262930] transition"
                      >
                        Book Again
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SELF-SERVE BOOKING */}
        {activeTab === "book" && (
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
            <h2 className="text-lg font-bold text-[#181A1E] mb-1">
              Book a New Appointment
            </h2>
            <p className="text-xs text-[#73767D] mb-6">
              Reserve online with instant confirmation. You can pay a 25% deposit or redeem an active Package/Membership session.
            </p>

            <form onSubmit={handleBookAppointment} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#73767D] mb-1.5">
                    Select Treatment / Service
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  >
                    {(portalData?.services || []).map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — ৳{s.price} ({s.duration}m)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#73767D] mb-1.5">
                    Preferred Specialist
                  </label>
                  <select
                    value={selectedStaffName}
                    onChange={(e) => setSelectedStaffName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  >
                    {(portalData?.staff || []).map((st: any) => (
                      <option key={st.id} value={st.name}>
                        {st.name} ({st.title})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#73767D] mb-1.5">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#73767D] mb-1.5">
                    Preferred Time Slot
                  </label>
                  <select
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  >
                    {[
                      "10:00 AM",
                      "11:00 AM",
                      "12:30 PM",
                      "02:00 PM",
                      "03:30 PM",
                      "05:00 PM",
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional Package Redemption */}
              <div className="p-4 rounded-[14px] bg-[#E2F2FA] border border-[#C4E3F5]">
                <label className="block text-xs font-bold text-[#174A67] uppercase tracking-wider mb-1.5">
                  Redeem Active Package / Membership Session (Optional)
                </label>
                <select
                  value={usePackageId}
                  onChange={(e) => setUsePackageId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#C4E3F5] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                >
                  <option value="">
                    Pay Standard 25% Deposit (Keep my package sessions for later)
                  </option>
                  {packages
                    .filter((p: any) => p.remainingSessions > 0)
                    .map((p: any) => (
                      <option key={p.id} value={p.id}>
                        Use 1 Session from {p.name} ({p.remainingSessions} sessions left — ৳0 Deposit Due)
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#73767D] mb-1.5">
                  Special Requests / Clinical Notes
                </label>
                <input
                  type="text"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Any skin sensitivities, pressure preferences, or allergies..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-[#73767D]">
                  {usePackageId ? (
                    <span className="text-[#184E37] font-semibold">
                      ✓ Covered by Package Session — ৳0 Deposit Required Today
                    </span>
                  ) : (
                    <span>
                      25% Booking Deposit Covered via Wallet ·{" "}
                      <strong className="text-[#181A1E]">Full refund if cancelled &gt;24h prior</strong>
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-sm font-semibold transition disabled:opacity-50"
                >
                  {submitting ? "Confirming..." : "Confirm Instant Booking"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: PACKAGES & MEMBERSHIPS */}
        {activeTab === "packages" && (
          <div className="space-y-4">
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
              <h2 className="text-lg font-bold text-[#181A1E] mb-1">
                My Packages & Recurring Memberships
              </h2>
              <p className="text-xs text-[#73767D] mb-5">
                Track remaining prepaid sessions and automatic membership renewals.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                {packages.map((pkg: any) => {
                  const used = pkg.totalSessions - pkg.remainingSessions;
                  const pct = Math.min(100, Math.round((used / pkg.totalSessions) * 100));
                  return (
                    <div
                      key={pkg.id}
                      className="rounded-[14px] bg-[#F8F8FA] border border-[#EAEAEA] p-5 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              pkg.type === "MEMBERSHIP"
                                ? "bg-[#E2F2FA] text-[#174A67] border-[#C4E3F5]"
                                : "bg-[#FBF3DC] text-[#5B4712] border-[#F2E2B6]"
                            }`}
                          >
                            {pkg.type === "MEMBERSHIP" ? "MONTHLY MEMBERSHIP" : "PREPAID BUNDLE"}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]">
                            {pkg.status}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[#181A1E]">{pkg.name}</h3>
                        <p className="text-xs text-[#73767D] mt-1">
                          Valid until {new Date(pkg.expiresAt).toLocaleDateString()} · Value ৳
                          {pkg.price.toLocaleString()}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#181A1E]">
                            {pkg.remainingSessions} of {pkg.totalSessions} sessions remaining
                          </span>
                          <span className="text-[#73767D]">{used} redeemed</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-[#F3F1E8] overflow-hidden">
                          <div
                            className="h-full bg-[#F5C94A] rounded-full transition-all"
                            style={{ width: `${100 - pct}%` }}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setUsePackageId(pkg.id);
                          setActiveTab("book");
                        }}
                        disabled={pkg.remainingSessions <= 0}
                        className="w-full py-2.5 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold text-xs disabled:opacity-50 transition"
                      >
                        Redeem 1 Session for New Booking →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LOYALTY POINTS & GIFT CARDS */}
        {activeTab === "rewards" && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Loyalty Card */}
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]">
                    {loyalty.tier} TIER REWARDS
                  </span>
                  <h2 className="text-xl font-bold text-[#181A1E] mt-1.5">
                    {loyalty.pointsBalance.toLocaleString()} Loyalty Points
                  </h2>
                  <p className="text-xs text-[#73767D] mt-0.5">
                    Lifetime Points: {loyalty.lifetimePoints.toLocaleString()} ·{" "}
                    {loyalty.pointsToNextTier} pts to {loyalty.nextTier}
                  </p>
                </div>
                <Award className="w-10 h-10 text-[#F5C94A]" />
              </div>

              <div className="space-y-2.5 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#73767D]">
                  Recent Points Activity
                </h3>
                <div className="divide-y divide-[#EAEAEA]">
                  {(loyalty.transactions || []).map((tx: any) => (
                    <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-[#181A1E]">{tx.description}</div>
                        <div className="text-[#73767D]">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span
                        className={`font-bold ${
                          tx.points > 0 ? "text-[#184E37]" : "text-[#9E2A2B]"
                        }`}
                      >
                        {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gift Cards */}
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#181A1E]">Digital Gift Cards</h2>
                  <p className="text-xs text-[#73767D] mt-0.5">
                    Automatically applied at checkout or deposit payment.
                  </p>
                </div>
                <CreditCard className="w-6 h-6 text-[#181A1E]" />
              </div>

              {giftCards.map((gc: any) => (
                <div
                  key={gc.id}
                  className="p-5 rounded-[14px] bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold tracking-wider bg-[#F3F1E8] border border-[#EAEAEA] text-[#262930] px-2.5 py-1 rounded-lg">
                      {gc.code}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]">
                      {gc.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-[#73767D]">Available Balance</div>
                    <div className="text-2xl font-bold text-[#181A1E]">
                      ৳{Number(gc.currentBalance).toLocaleString()}{" "}
                      <span className="text-xs font-normal text-[#73767D]">
                        / ৳{Number(gc.initialValue).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {gc.message && (
                    <p className="text-xs text-[#73767D] italic">
                      &ldquo;{gc.message}&rdquo; — From {gc.purchaserName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: LEAVE A 5-STAR REVIEW */}
        {activeTab === "reviews" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
              <h2 className="text-lg font-bold text-[#181A1E] mb-1">
                Share Your Experience (+50 Loyalty Points)
              </h2>
              <p className="text-xs text-[#73767D] mb-5">
                Your feedback helps our specialists deliver 5-star clinical care.
              </p>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#73767D] mb-2">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`p-2.5 rounded-xl border transition ${
                          reviewRating >= star
                            ? "bg-[#FBF3DC] border-[#F2E2B6] text-[#5B4712]"
                            : "border-[#EAEAEA] bg-[#F8F8FA] text-[#73767D]"
                        }`}
                      >
                        <Star className={`w-5 h-5 ${reviewRating >= star ? "fill-current text-[#F5C94A]" : "text-[#EAEAEA]"}`} />
                      </button>
                    ))}
                    <span className="text-sm font-bold text-[#181A1E] ml-2">
                      {reviewRating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#73767D] mb-1.5">
                    Service Reviewed
                  </label>
                  <input
                    type="text"
                    value={reviewService}
                    onChange={(e) => setReviewService(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#73767D] mb-1.5">
                    Your Review Comment
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us what you loved about your visit..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold text-sm transition disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Publish Review & Claim +50 Points"}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
              <h3 className="text-base font-bold text-[#181A1E]">
                My Submitted Reviews ({reviews.length})
              </h3>
              {reviews.map((rev: any) => (
                <div key={rev.id} className="p-4 rounded-[14px] bg-[#F8F8FA] border border-[#EAEAEA] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[#F5C94A]">
                      {Array.from({ length: rev.rating }).map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-[11px] text-[#73767D]">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#181A1E]">{rev.serviceName}</p>
                  <p className="text-xs text-[#73767D]">&ldquo;{rev.comment}&rdquo;</p>
                  {rev.reply && (
                    <div className="p-3 rounded-xl bg-white border border-[#EAEAEA] text-xs text-[#73767D] mt-2">
                      <strong className="text-[#184E37] block mb-0.5">
                        Response from {business.name}:
                      </strong>
                      {rev.reply}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: COMMUNICATION PREFERENCES */}
        {activeTab === "preferences" && (
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] max-w-2xl">
            <h2 className="text-lg font-bold text-[#181A1E] mb-1">
              WhatsApp, SMS & Email Notification Preferences
            </h2>
            <p className="text-xs text-[#73767D] mb-5">
              Control how {business.name} sends you appointment reminders, receipts, and VIP offers.
            </p>

            <div className="divide-y divide-[#EAEAEA]">
              {[
                {
                  key: "whatsappOptIn",
                  title: "WhatsApp Appointment Reminders & Instant Confirmations",
                  desc: "Receive interactive WhatsApp messages to confirm or reschedule in 1 tap.",
                },
                {
                  key: "smsOptIn",
                  title: "SMS Text Alerts (24-Hour & 2-Hour Notice)",
                  desc: "Backup SMS alerts when mobile data is unavailable.",
                },
                {
                  key: "emailOptIn",
                  title: "Email Invoices, Package Statements & Skincare Guides",
                  desc: "Detailed digital receipts and post-treatment care instructions.",
                },
                {
                  key: "marketingOptIn",
                  title: "VIP Seasonal Promotions & Secret Flash Coupons",
                  desc: "Early access to holiday bundles and bonus loyalty point weekends.",
                },
              ].map((item) => {
                const checked = Boolean(customer.communicationPrefs?.[item.key]);
                return (
                  <div key={item.key} className="py-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-[#181A1E]">{item.title}</div>
                      <div className="text-xs text-[#73767D] mt-0.5">{item.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePreference(item.key, !checked)}
                      className={`w-12 h-6 rounded-full transition p-0.5 ${
                        checked ? "bg-[#F5C94A]" : "bg-[#EAEAEA]"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition transform ${
                          checked ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* RESCHEDULE MODAL */}
      {rescheduleTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] max-w-md w-full p-6 space-y-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
            <h3 className="text-lg font-bold text-[#181A1E]">
              Reschedule Appointment {rescheduleTarget.bookingNumber}
            </h3>
            <p className="text-xs text-[#73767D]">
              {rescheduleTarget.serviceName} · Free rescheduling (&gt;24h notice). Your ৳
              {rescheduleTarget.depositPaid} deposit automatically transfers.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">New Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">New Time</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                >
                  {["10:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "04:30 PM"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRescheduleTarget(null)}
                className="px-4 py-2 rounded-xl border border-[#EAEAEA] bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] text-xs font-medium transition"
              >
                Keep Current Time
              </button>
              <button
                onClick={handleConfirmReschedule}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold transition"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL WITH FEE BREAKDOWN */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] max-w-md w-full p-6 space-y-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
            <div className="flex items-center gap-2 text-[#9E2A2B]">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-bold">Cancel {cancelTarget.bookingNumber}?</h3>
            </div>
            <div className="p-3.5 rounded-[14px] bg-[#F8F8FA] border border-[#EAEAEA] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#73767D]">Service Price:</span>
                <span className="font-semibold text-[#181A1E]">৳{cancelTarget.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#73767D]">Deposit Paid:</span>
                <span className="font-semibold text-[#181A1E]">৳{cancelTarget.depositPaid}</span>
              </div>
              <div className="flex justify-between text-[#184E37] font-semibold pt-1 border-t border-[#EAEAEA]">
                <span>Estimated Refund (&gt;24h policy):</span>
                <span>৳{cancelTarget.depositPaid} (100% Refund)</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                Reason for Cancellation (Optional)
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Schedule conflict, travelling, etc."
                className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 rounded-xl border border-[#EAEAEA] bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] text-xs font-medium transition"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={submitting}
                className="px-4 py-2 rounded-xl border border-[#F5BFC2] bg-[#FAD4D6] hover:bg-[#f5bfc2] text-[#9E2A2B] text-xs font-semibold transition"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
