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
        <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F5C94A] text-[#181A1E] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
              Super Admin Console
            </h1>
          </div>
          <p className="text-xs text-[#73767D] mt-1">
            Platform-wide SaaS governance: manage all registered business tenants, subscription tiers, and monthly quota allowances.
          </p>
        </div>
      </div>

      {/* Platform KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
            <p className="text-xs font-bold text-[#73767D] uppercase">
              Active Tenants
            </p>
            <p className="text-2xl font-extrabold text-[#181A1E] mt-1">
              {stats.activeTenants} / {stats.totalTenants}
            </p>
          </div>
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
            <p className="text-xs font-bold text-[#73767D] uppercase">
              Platform MRR
            </p>
            <p className="text-2xl font-extrabold text-[#184E37] mt-1">
              {formatBDT(stats.totalMRR)}
            </p>
          </div>
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
            <p className="text-xs font-bold text-[#73767D] uppercase">
              Platform Bookings
            </p>
            <p className="text-2xl font-extrabold text-[#181A1E] mt-1">
              {stats.totalBookings}
            </p>
          </div>
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
            <p className="text-xs font-bold text-[#73767D] uppercase">
              Platform Leads
            </p>
            <p className="text-2xl font-extrabold text-[#181A1E] mt-1">
              {stats.totalLeads}
            </p>
          </div>
        </div>
      )}

      {/* Tenants Table */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F8FA] border-b border-[#EAEAEA] text-[#73767D] uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4">Business Tenant</th>
                <th className="py-3.5 px-4">Category &amp; City</th>
                <th className="py-3.5 px-4">Usage (Leads / WA / SMS)</th>
                <th className="py-3.5 px-4">Subscription Plan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {businesses.map((b) => (
                <tr key={b.id} className="hover:bg-[#F8F8FA]">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-[#181A1E]">{b.name}</p>
                    <p className="text-[11px] font-mono text-[#73767D]">
                      slug: {b.slug}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-[#73767D]">
                    <p className="font-semibold text-[#181A1E]">{b.category}</p>
                    <p className="text-[11px] text-[#73767D]">
                      {b.city || "Dhaka"} · Joined {formatBdDate(b.createdAt)}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#73767D]">
                    <div>
                      Leads: <strong className="text-[#181A1E]">{b.leadsUsed}</strong>/{b.leadQuota}
                    </div>
                    <div>
                      WA: <strong className="text-[#181A1E]">{b.whatsappUsed}</strong>/{b.whatsappQuota} ·
                      SMS: <strong className="text-[#181A1E]">{b.smsUsed}</strong>/{b.smsQuota}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={b.subscriptionPlan || "Starter"}
                      disabled={updatingId === b.id}
                      onChange={(e) =>
                        updateTenant(b.id, { subscriptionPlan: e.target.value })
                      }
                      className="px-3 py-1.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none font-bold text-xs"
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
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === "ACTIVE"
                          ? "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]"
                          : "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5">
                    {updatingId === b.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#181A1E] inline" />
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            updateTenant(b.id, { resetUsage: true })
                          }
                          title="Reset Monthly Quotas to 0"
                          className="px-2.5 py-1 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-[11px] inline-flex items-center"
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
                          className={`px-2.5 py-1 rounded-xl text-[11px] inline-flex items-center ${
                            b.status === "ACTIVE"
                              ? "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2] font-semibold"
                              : "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
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
