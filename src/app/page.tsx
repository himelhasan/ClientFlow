import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  MessageSquare,
  Smartphone,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#181A1E]">
      {/* Header */}
      <header className="border-b border-[#EAEAEA] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5C94A] flex items-center justify-center text-[#181A1E] font-bold text-xl">
              CF
            </div>
            <div className="flex items-center">
              <span className="font-extrabold text-xl text-[#181A1E] tracking-tight">
                ClientFlow
              </span>
              <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E3F5EC] text-[#181A1E]">
                Bangladesh First
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-sm bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl px-4 py-2 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl px-4 py-2 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#FBF3DC] text-[#181A1E] text-xs font-semibold uppercase tracking-wider mb-6">
          <Zap className="w-4 h-4 text-[#181A1E]" />
          <span>Multi-Tenant Lead, Booking &amp; Customer Automation</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-[#181A1E] tracking-tight leading-[1.15]">
          Capture every lead. <br />
          <span>Turn inquiries into bookings.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-[#73767D] max-w-3xl mx-auto leading-relaxed">
          Connect your website and social channels to one central platform. Automate customer communication
          via WhatsApp, SMS, and Email with built-in quota control tailored for Bangladeshi businesses.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl transition group"
          >
            Start Business Onboarding
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-base bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl transition"
          >
            Open Dashboard
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#E3F5EC] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-[#181A1E]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#181A1E]">+880 E.164 Normalization</p>
              <p className="text-xs text-[#73767D]">BD Mobile &amp; WhatsApp</p>
            </div>
          </div>
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#E2F2FA] flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-[#181A1E]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#181A1E]">WhatsApp &amp; SMS</p>
              <p className="text-xs text-[#73767D]">Automated Reminders</p>
            </div>
          </div>
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#FBF3DC] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-[#181A1E]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#181A1E]">Smart Booking Engine</p>
              <p className="text-xs text-[#73767D]">Buffer time &amp; prayer breaks</p>
            </div>
          </div>
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAD4D6] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#181A1E]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#181A1E]">Tenant Isolation</p>
              <p className="text-xs text-[#73767D]">Strict data security</p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Visual */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 sm:p-10 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <div className="max-w-3xl">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E2F2FA] text-[#181A1E] font-mono text-xs uppercase tracking-widest font-semibold">
              Central Operating System
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#181A1E] mt-3">
              Keep your website &amp; socials. Let ClientFlow handle the rest.
            </h2>
            <p className="mt-3 text-[#73767D] text-sm sm:text-base leading-relaxed">
              Embed our lightweight widget or WordPress shortcode directly into your current site.
              Capture customers from Website, Facebook, and Instagram into unified CRM records with automated follow-ups.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#EAEAEA]">
            <div className="bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4">
              <h3 className="text-sm font-bold text-[#181A1E] mb-1">1. Embed Widget</h3>
              <p className="text-xs text-[#73767D]">
                Single-line JavaScript or WordPress shortcode{" "}
                <code className="text-[#181A1E] bg-white border border-[#EAEAEA] px-1.5 py-0.5 rounded">
                  [clientflow_form]
                </code>.
              </p>
            </div>
            <div className="bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4">
              <h3 className="text-sm font-bold text-[#181A1E] mb-1">2. Lead Quota Economics</h3>
              <p className="text-xs text-[#73767D]">
                Predictable starter plan from ৳500/month with 50 leads and included messaging allowances.
              </p>
            </div>
            <div className="bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4">
              <h3 className="text-sm font-bold text-[#181A1E] mb-1">3. Automated Confirmation</h3>
              <p className="text-xs text-[#73767D]">
                Instant WhatsApp &amp; SMS notifications with zero double-charge guarantee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#EAEAEA] mt-20 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-[#73767D]">
          ClientFlow SaaS Platform — Tailored for businesses and professionals in Bangladesh.
        </div>
      </footer>
    </div>
  );
}
