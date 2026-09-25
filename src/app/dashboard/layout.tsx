"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Target,
  Briefcase,
  FileCode,
  FileText,
  LogOut,
  ChevronRight,
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
  Sparkles,
  Bell,
  Building2,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Core CRM & Inbox",
    items: [
      { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { name: "Bookings", href: "/dashboard/bookings", icon: Calendar },
      { name: "Leads Pipeline", href: "/dashboard/leads", icon: Target },
      { name: "Customers", href: "/dashboard/customers", icon: Users },
      { name: "Unified Inbox", href: "/dashboard/messages", icon: MessageSquare },
      { name: "Quotes & Pay", href: "/dashboard/quotes", icon: FileText },
    ],
  },
  {
    label: "Operations & Setup",
    items: [
      { name: "Services", href: "/dashboard/services", icon: Briefcase },
      { name: "Staff Members", href: "/dashboard/staff", icon: UserCheck },
      { name: "Availability", href: "/dashboard/availability", icon: Clock },
      { name: "Branches & Holidays", href: "/dashboard/branches", icon: MapPin },
      { name: "Embed & Forms", href: "/dashboard/forms", icon: FileCode },
    ],
  },
  {
    label: "Automation & Intelligence",
    items: [
      { name: "Automations", href: "/dashboard/automations", icon: Zap },
      { name: "AI Receptionist", href: "/dashboard/ai", icon: Sparkles },
      { name: "Integrations", href: "/dashboard/integrations", icon: Plug },
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
    ],
  },
  {
    label: "System & Governance",
    items: [
      { name: "Alerts & Ledger", href: "/dashboard/notifications", icon: Bell },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
      { name: "Super Admin", href: "/dashboard/admin", icon: ShieldCheck },
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
  }, [router]);

  async function handleLogout() {
    await fetch("/api/v1/auth/me", { method: "POST" });
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Active page title for top shadcn breadcrumb header
  const allItems = NAV_GROUPS.flatMap((g) => g.items);
  const activeItem =
    allItems.find((it) =>
      it.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(it.href)
    ) || allItems[0];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* shadcn/ui Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border flex flex-col shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-14 px-4 border-b border-border flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              CF
            </div>
            <div className="leading-tight">
              <span className="font-bold text-sm text-foreground tracking-tight block">
                ClientFlow
              </span>
              <span className="text-[10px] text-muted-foreground font-medium block">
                Workspace OS
              </span>
            </div>
          </Link>
          <Badge variant="success" className="text-[10px]">
            {session?.business?.subscriptionPlan || "Starter"}
          </Badge>
        </div>

        {/* Tenant Switcher / Card */}
        {session?.business && (
          <div className="px-3 pt-3">
            <div className="p-2.5 rounded-lg border border-border bg-muted/40 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {session.business.name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {session.business.category} · {session.business.city || "Dhaka"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Categorized Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                {group.label}
              </p>
              {group.items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-2.5 py-2 text-xs font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-emerald-600 text-white font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mr-2.5 shrink-0 ${
                        isActive ? "text-white" : "text-muted-foreground"
                      }`}
                    />
                    <span className="flex-1 truncate">{item.name}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <Separator />

        {/* Sidebar Footer */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-muted-foreground truncate max-w-[140px]">
              {session?.user?.name || session?.user?.email}
            </span>
            <Badge variant="outline" className="text-[9px]">
              {session?.user?.role === "SUPER_ADMIN" ? "Admin" : "Owner"}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle className="flex-1 justify-center h-8" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              title="Sign Out"
              className="px-2.5 text-muted-foreground hover:text-red-600"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area with shadcn Top Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card/60 backdrop-blur-xs px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium">Workspace</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
            <span className="font-semibold text-foreground">
              {activeItem.name}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/dashboard/notifications">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Bell className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Alerts</span>
              </Button>
            </Link>
            <Link href="/dashboard/bookings">
              <Button size="sm" className="gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Booking</span>
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
