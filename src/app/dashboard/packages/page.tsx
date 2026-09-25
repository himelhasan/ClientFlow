"use client";

import React, { useEffect, useState } from "react";
import {
  Package,
  TicketPercent,
  Plus,
  Users,
  CheckCircle2,
  Copy,
  Sparkles,
  TrendingUp,
  MinusCircle,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

export default function PackagesAndCouponsDashboard() {
  const [activeTab, setActiveTab] = useState<"packages" | "coupons">("packages");

  // Packages state
  const [plans, setPlans] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [pkgSummary, setPkgSummary] = useState<any>({
    activePlans: 3,
    activeEnrollments: 3,
    monthlyRecurringRevenue: 333200,
    totalRemainingSessions: 11,
  });

  // Coupons state
  const [coupons, setCoupons] = useState<any[]>([]);
  const [cpnSummary, setCpnSummary] = useState<any>({
    activeCoupons: 3,
    totalRedemptions: 158,
    totalRevenueAttributed: 643500,
  });

  const [banner, setBanner] = useState<string | null>(null);

  // Create Package Modal
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [planName, setPlanName] = useState("");
  const [planType, setPlanType] = useState<"PACKAGE" | "MEMBERSHIP">("PACKAGE");
  const [planPrice, setPlanPrice] = useState(18000);
  const [planSessions, setPlanSessions] = useState(5);
  const [planValidity, setPlanValidity] = useState(90);
  const [planDesc, setPlanDesc] = useState("");

  // Enroll Customer Modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollName, setEnrollName] = useState("Farzana Yasmin");
  const [enrollPhone, setEnrollPhone] = useState("+8801715998877");
  const [enrollPlanId, setEnrollPlanId] = useState("");

  // Create Coupon Modal
  const [showCreateCoupon, setShowCreateCoupon] = useState(false);
  const [cpnCode, setCpnCode] = useState("");
  const [cpnType, setCpnType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [cpnValue, setCpnValue] = useState(20);
  const [cpnMinSpend, setCpnMinSpend] = useState(2500);
  const [cpnLimit, setCpnLimit] = useState(100);
  const [cpnDesc, setCpnDesc] = useState("");

  function notify(msg: string) {
    setBanner(msg);
    setTimeout(() => setBanner(null), 5000);
  }

  async function loadAll() {
    try {
      const [pkgRes, cpnRes] = await Promise.all([
        fetch("/api/v1/packages"),
        fetch("/api/v1/coupons"),
      ]);
      const pkgData = await pkgRes.json();
      const cpnData = await cpnRes.json();

      if (pkgData.plans) {
        setPlans(pkgData.plans);
        setEnrollments(pkgData.enrollments || []);
        setPkgSummary(pkgData.summary || pkgSummary);
        if (!enrollPlanId && pkgData.plans[0]?.id) {
          setEnrollPlanId(pkgData.plans[0].id);
        }
      }
      if (cpnData.coupons) {
        setCoupons(cpnData.coupons);
        setCpnSummary(cpnData.summary || cpnSummary);
      }
    } catch {
      // Handled gracefully
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreatePlan(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: planName,
        type: planType,
        price: Number(planPrice),
        totalSessions: Number(planSessions),
        validityDays: Number(planValidity),
        billingInterval: planType === "MEMBERSHIP" ? "MONTHLY" : "ONE_TIME",
        description: planDesc,
      }),
    });
    const data = await res.json();
    if (data.success) {
      notify(data.message);
      setShowCreatePlan(false);
      setPlanName("");
      setPlanDesc("");
      await loadAll();
    }
  }

  async function handleEnrollCustomer(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ENROLL_CUSTOMER",
        customerName: enrollName,
        customerPhone: enrollPhone,
        packagePlanId: enrollPlanId,
      }),
    });
    const data = await res.json();
    if (data.success) {
      notify(data.message);
      setShowEnrollModal(false);
      await loadAll();
    }
  }

  async function handleRedeemSession(enrollmentId: string) {
    const res = await fetch("/api/v1/packages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "REDEEM_SESSION",
        enrollmentId,
      }),
    });
    const data = await res.json();
    if (data.success) {
      notify(data.message);
      await loadAll();
    }
  }

  async function handleCreateCoupon(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: cpnCode,
        discountType: cpnType,
        discountValue: Number(cpnValue),
        minSpend: Number(cpnMinSpend),
        usageLimit: Number(cpnLimit),
        description: cpnDesc,
      }),
    });
    const data = await res.json();
    if (data.success) {
      notify(data.message);
      setShowCreateCoupon(false);
      setCpnCode("");
      setCpnDesc("");
      await loadAll();
    }
  }

  async function handleDeleteCoupon(id: string) {
    await fetch(`/api/v1/coupons?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    notify("Promo code removed.");
    await loadAll();
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[#181A1E]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#184E37] bg-[#E3F5EC] border border-[#CBEAD9] px-2.5 py-1 rounded-full">
            Retention & Recurring Revenue
          </span>
          <h1 className="text-2xl font-bold text-[#181A1E] mt-2">
            Packages, Memberships & Promo Coupons
          </h1>
          <p className="text-sm text-[#73767D] mt-1">
            Sell multi-session bundles, recurring monthly memberships, and high-converting discount codes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "packages" ? (
            <>
              <button
                onClick={() => setShowEnrollModal(true)}
                className="px-4 py-2.5 rounded-xl border border-[#EAEAEA] bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium text-xs flex items-center gap-1.5 transition"
              >
                <Users className="w-4 h-4" /> Enroll Customer
              </button>
              <button
                onClick={() => setShowCreatePlan(true)}
                className="px-4 py-2.5 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" /> New Package / Membership
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowCreateCoupon(true)}
              className="px-4 py-2.5 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold text-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Create Promo Code
            </button>
          )}
        </div>
      </div>

      {banner && (
        <div className="p-4 rounded-[14px] bg-[#E3F5EC] border border-[#CBEAD9] text-[#184E37] text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{banner}</span>
          </div>
          <button onClick={() => setBanner(null)} className="text-xs underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EAEAEA] pb-3">
        <button
          onClick={() => setActiveTab("packages")}
          className={`px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition ${
            activeTab === "packages"
              ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
              : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium border border-[#EAEAEA]"
          }`}
        >
          <Package className="w-4 h-4" />
          1. Packages & Memberships ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab("coupons")}
          className={`px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition ${
            activeTab === "coupons"
              ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
              : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium border border-[#EAEAEA]"
          }`}
        >
          <TicketPercent className="w-4 h-4" />
          2. Coupons & Promotions ({coupons.length})
        </button>
      </div>

      {/* TAB 1: PACKAGES & MEMBERSHIPS */}
      {activeTab === "packages" && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
              <div className="text-xs text-[#73767D]">Active Plans & Bundles</div>
              <div className="text-2xl font-bold text-[#181A1E] mt-1">
                {pkgSummary.activePlans}
              </div>
              <div className="text-xs text-[#184E37] mt-1 font-medium">
                Prepaid + Recurring
              </div>
            </div>
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
              <div className="text-xs text-[#73767D]">Membership MRR</div>
              <div className="text-2xl font-bold text-[#181A1E] mt-1">
                ৳{Number(pkgSummary.monthlyRecurringRevenue).toLocaleString()}
              </div>
              <div className="text-xs text-[#5B4712] mt-1 font-medium">
                Predictable monthly cashflow
              </div>
            </div>
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
              <div className="text-xs text-[#73767D]">Enrolled Clients</div>
              <div className="text-2xl font-bold text-[#181A1E] mt-1">
                {plans.reduce((s, p) => s + (p.activeSubscribers || 0), 0)}
              </div>
              <div className="text-xs text-[#174A67] mt-1 font-medium">
                High repeat visit retention
              </div>
            </div>
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
              <div className="text-xs text-[#73767D]">Unredeemed Sessions Balance</div>
              <div className="text-2xl font-bold text-[#181A1E] mt-1">
                {pkgSummary.totalRemainingSessions} sessions
              </div>
              <div className="text-xs text-[#73767D] mt-1 font-medium">
                Auto-tracked in Client Portal
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        plan.type === "MEMBERSHIP"
                          ? "bg-[#E2F2FA] text-[#174A67] border-[#C4E3F5]"
                          : "bg-[#FBF3DC] text-[#5B4712] border-[#F2E2B6]"
                      }`}
                    >
                      {plan.type === "MEMBERSHIP"
                        ? `RECURRING (${plan.billingInterval})`
                        : "MULTI-SESSION BUNDLE"}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]">
                      {plan.totalSessions} Sessions
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#181A1E]">{plan.name}</h3>
                  <p className="text-xs text-[#73767D] mt-1">{plan.description}</p>
                </div>

                <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-between">
                  <div>
                    <div className="text-xl font-bold text-[#181A1E]">
                      ৳{Number(plan.price).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#73767D]">
                      Valid {plan.validityDays} days · {plan.activeSubscribers} active members
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEnrollPlanId(plan.id);
                      setShowEnrollModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold transition"
                  >
                    + Enroll Client
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Active Customer Enrollments & Session Deduction Table */}
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
            <h2 className="text-base font-bold text-[#181A1E]">
              Customer Package Enrollments & Session Tracker ({enrollments.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#EAEAEA] text-xs uppercase text-[#73767D]">
                    <th className="py-3 px-2">Customer</th>
                    <th className="py-3 px-2">Package / Membership</th>
                    <th className="py-3 px-2">Remaining Sessions</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Expires</th>
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {enrollments.map((enr) => {
                    const pct = Math.round((enr.remainingSessions / enr.totalSessions) * 100);
                    return (
                      <tr key={enr.id} className="hover:bg-[#F8F8FA] transition">
                        <td className="py-3.5 px-2">
                          <div className="font-semibold text-[#181A1E]">{enr.customerName}</div>
                          <div className="text-xs text-[#73767D]">{enr.customerPhone}</div>
                        </td>
                        <td className="py-3.5 px-2">
                          <div className="font-medium text-[#181A1E]">{enr.packageName}</div>
                          <span className="text-[10px] font-bold text-[#73767D]">{enr.type}</span>
                        </td>
                        <td className="py-3.5 px-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#181A1E]">
                              {enr.remainingSessions} / {enr.totalSessions}
                            </span>
                            <div className="w-24 h-2 rounded-full bg-[#F3F1E8] overflow-hidden">
                              <div
                                className="h-full bg-[#F5C94A]"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-2">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              enr.status === "ACTIVE"
                                ? "bg-[#E3F5EC] text-[#184E37] border-[#CBEAD9]"
                                : "bg-[#F3F1E8] text-[#262930] border-[#EAEAEA]"
                            }`}
                          >
                            {enr.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-xs text-[#73767D]">
                          {new Date(enr.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <button
                            onClick={() => handleRedeemSession(enr.id)}
                            disabled={enr.remainingSessions <= 0}
                            className="px-3 py-1.5 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold disabled:opacity-40 inline-flex items-center gap-1 transition"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                            Deduct 1 Session
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COUPONS & PROMOTIONS */}
      {activeTab === "coupons" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
              <div className="text-xs text-[#73767D]">Active Promo Codes</div>
              <div className="text-2xl font-bold text-[#181A1E] mt-1">
                {cpnSummary.activeCoupons}
              </div>
              <div className="text-xs text-[#184E37] mt-1 font-medium">
                Enabled on Booking Checkout
              </div>
            </div>
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
              <div className="text-xs text-[#73767D]">Total Coupon Redemptions</div>
              <div className="text-2xl font-bold text-[#181A1E] mt-1">
                {cpnSummary.totalRedemptions} uses
              </div>
              <div className="text-xs text-[#174A67] mt-1 font-medium">
                Tracked per campaign
              </div>
            </div>
            <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
              <div className="text-xs text-[#73767D]">Revenue Attributed to Coupons</div>
              <div className="text-2xl font-bold text-[#181A1E] mt-1">
                ৳{Number(cpnSummary.totalRevenueAttributed).toLocaleString()}
              </div>
              <div className="text-xs text-[#5B4712] mt-1 font-medium">
                Net booking value after discount
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {coupons.map((cpn) => (
              <div
                key={cpn.id}
                className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm px-3 py-1 rounded-xl bg-[#FBF3DC] border border-[#F2E2B6] text-[#5B4712]">
                        {cpn.code}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(cpn.code);
                          notify(`Copied promo code "${cpn.code}" to clipboard!`);
                        }}
                        className="p-1.5 rounded-lg hover:bg-[#F3F1E8] text-[#73767D] hover:text-[#181A1E] transition"
                        title="Copy Promo Code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteCoupon(cpn.id)}
                      className="p-1.5 rounded-lg hover:bg-[#FAD4D6] text-[#73767D] hover:text-[#9E2A2B] transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-lg font-bold text-[#181A1E]">
                    {cpn.discountType === "PERCENTAGE"
                      ? `${cpn.discountValue}% OFF`
                      : `৳${cpn.discountValue} FLAT OFF`}
                  </div>
                  <p className="text-xs text-[#73767D] mt-1">{cpn.description}</p>
                </div>

                <div className="pt-3 border-t border-[#EAEAEA] text-xs space-y-1.5 text-[#73767D]">
                  <div className="flex justify-between">
                    <span>Minimum Spend:</span>
                    <strong className="text-[#181A1E]">৳{cpn.minSpend}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Redemptions:</span>
                    <strong className="text-[#181A1E]">
                      {cpn.usedCount} {cpn.usageLimit ? `/ ${cpn.usageLimit}` : "(Unlimited)"}
                    </strong>
                  </div>
                  <div className="flex justify-between text-[#184E37] font-semibold">
                    <span>Revenue Impact:</span>
                    <span>৳{Number(cpn.revenueGenerated || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE PACKAGE / MEMBERSHIP MODAL */}
      {showCreatePlan && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] max-w-md w-full p-6 space-y-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#181A1E]">
                Create Package or Membership
              </h3>
              <button
                onClick={() => setShowCreatePlan(false)}
                className="p-1 rounded-lg text-[#73767D] hover:text-[#181A1E] hover:bg-[#F3F1E8] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Plan Type
                </label>
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                >
                  <option value="PACKAGE">Prepaid Multi-Session Bundle (One-Time)</option>
                  <option value="MEMBERSHIP">Recurring Monthly Membership</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Package / Membership Name
                </label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. 6-Session Laser Hair Removal Bundle"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Price (৳)
                  </label>
                  <input
                    type="number"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Sessions
                  </label>
                  <input
                    type="number"
                    value={planSessions}
                    onChange={(e) => setPlanSessions(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Valid Days
                  </label>
                  <input
                    type="number"
                    value={planValidity}
                    onChange={(e) => setPlanValidity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Included Perks / Description
                </label>
                <textarea
                  rows={2}
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                  placeholder="Describe included services and member perks..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePlan(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAEAEA] bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold transition"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENROLL CUSTOMER MODAL */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] max-w-md w-full p-6 space-y-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#181A1E]">
                Enroll Customer in Package
              </h3>
              <button
                onClick={() => setShowEnrollModal(false)}
                className="p-1 rounded-lg text-[#73767D] hover:text-[#181A1E] hover:bg-[#F3F1E8] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEnrollCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Select Plan
                </label>
                <select
                  value={enrollPlanId}
                  onChange={(e) => setEnrollPlanId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.totalSessions} sessions — ৳{p.price})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={enrollName}
                  onChange={(e) => setEnrollName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Customer Phone
                </label>
                <input
                  type="text"
                  value={enrollPhone}
                  onChange={(e) => setEnrollPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAEAEA] bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold transition"
                >
                  Confirm Enrollment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {showCreateCoupon && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] max-w-md w-full p-6 space-y-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#181A1E]">Create Promo Code</h3>
              <button
                onClick={() => setShowCreateCoupon(false)}
                className="p-1 rounded-lg text-[#73767D] hover:text-[#181A1E] hover:bg-[#F3F1E8] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCoupon} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Promo Code (Uppercase)
                </label>
                <input
                  type="text"
                  value={cpnCode}
                  onChange={(e) => setCpnCode(e.target.value.toUpperCase())}
                  placeholder="SUMMER25"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm font-mono uppercase focus:border-[#F5C94A] focus:outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Discount Type
                  </label>
                  <select
                    value={cpnType}
                    onChange={(e) => setCpnType(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    value={cpnValue}
                    onChange={(e) => setCpnValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Min Spend (৳)
                  </label>
                  <input
                    type="number"
                    value={cpnMinSpend}
                    onChange={(e) => setCpnMinSpend(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    value={cpnLimit}
                    onChange={(e) => setCpnLimit(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Campaign Description
                </label>
                <input
                  type="text"
                  value={cpnDesc}
                  onChange={(e) => setCpnDesc(e.target.value)}
                  placeholder="25% off summer facial treatments"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCoupon(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAEAEA] bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold transition"
                >
                  Launch Promo Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
