"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeProvider";
import { Badge } from "@/components/ui/badge";
import {
  LayoutGrid,
  Calendar,
  UserSearch,
  Sparkles,
  Users,
  FileCode,
  FileText,
  LogOut,
  ChevronDown,
  Loader2,
  ShieldCheck,
  Zap,
  Clock,
  UserCheck,
  MessageSquare,
  BarChart2,
  Settings,
  MapPin,
  Plug,
  Bell,
  Building2,
  Grid,
  User,
  Menu,
  X,
  CheckSquare,
  Box,
  ListOrdered,
  Star,
  Gift,
  Award,
  Megaphone,
  Sliders,
  Activity,
  ExternalLink,
  Smartphone,
} from "lucide-react";

const PRIMARY_TABS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutGrid, exact: true },
  { name: "Appointment", href: "/dashboard/bookings", icon: Calendar },
  { name: "Enquiry", href: "/dashboard/leads", icon: UserSearch },
  { name: "Services", href: "/dashboard/services", icon: Grid },
  { name: "Inbox", href: "/dashboard/messages", icon: MessageSquare },
];

const WORKSPACE_GROUPS = [
  {
    label: "CRM, Growth & Portal",
    items: [
      { name: "Customers & Bulk CRM", href: "/dashboard/customers", icon: Users, desc: "History, CSV import/export & prefs" },
      { name: "Tasks & Follow-Ups", href: "/dashboard/tasks", icon: CheckSquare, desc: "Staff task board & SLA reminders" },
      { name: "Packages & Coupons", href: "/dashboard/packages", icon: Gift, desc: "Memberships, bundles & promo codes" },
      { name: "Email & Attribution", href: "/dashboard/campaigns", icon: Megaphone, desc: "Campaign broadcasts & multi-touch ROI" },
      { name: "Reviews & Reputation", href: "/dashboard/reviews", icon: Star, desc: "Ratings, NPS & AI review responses" },
      { name: "Quotes & Pay", href: "/dashboard/quotes", icon: FileText, desc: "Invoices, quotes & BDT ledger" },
      { name: "Customer Portal", href: "/portal/glamour-studio", icon: ExternalLink, desc: "Self-serve client portal preview" },
    ],
  },
  {
    label: "Operations & Resources",
    items: [
      { name: "Services & Deposits", href: "/dashboard/services", icon: Grid, desc: "Group capacity & cancellation rules" },
      { name: "Resources & Rooms", href: "/dashboard/resources", icon: Box, desc: "Rooms, equipment & bay booking" },
      { name: "Waitlist Queue", href: "/dashboard/waitlist", icon: ListOrdered, desc: "Auto-slot offers & priority queue" },
      { name: "Staff Members", href: "/dashboard/staff", icon: UserCheck, desc: "Team assignments & roles" },
      { name: "Availability", href: "/dashboard/availability", icon: Clock, desc: "Working hours & slot rules" },
      { name: "Multi-Location UI", href: "/dashboard/branches", icon: MapPin, desc: "Branch comparison & holidays" },
    ],
  },
  {
    label: "AI Suite & Loyalty",
    items: [
      { name: "AI Command Center", href: "/dashboard/ai", icon: Sparkles, desc: "AI Receptionist, Lead Scorer & AI Book" },
      { name: "Loyalty & Gift Cards", href: "/dashboard/loyalty", icon: Award, desc: "Points tiers & digital gift cards" },
      { name: "Advanced Automations", href: "/dashboard/automations", icon: Zap, desc: "Multi-step branching workflows" },
      { name: "API Marketplace", href: "/dashboard/marketplace", icon: Plug, desc: "Developer keys, webhooks & apps" },
      { name: "Embed & Forms", href: "/dashboard/forms", icon: FileCode, desc: "Booking widgets & lead forms" },
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2, desc: "Conversion & revenue reports" },
    ],
  },
  {
    label: "Platform & Governance",
    items: [
      { name: "Custom Fields", href: "/dashboard/custom-fields", icon: Sliders, desc: "Platform-wide schema primitives" },
      { name: "Audit Timeline", href: "/dashboard/audit", icon: Activity, desc: "Unified activity & security diff log" },
      { name: "Integrations", href: "/dashboard/integrations", icon: Plug, desc: "Meta Cloud, SMS & gateways" },
      { name: "Alerts & Ledger", href: "/dashboard/notifications", icon: Bell, desc: "System logs & quota usage" },
      { name: "Settings", href: "/dashboard/settings", icon: Settings, desc: "Business profile & billing" },
      { name: "Super Admin", href: "/dashboard/admin", icon: ShieldCheck, desc: "Multi-tenant platform control" },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);

  const moreRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const branchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setSession(data);
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();

    fetch("/api/v1/branches")
      .then((r) => r.json())
      .then((d) => {
        if (d.branches) setBranches(d.branches);
      })
      .catch(() => {});

    try {
      const savedBranch = localStorage.getItem("clientflow_branch_id");
      if (savedBranch) setSelectedBranchId(savedBranch);
    } catch (_) {}

    const syncBranch = () => {
      try {
        const saved = localStorage.getItem("clientflow_branch_id") || "ALL";
        setSelectedBranchId(saved);
      } catch (_) {}
    };
    window.addEventListener("clientflow-branch-changed", syncBranch);

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("clientflow-branch-changed", syncBranch);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, [router]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setBranchMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMoreOpen(false);
    setProfileOpen(false);
    setMobileMenuOpen(false);
    setBranchMenuOpen(false);
  }, [pathname]);

  function handleSelectBranch(branchId: string) {
    setSelectedBranchId(branchId);
    setBranchMenuOpen(false);
    try {
      localStorage.setItem("clientflow_branch_id", branchId);
      window.dispatchEvent(new Event("clientflow-branch-changed"));
    } catch (_) {}
  }

  async function handleLogout() {
    await fetch("/api/v1/auth/me", { method: "POST" });
    router.push("/login");
  }

  async function handleInstallPwa() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPwaBanner(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#181A1E]" strokeWidth={1.75} />
          <span className="text-xs font-medium text-[#73767D]">Loading workspace...</span>
        </div>
      </div>
    );
  }

  const allSecondaryItems = WORKSPACE_GROUPS.flatMap((g) => g.items);
  const activeSecondaryItem = allSecondaryItems.find(
    (item) =>
      !PRIMARY_TABS.some((pt) => pt.href === item.href) &&
      pathname.startsWith(item.href)
  );

  const activeBranchName =
    selectedBranchId === "ALL"
      ? "All Locations"
      : branches.find((b) => b.id === selectedBranchId)?.name || "All Locations";

  const userName = session?.user?.name || session?.business?.name || "Workspace User";
  const userEmail =
    session?.user?.email ||
    session?.user?.phone ||
    session?.business?.email ||
    session?.business?.phone ||
    "";

  const portalSlug = session?.business?.slug || "workspace";

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#181A1E] flex flex-col pb-16 md:pb-0">
      {/* Top Horizontal Navigation Bar */}
      <header className="w-full sticky top-0 z-40 bg-[#F8F8F6] border-b border-[#EAEAEA]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-3">
          {/* Logo & Multi-Location Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-full bg-[#F5C94A] flex items-center justify-center relative overflow-hidden">
                <svg
                  viewBox="0 0 36 36"
                  fill="none"
                  className="w-9 h-9"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 22C9 19 16 24 26 19C31 16.5 34 17 36 18V21C32 20 28 20.5 23 23C14 27.5 8 22.5 0 25V22Z"
                    fill="#F8F8F6"
                  />
                  <path
                    d="M0 28C8 25.5 16 29.5 26 25C30 23 33.5 23 36 24V27C32 26 28 26.5 22 29C14 32.5 7 28.5 0 31V28Z"
                    fill="#F8F8F6"
                  />
                </svg>
              </div>
              <span className="font-bold text-[18px] tracking-tight text-[#181A1E]">
                ClientFlow
              </span>
            </Link>

            {/* Branch Switcher Pill */}
            <div className="relative hidden lg:block" ref={branchRef}>
              <button
                type="button"
                onClick={() => setBranchMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3F1E8] hover:bg-[#EAE6D7] text-xs font-semibold text-[#181A1E] border border-[#EAEAEA] transition-colors"
                title="Switch Active Branch Location"
              >
                <MapPin className="w-3.5 h-3.5 text-[#181A1E]" strokeWidth={1.75} />
                <span className="max-w-[130px] truncate">{activeBranchName}</span>
                <ChevronDown className="w-3 h-3 text-[#73767D]" strokeWidth={1.75} />
              </button>

              {branchMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-[20px] border border-[#EAEAEA] shadow-[0_12px_32px_-8px_rgba(24,24,27,0.08)] p-2.5 z-50 space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#73767D]">
                    Multi-Location Filter
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectBranch("ALL")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      selectedBranchId === "ALL"
                        ? "bg-[#F5C94A] text-[#181A1E]"
                        : "hover:bg-[#F8F8F6] text-[#181A1E]"
                    }`}
                  >
                    <span>All Locations ({branches.length})</span>
                    {selectedBranchId === "ALL" && <span className="text-[10px]">Active</span>}
                  </button>
                  {branches.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleSelectBranch(b.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        selectedBranchId === b.id
                          ? "bg-[#F5C94A] text-[#181A1E] font-semibold"
                          : "hover:bg-[#F8F8F6] text-[#181A1E]"
                      }`}
                    >
                      <span className="truncate">{b.name}</span>
                      {b.isMain && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#E3F5EC] text-[#184E37] font-semibold">
                          HQ
                        </span>
                      )}
                    </button>
                  ))}
                  <div className="pt-1 border-t border-[#EAEAEA]">
                    <Link
                      href="/dashboard/branches"
                      className="block px-3 py-1.5 text-[11px] font-semibold text-[#181A1E] hover:underline"
                    >
                      Manage Locations &amp; Holidays →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Centered Horizontal Navigation Pills */}
          <nav className="hidden md:flex items-center gap-2">
            {PRIMARY_TABS.map((tab) => {
              const isActive = tab.exact
                ? pathname === tab.href
                : pathname.startsWith(tab.href);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] transition-colors select-none ${
                    isActive
                      ? "bg-[#F5C94A] text-[#181A1E] font-semibold"
                      : "bg-[#F3F1E8] text-[#262930] font-medium hover:bg-[#EAE6D7]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}

            {activeSecondaryItem && (
              <Link
                href={activeSecondaryItem.href}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-[13px] bg-[#F5C94A] text-[#181A1E] font-semibold transition-colors"
              >
                <activeSecondaryItem.icon className="w-4 h-4" strokeWidth={1.75} />
                <span className="max-w-[120px] truncate">{activeSecondaryItem.name}</span>
              </Link>
            )}

            {/* More Modules Dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-[12px] text-[13px] font-medium transition-colors select-none ${
                  moreOpen
                    ? "bg-[#EAE6D7] text-[#181A1E]"
                    : "bg-[#F3F1E8] text-[#262930] hover:bg-[#EAE6D7]"
                }`}
              >
                <Sparkles className="w-4 h-4 text-[#181A1E]" strokeWidth={1.75} />
                <span>More</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#73767D] transition-transform ${
                    moreOpen ? "rotate-180" : ""
                  }`}
                  strokeWidth={1.75}
                />
              </button>

              {moreOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[800px] max-w-[95vw] bg-white rounded-[20px] border border-[#EAEAEA] shadow-[0_12px_32px_-8px_rgba(24,24,27,0.08)] p-6 z-50 grid grid-cols-2 lg:grid-cols-4 gap-5 max-h-[80vh] overflow-y-auto">
                  {WORKSPACE_GROUPS.map((group) => (
                    <div key={group.label} className="space-y-2">
                      <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-[#73767D]">
                        {group.label}
                      </p>
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const href =
                            item.name === "Customer Portal"
                              ? `/portal/${portalSlug}`
                              : item.href;
                          const isCurrent = pathname.startsWith(item.href);
                          return (
                            <Link
                              key={item.name}
                              href={href}
                              className={`flex items-start gap-2.5 p-2 rounded-[12px] transition-colors ${
                                isCurrent
                                  ? "bg-[#F3F1E8] text-[#181A1E]"
                                  : "hover:bg-[#F8F8F6] text-[#262930]"
                              }`}
                            >
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                  isCurrent
                                    ? "bg-[#F5C94A] text-[#181A1E]"
                                    : "bg-[#F3F1E8] text-[#4A4D55]"
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[#181A1E] leading-tight">
                                  {item.name}
                                </p>
                                <p className="text-[10.5px] text-[#73767D] truncate mt-0.5">
                                  {item.desc}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Top-Right Action Area */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href={`/portal/${portalSlug}`}
              title="Open Self-Serve Customer Portal"
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-[#E3F5EC] text-[#184E37] text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Portal</span>
            </Link>

            {/* Notification Bell Icon */}
            <Link
              href="/dashboard/notifications"
              title="Notifications & Ledger"
              className={`w-10 h-10 rounded-[12px] flex items-center justify-center relative transition-colors ${
                pathname.startsWith("/dashboard/notifications")
                  ? "bg-[#F5C94A] text-[#181A1E]"
                  : "bg-[#F3F1E8] text-[#181A1E] hover:bg-[#EAE6D7]"
              }`}
            >
              <Bell className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </Link>

            {/* User Profile Pill Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="bg-[#F3F1E8] hover:bg-[#EAE6D7] transition-colors rounded-[12px] pl-2 pr-3 py-1.5 flex items-center gap-2.5 text-left"
              >
                <div className="w-8 h-8 rounded-full bg-[#D6D7DB] flex items-center justify-center text-white shrink-0 overflow-hidden">
                  <User className="w-4 h-4 text-white fill-white/80 translate-y-0.5" strokeWidth={1.75} />
                </div>
                <div className="hidden sm:block min-w-0 pr-1">
                  <p className="text-[12.5px] font-semibold text-[#181A1E] leading-tight truncate max-w-[128px]">
                    {userName}
                  </p>
                  {userEmail && (
                    <p className="text-[11px] text-[#73767D] leading-tight truncate max-w-[128px] mt-0.5">
                      {userEmail}
                    </p>
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#73767D] shrink-0" strokeWidth={1.75} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-[20px] border border-[#EAEAEA] shadow-[0_12px_32px_-8px_rgba(24,24,27,0.08)] p-4 z-50 space-y-3">
                  {session?.business && (
                    <div className="p-3 rounded-[14px] bg-[#F8F8F6] border border-[#EAEAEA] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#F5C94A] text-[#181A1E] flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-[#181A1E] truncate">
                            {session.business.name}
                          </p>
                          <Badge variant="default" className="text-[9px] px-2 py-0">
                            {session.business.subscriptionPlan || "Starter"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-[#73767D] truncate mt-0.5">
                          {session.business.category} · {activeBranchName}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Link
                      href={`/portal/${portalSlug}`}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#262930] hover:bg-[#F3F1E8]"
                    >
                      <ExternalLink className="w-4 h-4 text-[#73767D]" strokeWidth={1.75} />
                      Customer Self-Serve Portal
                    </Link>
                    <Link
                      href="/dashboard/marketplace"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#262930] hover:bg-[#F3F1E8]"
                    >
                      <Plug className="w-4 h-4 text-[#73767D]" strokeWidth={1.75} />
                      API Marketplace &amp; Webhooks
                    </Link>
                    <Link
                      href="/dashboard/audit"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#262930] hover:bg-[#F3F1E8]"
                    >
                      <Activity className="w-4 h-4 text-[#73767D]" strokeWidth={1.75} />
                      Audit &amp; Activity Timeline
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#262930] hover:bg-[#F3F1E8]"
                    >
                      <Settings className="w-4 h-4 text-[#73767D]" strokeWidth={1.75} />
                      Workspace Settings
                    </Link>
                  </div>

                  <div className="pt-2 border-t border-[#EAEAEA] flex items-center justify-between gap-2">
                    <ThemeToggle className="flex-1 justify-center h-8 rounded-xl bg-[#F3F1E8] border-0" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FAD4D6] text-[#9E2A2B] hover:bg-[#F5BFC2] transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden w-10 h-10 rounded-[12px] bg-[#F3F1E8] flex items-center justify-center text-[#181A1E]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" strokeWidth={1.75} />
              ) : (
                <Menu className="w-5 h-5" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        {/* PWA Install Banner */}
        {showPwaBanner && (
          <div className="bg-[#F3F1E8] text-[#181A1E] border-t border-[#EAEAEA] px-4 py-2 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-[#181A1E]" strokeWidth={1.75} />
              <span>Install ClientFlow Mobile App for offline access &amp; push notifications</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallPwa}
                className="px-3 py-1 bg-[#F5C94A] text-[#181A1E] font-semibold rounded-lg"
              >
                Install
              </button>
              <button onClick={() => setShowPwaBanner(false)}>
                <X className="w-4 h-4 text-[#73767D]" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Dropdown Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#EAEAEA] px-4 py-4 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-2">
              {PRIMARY_TABS.map((tab) => {
                const isActive = tab.exact
                  ? pathname === tab.href
                  : pathname.startsWith(tab.href);
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-[12px] text-xs ${
                      isActive
                        ? "bg-[#F5C94A] text-[#181A1E] font-semibold"
                        : "bg-[#F3F1E8] text-[#262930] font-medium"
                    }`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                    <span>{tab.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-[#EAEAEA] pt-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#73767D] px-1">
                All Platform Modules
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {allSecondaryItems.map((item) => {
                  const href =
                    item.name === "Customer Portal"
                      ? `/portal/${portalSlug}`
                      : item.href;
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-[10px] text-xs ${
                        isActive
                          ? "bg-[#F5C94A] text-[#181A1E] font-semibold"
                          : "bg-[#F8F8F6] text-[#262930] font-medium"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-[#73767D]" strokeWidth={1.75} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#EAEAEA] flex items-center justify-around h-16 px-2">
        {PRIMARY_TABS.map((tab) => {
          const isActive = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-xl text-[10px] font-semibold ${
                isActive ? "text-[#181A1E]" : "text-[#73767D]"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl ${
                  isActive ? "bg-[#F5C94A] text-[#181A1E]" : ""
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
              </div>
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
