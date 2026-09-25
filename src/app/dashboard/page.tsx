"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Calendar,
  Clock,
  Target,
  ArrowUpRight,
  TrendingUp,
  Loader2,
  FileCode,
  Sparkles,
} from "lucide-react";

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

  const {
    metrics,
    quota,
    upcomingBookings = [],
    recentLeads = [],
  } = data || {};

  const leadPct =
    ((quota?.leadsUsed || 0) / Math.max(1, quota?.leadQuota || 50)) * 100;
  const waPct =
    ((quota?.whatsappUsed || 0) / Math.max(1, quota?.whatsappQuota || 150)) *
    100;
  const smsPct =
    ((quota?.smsUsed || 0) / Math.max(1, quota?.smsQuota || 100)) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Dashboard Overview
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time appointment schedule, lead pipeline, and communication economics.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard/forms">
            <Button variant="outline" size="sm" className="gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-emerald-600" />
              Embed Widget
            </Button>
          </Link>
          <Link href="/dashboard/ai">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              AI Receptionist
            </Button>
          </Link>
          <Link href="/dashboard/bookings">
            <Button size="sm">View All Bookings</Button>
          </Link>
        </div>
      </div>

      {/* shadcn Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Today&apos;s Bookings
            </CardTitle>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">
              {metrics?.todayBookings ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Confirmation
            </CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">
              {metrics?.pendingBookings ?? 0}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Requires staff confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Leads
            </CardTitle>
            <Target className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">
              {metrics?.totalLeads ?? 0}
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              +{metrics?.newLeadsToday ?? 0} new today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Completed Revenue
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-emerald-600">
              {metrics?.totalRevenue ?? "৳0"}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              From completed bookings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription & Quota Economics Card */}
      <Card className="border-emerald-500/20">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="success">
                  {data?.business?.subscriptionPlan || "Starter"} Plan
                </Badge>
                <CardTitle>Monthly Communication &amp; Lead Quota</CardTitle>
              </div>
              <CardDescription className="mt-1">
                Per-lead allowance: 3 WhatsApp utility messages · 2 Bangladesh SMS · 3 Emails
              </CardDescription>
            </div>
            <Link href="/dashboard/settings">
              <Button variant="outline" size="sm">
                Manage Plan
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Monthly Leads</span>
                <span className="text-foreground">
                  {quota?.leadsUsed ?? 0} / {quota?.leadQuota ?? 50}
                </span>
              </div>
              <Progress value={leadPct} />
              <p className="text-[11px] text-muted-foreground">
                {quota?.leadRemaining ?? 50} leads remaining this billing cycle
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">WhatsApp Dispatches</span>
                <span className="text-foreground">
                  {quota?.whatsappUsed ?? 0} / {quota?.whatsappQuota ?? 150}
                </span>
              </div>
              <Progress value={waPct} />
              <p className="text-[11px] text-muted-foreground">
                Meta Cloud API utility messages
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Bangladesh SMS</span>
                <span className="text-foreground">
                  {quota?.smsUsed ?? 0} / {quota?.smsQuota ?? 100}
                </span>
              </div>
              <Progress value={smsPct} />
              <p className="text-[11px] text-muted-foreground">
                Automatic fallback &amp; appointment reminders
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Tables: Upcoming Bookings & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Next confirmed &amp; pending slots</CardDescription>
            </div>
            <Link href="/dashboard/bookings">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingBookings.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                No upcoming appointments scheduled yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingBookings.map((b: any) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-semibold">
                        {b.customer?.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {b.service?.name}
                      </TableCell>
                      <TableCell className="font-mono">{b.startTime}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            b.status === "CONFIRMED" ? "success" : "warning"
                          }
                        >
                          {b.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Recent Leads &amp; Inquiries</CardTitle>
              <CardDescription>Captured across web &amp; social</CardDescription>
            </div>
            <Link href="/dashboard/leads">
              <Button variant="ghost" size="sm" className="gap-1">
                Pipeline <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentLeads.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                No customer inquiries captured yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLeads.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-semibold">
                        {l.customer?.name}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {l.customer?.phone}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{l.source}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{l.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
