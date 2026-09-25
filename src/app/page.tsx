import Link from "next/link";
import { ArrowRight, Calendar, MessageSquare, CheckCircle, Smartphone, ShieldCheck, Zap, Users } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeProvider";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-sm shadow-emerald-500/20">
              CF
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">ClientFlow</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Bangladesh First
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-6">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span>Multi-Tenant Lead, Booking & Customer Automation</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
          Capture every lead. <br />
          <span className="text-emerald-600">Turn inquiries into bookings.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Connect your website and social channels to one central platform. Automate customer communication
          via WhatsApp, SMS, and Email with built-in quota control tailored for Bangladeshi businesses.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/20 transition group"
          >
            Start Business Onboarding
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition"
          >
            Open Dashboard
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
            <Smartphone className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">+880 E.164 Normalization</p>
              <p className="text-xs text-slate-500">BD Mobile & WhatsApp</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
            <MessageSquare className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">WhatsApp & SMS</p>
              <p className="text-xs text-slate-500">Automated Reminders</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Smart Booking Engine</p>
              <p className="text-xs text-slate-500">Buffer time & prayer breaks</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Tenant Isolation</p>
              <p className="text-xs text-slate-500">Strict data security</p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Visual */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-slate-900 rounded-2xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
          <div className="max-w-3xl">
            <span className="text-emerald-400 font-mono text-xs uppercase tracking-widest">
              Central Operating System
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-2">
              Keep your website & socials. Let ClientFlow handle the rest.
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
              Embed our lightweight widget or WordPress shortcode directly into your current site.
              Capture customers from Website, Facebook, and Instagram into unified CRM records with automated follow-ups.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800">
            <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700">
              <h3 className="text-sm font-bold text-emerald-400 mb-1">1. Embed Widget</h3>
              <p className="text-xs text-slate-300">
                Single-line JavaScript or WordPress shortcode <code className="text-slate-100 bg-slate-900 px-1 py-0.5 rounded">[clientflow_form]</code>.
              </p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700">
              <h3 className="text-sm font-bold text-emerald-400 mb-1">2. Lead Quota Economics</h3>
              <p className="text-xs text-slate-300">
                Predictable starter plan from ৳500/month with 50 leads and included messaging allowances.
              </p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700">
              <h3 className="text-sm font-bold text-emerald-400 mb-1">3. Automated Confirmation</h3>
              <p className="text-xs text-slate-300">
                Instant WhatsApp & SMS notifications with zero double-charge guarantee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-20 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-500">
          ClientFlow SaaS Platform — Tailored for businesses and professionals in Bangladesh.
        </div>
      </footer>
    </div>
  );
}
