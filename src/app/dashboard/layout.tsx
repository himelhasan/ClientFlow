"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeProvider";
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
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Bookings", href: "/dashboard/bookings", icon: Calendar },
    { name: "Leads", href: "/dashboard/leads", icon: Target },
    { name: "Customers", href: "/dashboard/customers", icon: Users },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { name: "Quotes & Pay", href: "/dashboard/quotes", icon: FileText },
    { name: "Services", href: "/dashboard/services", icon: Briefcase },
    { name: "Staff", href: "/dashboard/staff", icon: UserCheck },
    { name: "Availability", href: "/dashboard/availability", icon: Clock },
    { name: "Branches & Holidays", href: "/dashboard/branches", icon: MapPin },
    { name: "Forms", href: "/dashboard/forms", icon: FileCode },
    { name: "Automations", href: "/dashboard/automations", icon: Zap },
    { name: "AI Receptionist", href: "/dashboard/ai", icon: Sparkles },
    { name: "Integrations", href: "/dashboard/integrations", icon: Plug },
    { name: "Alerts & Ledger", href: "/dashboard/notifications", icon: Bell },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
    { name: "Super Admin", href: "/dashboard/admin", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0">
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              CF
            </div>
            <div>
              <span className="font-extrabold text-base text-slate-900 tracking-tight">ClientFlow</span>
              <p className="text-[10px] text-emerald-700 font-semibold uppercase">Tenant Workspace</p>
            </div>
          </Link>
        </div>

        {/* Business Badge */}
        {session?.business && (
          <div className="p-4 mx-3 my-3 bg-slate-50 border border-slate-200/70 rounded-xl">
            <p className="text-xs font-bold text-slate-900 truncate">{session.business.name}</p>
            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
              <span>{session.business.category}</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                {session.business.subscriptionPlan || "Starter"}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 py-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3.5 py-2.5 text-xs font-semibold rounded-xl transition ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5" />}
              </Link>
            );
          })}
        </nav>

        {/* Quota & User Footer */}
        <div className="p-4 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Signed in as:</span>
            <span className="text-slate-900 font-bold truncate max-w-[120px]">
              {session?.user?.name}
            </span>
          </div>

          <ThemeToggle className="w-full justify-center" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-red-600 transition"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
