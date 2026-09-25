"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  Loader2,
  MapPin,
  MessageCircle,
  AlertCircle,
  Building2,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatBDT } from "@/lib/utils/bangladesh";

function BookingFormInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const formId = params.formId as string;
  const isEmbed = searchParams.get("embed") === "true";

  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>(null);
  const [error, setError] = useState("");

  // Branch Selection (if business has multiple branches)
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

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

  // Load form definition, branches, and initial services
  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`/api/v1/widget/${formId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load booking form");

        setFormData(data);
        if (data.branches?.length > 0) {
          // Pre-select main HQ or first branch
          const mainBranch = data.branches.find((b: any) => b.isMain) || data.branches[0];
          setSelectedBranchId(mainBranch.id);
        }
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

  // Filter available services by selected branch
  const filteredServices = (formData?.services || []).filter((s: any) => {
    if (!selectedBranchId) return true;
    return !s.branchId || s.branchId === selectedBranchId;
  });

  // Ensure selectedServiceId is valid within filtered services
  useEffect(() => {
    if (filteredServices.length > 0) {
      const stillValid = filteredServices.some((s: any) => s.id === selectedServiceId);
      if (!stillValid) {
        setSelectedServiceId(filteredServices[0].id);
      }
    }
  }, [selectedBranchId]);

  // Load available slots whenever selected service, date, or branch changes
  useEffect(() => {
    if (!selectedServiceId || !selectedDate || !formId) return;

    async function loadSlots() {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        const branchQuery = selectedBranchId ? `&branchId=${selectedBranchId}` : "";
        const res = await fetch(
          `/api/v1/widget/${formId}?date=${selectedDate}&serviceId=${selectedServiceId}${branchQuery}`
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
  }, [formId, selectedServiceId, selectedDate, selectedBranchId]);

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
      toast.error("Please select an available appointment time slot.");
      return;
    }

    setSubmitting(true);
    toast.loading("Reserving your appointment...", { id: "widget-submit" });

    try {
      const res = await fetch(`/api/v1/widget/${formId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          branchId: selectedBranchId || undefined,
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
      toast.success("Appointment confirmed!", { id: "widget-submit" });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit booking", { id: "widget-submit" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] bg-[#F8F8F6] text-[#181A1E] flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="min-h-screen bg-[#F8F8F6] text-[#181A1E] p-8 flex items-center justify-center">
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-sm text-center max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-[#181A1E] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#181A1E]">Booking Form Unavailable</h3>
          <p className="text-sm text-[#73767D] mt-1">{error || "Form could not be found."}</p>
        </div>
      </div>
    );
  }

  const { business, branches } = formData;
  const hasMultipleBranches = branches && branches.length > 1;

  return (
    <div
      className={`${
        isEmbed
          ? "p-2 bg-[#F8F8F6] text-[#181A1E]"
          : "min-h-screen bg-[#F8F8F6] text-[#181A1E] py-8 px-4 sm:px-6"
      }`}
    >
      <div className="max-w-xl mx-auto bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-sm space-y-6">
        {/* Business Branding Header */}
        <div className="bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#73767D] font-bold">
              {business.category || "Professional Services"}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#181A1E] mt-0.5">
              {business.name}
            </h1>
            {business.city && (
              <p className="text-xs text-[#73767D] flex items-center mt-1">
                <MapPin className="w-3.5 h-3.5 mr-1 text-[#73767D]" />
                {business.city}
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E3F5EC] text-[#181A1E]">
              Online Booking
            </span>
          </div>
        </div>

        {/* Confirmed State */}
        {confirmedBooking ? (
          <div className="py-4 text-center space-y-6">
            <div className="w-16 h-16 bg-[#E3F5EC] text-[#181A1E] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E3F5EC] text-xs font-bold text-[#181A1E] uppercase tracking-widest">
                Booking Confirmed
              </span>
              <h2 className="text-2xl font-bold text-[#181A1E] mt-2">
                {confirmedBooking.bookingNumber}
              </h2>
              <p className="text-sm text-[#73767D] mt-2">
                Thank you, <strong className="text-[#181A1E]">{customerName}</strong>! Your appointment has been scheduled with{" "}
                <strong className="text-[#181A1E]">{business.name}</strong>.
              </p>
            </div>

            <div className="bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#73767D]">Service:</span>
                <span className="font-semibold text-[#181A1E]">{confirmedBooking.serviceName}</span>
              </div>
              {confirmedBooking.branchName && (
                <div className="flex justify-between">
                  <span className="text-[#73767D]">Location:</span>
                  <span className="font-semibold text-emerald-700">{confirmedBooking.branchName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#73767D]">Date:</span>
                <span className="font-semibold text-[#181A1E]">{confirmedBooking.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#73767D]">Time:</span>
                <span className="font-semibold text-[#181A1E]">{confirmedBooking.startTime}</span>
              </div>
              <div className="flex justify-between border-t border-[#EAEAEA] pt-2">
                <span className="text-[#73767D]">Fee:</span>
                <span className="font-bold text-[#181A1E]">{confirmedBooking.price}</span>
              </div>
            </div>

            <div className="p-3 bg-[#E3F5EC] rounded-xl text-[#181A1E] text-xs flex items-center justify-center space-x-2">
              <MessageCircle className="w-4 h-4 text-[#181A1E] shrink-0" />
              <span>A confirmation message has been dispatched to {customerPhone}.</span>
            </div>

            <button
              onClick={() => {
                setConfirmedBooking(null);
                setSelectedSlot(null);
              }}
              className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-xs"
            >
              Book another appointment
            </button>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1 (Conditional): Select Branch / Location if business has multiple branches */}
            {hasMultipleBranches && (
              <div>
                <label className="block text-xs font-bold text-[#181A1E] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" /> 1. Choose Studio / Branch Location
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {branches.map((b: any) => {
                    const isSelected = selectedBranchId === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBranchId(b.id)}
                        className={`p-3.5 rounded-[14px] border cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                            : "border-[#EAEAEA] bg-[#F8F8FA] hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#181A1E]">
                            {b.name}
                          </h4>
                          {b.isMain && (
                            <span className="text-[9px] font-bold bg-[#E3F5EC] text-[#184E37] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-current" /> HQ
                            </span>
                          )}
                        </div>
                        {b.address && (
                          <p className="text-[11px] text-[#73767D] mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {b.address}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Select Service */}
            <div>
              <label className="block text-xs font-bold text-[#181A1E] uppercase tracking-wider mb-2">
                {hasMultipleBranches ? "2. Select Service" : "1. Select Service"}
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {filteredServices.map((svc: any) => (
                  <div
                    key={svc.id}
                    onClick={() => setSelectedServiceId(svc.id)}
                    className={`bg-[#F8F8FA] rounded-[14px] border p-4 cursor-pointer flex items-center justify-between transition ${
                      selectedServiceId === svc.id
                        ? "border-[#F5C94A] bg-[#FBF3DC]"
                        : "border-[#EAEAEA] hover:border-[#F5C94A]"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#181A1E]">{svc.name}</p>
                      <p className="text-xs text-[#73767D] flex items-center mt-0.5">
                        <Clock className="w-3.5 h-3.5 mr-1 text-[#73767D]" />
                        {svc.durationMinutes} mins
                      </p>
                    </div>
                    <span className="font-bold text-sm text-[#181A1E]">
                      {formatBDT(svc.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Select Date & Available Slot */}
            <div>
              <label className="block text-xs font-bold text-[#181A1E] uppercase tracking-wider mb-2">
                {hasMultipleBranches ? "3. Choose Date & Time" : "2. Choose Date & Time"}
              </label>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                />
              </div>

              {loadingSlots ? (
                <div className="py-6 text-center text-[#73767D] text-xs flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#181A1E]" />
                  <span>Checking real-time availability...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="py-4 px-3 bg-[#FBF3DC] rounded-xl text-[#181A1E] text-xs text-center border border-[#EAEAEA]">
                  No slots available on this date. Please pick another day.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-3 text-xs text-center transition ${
                        selectedSlot?.startTime === slot.startTime
                          ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl"
                          : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl"
                      }`}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 4: Customer Information */}
            <div className="space-y-3 pt-4 border-t border-[#EAEAEA]">
              <label className="block text-xs font-bold text-[#181A1E] uppercase tracking-wider mb-2">
                {hasMultipleBranches ? "4. Your Information" : "3. Your Information"}
              </label>

              <div>
                <input
                  type="text"
                  required
                  placeholder="Your Full Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="tel"
                    required
                    placeholder="Mobile Number (01XXXXXXXXX) *"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email Address (Optional)"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  placeholder="Any special requests or instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Submission Button */}
            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="w-full flex items-center justify-center py-3.5 px-4 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-sm transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-[#181A1E]" />
                  <span>Securing your slot...</span>
                </>
              ) : (
                <span>Confirm Appointment</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function BookingFormPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F8F6] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
        </div>
      }
    >
      <BookingFormInner />
    </Suspense>
  );
}
