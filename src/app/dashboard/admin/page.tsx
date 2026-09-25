"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Building2,
  TrendingUp,
  Users,
  Calendar,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { formatBDT, formatBdDate } from "@/lib/utils/bangladesh";

const PLANS = ["Starter", "Growth", "Pro", "Enterprise"];

export default function SuperAdminPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadTenants() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/tenants");
      const data = await res.json();
      setBusinesses(data.businesses || []);
      setStats(data.platformStats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  async function updateTenant(tenantId: string, payload: Record<string, any>) {
    setUpdatingId(tenantId);
    try {
      const res = await fetch("/api/v1/admin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, ...payload }),
      });
      if (res.ok) {
        await loadTenants();
      }
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
              Super Admin Console
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Platform-wide SaaS governance: manage all registered business tenants, subscription tiers, and monthly quota allowances.
          </p>
        </div>
      </div>

      {/* Platform KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-xs font-bold text-slate-400 uppercase">
              Active Tenants
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {stats.activeTenants} / {stats.totalTenants}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-xs font-bold text-slate-400 uppercase">
              Platform MRR
            </p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">
              {formatBDT(stats.totalMRR)}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-xs font-bold text-slate-400 uppercase">
              Platform Bookings
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {stats.totalBookings}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <p className="text-xs font-bold text-slate-400 uppercase">
              Platform Leads
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {stats.totalLeads}
            </p>
          </div>
        </div>
      )}

      {/* Tenants Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4">Business Tenant</th>
                <th className="py-3.5 px-4">Category &amp; City</th>
                <th className="py-3.5 px-4">Usage (Leads / WA / SMS)</th>
                <th className="py-3.5 px-4">Subscription Plan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {businesses.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{b.name}</p>
                    <p className="text-[11px] font-mono text-slate-400">
                      slug: {b.slug}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <p className="font-semibold">{b.category}</p>
                    <p className="text-[11px] text-slate-400">
                      {b.city || "Dhaka"} · Joined {formatBdDate(b.createdAt)}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-700">
                    <div>
                      Leads: <strong>{b.leadsUsed}</strong>/{b.leadQuota}
                    </div>
                    <div>
                      WA: <strong>{b.whatsappUsed}</strong>/{b.whatsappQuota} ·
                      SMS: <strong>{b.smsUsed}</strong>/{b.smsQuota}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={b.subscriptionPlan || "Starter"}
                      disabled={updatingId === b.id}
                      onChange={(e) =>
                        updateTenant(b.id, { subscriptionPlan: e.target.value })
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-emerald-800 text-xs"
                    >
                      {PLANS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    {updatingId === b.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600 inline" />
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            updateTenant(b.id, { resetUsage: true })
                          }
                          title="Reset Monthly Quotas to 0"
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-[11px] font-semibold text-slate-700 inline-flex items-center"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" /> Reset Usage
                        </button>
                        <button
                          onClick={() =>
                            updateTenant(b.id, {
                              status:
                                b.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                            })
                          }
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold inline-flex items-center ${
                            b.status === "ACTIVE"
                              ? "bg-red-50 text-red-700 hover:bg-red-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {b.status === "ACTIVE" ? "Suspend" : "Activate"}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
