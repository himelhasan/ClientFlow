"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  Target,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { formatBDT, formatBdDate } from "@/lib/utils/bangladesh";

export default function DashboardOverview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const { metrics, quota, upcomingBookings = [], recentLeads = [] } = data || {};

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time appointment schedule, lead pipeline, and communication economics.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/forms"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            Get Website Embed Code
          </Link>
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
          >
            View All Bookings
          </Link>
        </div>
      </div>

      {/* Metric Cards (Section 6) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today&apos;s Bookings</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{metrics?.todayBookings ?? 0}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Scheduled for today</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Confirmation</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{metrics?.pendingBookings ?? 0}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Requires staff attention</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Leads</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{metrics?.totalLeads ?? 0}</div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            +{metrics?.newLeadsToday ?? 0} new today
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{metrics?.totalRevenue ?? "৳0"}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">From completed bookings</span>
        </div>
      </div>

      {/* Communication Quota Economics (Section 68) */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
              Subscription & Quota Economics
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              {data?.business?.subscriptionPlan || "Starter"} Monthly Communication Ledger
            </h3>
          </div>
          <div className="text-xs text-slate-300">
            <span>Cycle resets every month</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
          {/* Leads Quota */}
          <div>
            <div className="flex justify-between text-xs mb-1.5 font-semibold">
              <span className="text-slate-300">Lead Volume</span>
              <span className="text-emerald-400">
                {quota?.leadsUsed} / {quota?.leadQuota} Leads ({quota?.leadRemaining} left)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    ((quota?.leadsUsed || 0) / (quota?.leadQuota || 50)) * 100
                  )}%`,
                }}
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              1 lead counted once per unique customer
            </span>
          </div>

          {/* WhatsApp Quota */}
          <div>
            <div className="flex justify-between text-xs mb-1.5 font-semibold">
              <span className="text-slate-300">WhatsApp Outbound</span>
              <span className="text-emerald-400">
                {quota?.whatsappUsed} / {quota?.whatsappQuota} msgs
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    ((quota?.whatsappUsed || 0) / (quota?.whatsappQuota || 150)) * 100
                  )}%`,
                }}
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              3 included WhatsApp messages per lead
            </span>
          </div>

          {/* SMS Quota */}
          <div>
            <div className="flex justify-between text-xs mb-1.5 font-semibold">
              <span className="text-slate-300">SMS Outbound</span>
              <span className="text-emerald-400">
                {quota?.smsUsed} / {quota?.smsQuota} msgs
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    ((quota?.smsUsed || 0) / (quota?.smsQuota || 100)) * 100
                  )}%`,
                }}
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              2 included SMS messages per lead
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Upcoming Bookings & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Upcoming Appointments</h3>
            <Link
              href="/dashboard/bookings"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No upcoming appointments scheduled yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingBookings.map((b: any) => (
                <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{b.customer?.name}</p>
                    <p className="text-slate-500 mt-0.5">{b.service?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{b.startTime}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Inquiries & Leads */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Recent Leads & Inquiries</h3>
            <Link
              href="/dashboard/leads"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center"
            >
              View pipeline <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No customer inquiries captured yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentLeads.map((l: any) => (
                <div key={l.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{l.customer?.name}</p>
                    <p className="text-slate-500 mt-0.5">{l.customer?.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                      {l.source}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">{l.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
