"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [copiedJs, setCopiedJs] = useState(false);
  const [copiedWp, setCopiedWp] = useState(false);

  // Step 1: Info
  const [info, setInfo] = useState({
    businessName: "",
    category: "Salon",
    phone: "",
    whatsapp: "",
    city: "Dhaka",
    address: "",
    website: "",
  });

  // Step 2: Requirements
  const [needs, setNeeds] = useState({
    acceptsAppointments: true,
    acceptsServiceRequests: true,
    acceptsQuotes: false,
    hasStaff: false,
    acceptsOnlinePayment: false,
    usesWhatsApp: true,
    usesSMS: true,
    usesFacebook: false,
    usesInstagram: false,
  });

  // Step 3: Service configuration
  const [service, setService] = useState({
    firstServiceName: "Standard Appointment",
    firstServiceDuration: 30,
    firstServicePrice: 800,
  });

  // Resulting form & embed code
  const [completedData, setCompletedData] = useState<any>(null);

  async function handleFinish() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...info,
          ...needs,
          ...service,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete setup");

      setCompletedData(data);
      setStep(4); // Success step
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  const embedScript = completedData?.form
    ? `<script src="${typeof window !== "undefined" ? window.location.origin : ""}/widget.js" data-form="${completedData.form.slug}"></script>`
    : "";

  const shortcode = completedData?.form
    ? `[clientflow_form id="${completedData.form.slug}"]`
    : "";

  return (
    <div className="min-h-screen bg-[#F8F8F6] text-[#181A1E] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2 text-[#181A1E] font-bold text-xl mb-3">
            <span>ClientFlow Setup Wizard</span>
          </div>
          <div className="flex items-center justify-center space-x-4 max-w-md mx-auto">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition ${
                    step >= s
                      ? "bg-[#F5C94A] text-[#181A1E] font-semibold"
                      : "bg-[#F3F1E8] text-[#262930] font-medium"
                  }`}
                >
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                <span className="text-xs font-medium text-[#73767D] hidden sm:inline">
                  {s === 1 ? "Business Info" : s === 2 ? "Channels" : "First Service"}
                </span>
                {s < 3 && <div className="w-8 h-0.5 bg-[#EAEAEA]" />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 sm:p-10 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          {/* STEP 1: Business Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#181A1E]">Step 1 — Business Details</h2>
                <p className="text-sm text-[#73767D] mt-1">
                  Tell us about your business so we can configure your booking forms and notifications.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] uppercase tracking-wider mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Health Clinic"
                    value={info.businessName}
                    onChange={(e) => setInfo({ ...info, businessName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={info.category}
                    onChange={(e) => setInfo({ ...info, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
                  >
                    <option value="Salon">Salon & Beauty Parlour</option>
                    <option value="Dentist">Dental Clinic</option>
                    <option value="Doctor">Doctor / Medical Consultant</option>
                    <option value="AC Repair">AC / Appliance Repair</option>
                    <option value="Car Workshop">Automotive Workshop</option>
                    <option value="Lawyer">Law Firm / Legal</option>
                    <option value="Consultant">Consultancy / Agency</option>
                    <option value="Other">Other Services</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] uppercase tracking-wider mb-1">
                    Contact Phone (BD Mobile)
                  </label>
                  <input
                    type="text"
                    placeholder="017XXXXXXXX"
                    value={info.phone}
                    onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] uppercase tracking-wider mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    placeholder="01XXXXXXXXX"
                    value={info.whatsapp}
                    onChange={(e) => setInfo({ ...info, whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Dhaka, Chittagong, Sylhet..."
                    value={info.city}
                    onChange={(e) => setInfo({ ...info, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] uppercase tracking-wider mb-1">
                    Website URL (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://mybusiness.com"
                    value={info.website}
                    onChange={(e) => setInfo({ ...info, website: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center px-6 py-2.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold text-sm rounded-xl transition"
                >
                  Next: Business Needs
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Requirements */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#181A1E]">Step 2 — Business Requirements</h2>
                <p className="text-sm text-[#73767D] mt-1">
                  Select which modules you need. We will dynamically adapt your dashboard.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: "acceptsAppointments",
                    title: "Appointment Booking",
                    desc: "Allow customers to book scheduled time slots",
                  },
                  {
                    key: "acceptsServiceRequests",
                    title: "Service Requests",
                    desc: "Allow customers to submit repair/service requests",
                  },
                  {
                    key: "acceptsQuotes",
                    title: "Quote Requests",
                    desc: "Receive quote inquiries with customer descriptions",
                  },
                  {
                    key: "usesWhatsApp",
                    title: "WhatsApp Communication",
                    desc: "Send instant booking confirmations & reminders on WhatsApp",
                  },
                  {
                    key: "usesSMS",
                    title: "SMS Communication",
                    desc: "Bangladesh SMS fallback alerts for customers",
                  },
                  {
                    key: "hasStaff",
                    title: "Staff Members",
                    desc: "Assign bookings to individual doctors/specialists",
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4 hover:border-[#F5C94A] cursor-pointer transition"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#181A1E]">{item.title}</p>
                      <p className="text-xs text-[#73767D]">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={(needs as any)[item.key]}
                      onChange={(e) =>
                        setNeeds({ ...needs, [item.key]: e.target.checked })
                      }
                      className="w-5 h-5 accent-[#F5C94A] rounded border-[#EAEAEA]"
                    />
                  </label>
                ))}
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-sm transition"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center px-6 py-2.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold text-sm rounded-xl transition"
                >
                  Next: First Service
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: First Service Setup */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#181A1E]">Step 3 — Create Your First Service</h2>
                <p className="text-sm text-[#73767D] mt-1">
                  We will automatically link this service to your embeddable booking widget.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#181A1E] uppercase tracking-wider mb-1">
                    Service Name
                  </label>
                  <input
                    type="text"
                    value={service.firstServiceName}
                    onChange={(e) =>
                      setService({ ...service, firstServiceName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#181A1E] uppercase tracking-wider mb-1">
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      value={service.firstServiceDuration}
                      onChange={(e) =>
                        setService({
                          ...service,
                          firstServiceDuration: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#181A1E] uppercase tracking-wider mb-1">
                      Price (BDT / ৳)
                    </label>
                    <input
                      type="number"
                      value={service.firstServicePrice}
                      onChange={(e) =>
                        setService({
                          ...service,
                          firstServicePrice: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-sm transition"
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinish}
                  className="inline-flex items-center px-6 py-2.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold text-sm rounded-xl transition disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Complete Setup & Generate Widget
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Success & Embed Codes */}
          {step === 4 && completedData && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-[#E3F5EC] text-[#181A1E] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-[#181A1E]">Your Booking System is Ready!</h2>
                <p className="text-sm text-[#73767D] mt-1 max-w-md mx-auto">
                  Copy your embed code below to install on your existing website, or open your direct hosted form.
                </p>
              </div>

              {/* Embed Code Snippet */}
              <div className="text-left bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4 text-[#181A1E]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#181A1E]">Website JavaScript Embed</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(embedScript);
                      setCopiedJs(true);
                      setTimeout(() => setCopiedJs(false), 2000);
                    }}
                    className="text-xs inline-flex items-center space-x-1 px-2.5 py-1 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl"
                  >
                    {copiedJs ? <Check className="w-3.5 h-3.5 text-[#181A1E]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJs ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>
                <code className="text-xs font-mono text-[#181A1E] break-all select-all block bg-white p-3 rounded-xl border border-[#EAEAEA]">
                  {embedScript}
                </code>
              </div>

              {/* WordPress Shortcode */}
              <div className="text-left bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#181A1E]">WordPress Shortcode</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shortcode);
                      setCopiedWp(true);
                      setTimeout(() => setCopiedWp(false), 2000);
                    }}
                    className="text-xs inline-flex items-center space-x-1 px-2.5 py-1 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl"
                  >
                    {copiedWp ? <Check className="w-3.5 h-3.5 text-[#181A1E]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWp ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
                <code className="text-xs font-mono text-[#181A1E] font-semibold">{shortcode}</code>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`/f/${completedData.form.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium text-sm rounded-xl transition"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Public Form
                </a>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold text-sm rounded-xl transition"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
