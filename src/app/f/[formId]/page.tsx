"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { formatBDT } from "@/lib/utils/bangladesh";

import { Suspense } from "react";

function BookingFormInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const formId = params.formId as string;
  const isEmbed = searchParams.get("embed") === "true";

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>(null);
  const [error, setError] = useState("");

  // Booking selections
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  // Customer information
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Load form definition and initial services
  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`/api/v1/widget/${formId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load booking form");

        setFormData(data);
        if (data.services?.length > 0) {
          setSelectedServiceId(data.services[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [formId]);

  // Load available slots whenever selected service or date changes
  useEffect(() => {
    if (!selectedServiceId || !selectedDate || !formId) return;

    async function loadSlots() {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const res = await fetch(
          `/api/v1/widget/${formId}?date=${selectedDate}&serviceId=${selectedServiceId}`
        );
        const data = await res.json();
        if (data.slots) {
          setAvailableSlots(data.slots);
        }
      } catch (err) {
        console.error("Error fetching slots:", err);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [formId, selectedServiceId, selectedDate]);

  // Report height to parent window if embedded
  useEffect(() => {
    if (isEmbed && typeof window !== "undefined") {
      const sendResize = () => {
        const height = document.body.scrollHeight;
        window.parent.postMessage(
          { type: "CLIENTFLOW_RESIZE", formId, height: height + 40 },
          "*"
        );
      };
      sendResize();
      window.addEventListener("resize", sendResize);
      return () => window.removeEventListener("resize", sendResize);
    }
  }, [isEmbed, formId, availableSlots, confirmedBooking]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) {
      alert("Please select an available appointment time slot.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/widget/${formId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          date: selectedDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          customerName,
          customerPhone,
          customerWhatsapp: customerWhatsapp || customerPhone,
          customerEmail,
          notes,
          utmSource: searchParams.get("utm_source") || "website",
          utmMedium: searchParams.get("utm_medium"),
          utmCampaign: searchParams.get("utm_campaign"),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking submission failed");

      setConfirmedBooking(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-6 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Booking Form Unavailable</h3>
        <p className="text-sm text-slate-500 mt-1">{error || "Form could not be found."}</p>
      </div>
    );
  }

  const { form, business, services } = formData;
  const primaryColor = form.designConfig?.primaryColor || "#059669";

  return (
    <div className={`${isEmbed ? "p-2 bg-transparent" : "min-h-screen bg-slate-100 py-8 px-4 sm:px-6"}`}>
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Business Branding Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold">
              {business.category || "Professional Services"}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
              {business.name}
            </h1>
            {business.city && (
              <p className="text-xs text-slate-300 flex items-center mt-1">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {business.city}
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Online Booking
            </span>
          </div>
        </div>

        {/* Confirmed State */}
        {confirmedBooking ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                Booking Confirmed
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1">
                {confirmedBooking.bookingNumber}
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                Thank you, <strong>{customerName}</strong>! Your appointment has been scheduled with{" "}
                <strong>{business.name}</strong>.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-semibold text-slate-900">{confirmedBooking.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-semibold text-slate-900">{confirmedBooking.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time:</span>
                <span className="font-semibold text-slate-900">{confirmedBooking.startTime}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500">Fee:</span>
                <span className="font-bold text-emerald-600">{confirmedBooking.price}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-800 text-xs flex items-center justify-center space-x-2">
              <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>A confirmation message has been dispatched to {customerPhone}.</span>
            </div>

            <button
              onClick={() => {
                setConfirmedBooking(null);
                setSelectedSlot(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Book another appointment
            </button>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Step 1: Select Service */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Service
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {services.map((svc: any) => (
                  <div
                    key={svc.id}
                    onClick={() => setSelectedServiceId(svc.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                      selectedServiceId === svc.id
                        ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{svc.name}</p>
                      <p className="text-xs text-slate-500 flex items-center mt-0.5">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {svc.durationMinutes} mins
                      </p>
                    </div>
                    <span className="font-bold text-sm text-emerald-700">
                      {formatBDT(svc.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Select Date & Available Slot */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                2. Choose Date & Time
              </label>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {loadingSlots ? (
                <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Checking real-time availability...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="py-4 px-3 bg-amber-50 rounded-lg text-amber-800 text-xs text-center border border-amber-200">
                  No slots available on this date. Please pick another day.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition ${
                        selectedSlot?.startTime === slot.startTime
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:border-emerald-500"
                      }`}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3: Customer Information */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                3. Your Information
              </label>

              <div>
                <input
                  type="text"
                  required
                  placeholder="Your Full Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="tel"
                    required
                    placeholder="Mobile: 017XXXXXXXX *"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <input
                    type="tel"
                    placeholder="WhatsApp (if different)"
                    value={customerWhatsapp}
                    onChange={(e) => setCustomerWhatsapp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  placeholder="Any details or notes for the specialist (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              style={{ backgroundColor: primaryColor }}
              className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-md transition hover:opacity-95 disabled:opacity-50 flex items-center justify-center"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : selectedSlot ? (
                <span>Confirm Booking for {selectedSlot.startTime}</span>
              ) : (
                <span>Select a time slot to continue</span>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400">
          Powered by ClientFlow • Multi-Tenant Automation Platform
        </div>
      </div>
    </div>
  );
}

export default function PublicBookingForm() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center p-6 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <BookingFormInner />
    </Suspense>
  );
}
