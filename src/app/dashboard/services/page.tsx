"use client";

import { useEffect, useState } from "react";
import {
 Briefcase,
 Plus,
 Clock,
 Loader2,
 Pencil,
 X,
 ToggleLeft,
 ToggleRight,
 Save,
 Users,
 ShieldCheck,
 AlertCircle,
 Wallet,
} from "lucide-react";
import { formatBDT } from "@/lib/utils/bangladesh";

interface Service {
 id: string;
 name: string;
 description?: string;
 durationMinutes: number;
 price: number | string;
 pricingModel: string;
 category?: string;
 bufferTimeMinutes: number;
 isActive: boolean;
 maxCapacity: number;
 allowGroupBooking: boolean;
 depositType: "NONE" | "FIXED" | "PERCENTAGE" | string;
 depositValue: number | string;
 cancellationFee: number | string;
 cancellationWindowHours: number;
}

const PRICING_MODELS = ["FIXED", "STARTING_FROM", "FREE", "REQUEST_QUOTE", "CUSTOM"];
const DEPOSIT_TYPES = [
 { value: "NONE", label: "No Advance Deposit" },
 { value: "FIXED", label: "Fixed Amount (৳ BDT)" },
 { value: "PERCENTAGE", label: "Percentage (%)" },
];

export default function ServicesPage() {
 const [services, setServices] = useState<Service[]>([]);
 const [loading, setLoading] = useState(true);
 const [showAdd, setShowAdd] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [editingId, setEditingId] = useState<string | null>(null);

 const emptyForm = {
 name: "",
 durationMinutes: 30,
 price: 800,
 description: "",
 pricingModel: "FIXED",
 category: "",
 bufferTimeMinutes: 0,
 allowGroupBooking: false,
 maxCapacity: 1,
 depositType: "NONE",
 depositValue: 0,
 cancellationFee: 0,
 cancellationWindowHours: 24,
 };

 const [form, setForm] = useState(emptyForm);
 const [editForm, setEditForm] = useState<Partial<Service>>({});

 async function loadServices() {
 setLoading(true);
 try {
 const res = await fetch("/api/v1/services");
 const data = await res.json();
 setServices(data.services || []);
 } catch (err) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 }

 useEffect(() => {
 loadServices();
 }, []);

 async function handleCreate(e: React.FormEvent) {
 e.preventDefault();
 setSubmitting(true);
 try {
 const res = await fetch("/api/v1/services", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(form),
 });
 if (res.ok) {
 setShowAdd(false);
 setForm(emptyForm);
 await loadServices();
 } else {
 const err = await res.json();
 alert(err.error || "Failed to create service");
 }
 } catch (err) {
 alert("Failed to create service");
 } finally {
 setSubmitting(false);
 }
 }

 async function handleUpdate(serviceId: string) {
 setSubmitting(true);
 try {
 const res = await fetch("/api/v1/services", {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ serviceId, ...editForm }),
 });
 if (res.ok) {
 setEditingId(null);
 setEditForm({});
 await loadServices();
 } else {
 const err = await res.json();
 alert(err.error || "Failed to update service");
 }
 } catch (err) {
 alert("Failed to update service");
 } finally {
 setSubmitting(false);
 }
 }

 async function handleToggleActive(service: Service) {
 try {
 await fetch("/api/v1/services", {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ serviceId: service.id, isActive: !service.isActive }),
 });
 setServices((prev) =>
 prev.map((s) => (s.id === service.id ? { ...s, isActive: !service.isActive } : s))
 );
 } catch (err) {
 alert("Failed to update service status");
 }
 }

 function startEdit(s: Service) {
 setEditingId(s.id);
 setEditForm({
 name: s.name,
 description: s.description || "",
 durationMinutes: s.durationMinutes,
 price: Number(s.price),
 pricingModel: s.pricingModel,
 category: s.category || "",
 bufferTimeMinutes: s.bufferTimeMinutes,
 allowGroupBooking: Boolean(s.allowGroupBooking),
 maxCapacity: Number(s.maxCapacity || 1),
 depositType: s.depositType || "NONE",
 depositValue: Number(s.depositValue || 0),
 cancellationFee: Number(s.cancellationFee || 0),
 cancellationWindowHours: Number(s.cancellationWindowHours ?? 24),
 });
 }

 function renderDepositBadge(s: Service) {
 if (!s.depositType || s.depositType === "NONE" || Number(s.depositValue) <= 0) {
 return null;
 }
 const label =
 s.depositType === "PERCENTAGE"
 ? `${Number(s.depositValue)}% Deposit`
 : `${formatBDT(s.depositValue)} Deposit`;
 return (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E3F5EC] text-[#181A1E]">
 <Wallet className="w-3 h-3" />
 {label}
 </span>
 );
 }

 return (
 <div className="space-y-6 bg-[#F8F8F6] text-[#181A1E] ">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
 Services, Group Capacity &amp; Deposit Rules
 </h1>
 <p className="text-xs text-[#73767D] mt-1">
 Configure appointment types, group booking party capacity, advance deposits, and late cancellation policies.
 </p>
 </div>

 <button
 onClick={() => {
 setShowAdd(!showAdd);
 setForm(emptyForm);
 }} className="inline-flex items-center px-4 py-2.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs transition"
 >
 <Plus className="w-4 h-4 mr-1.5" />
 Add New Service
 </button>
 </div>

 {/* Add Form */}
 {showAdd && (
 <form
 onSubmit={handleCreate} className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-5"
 >
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-bold text-[#181A1E] ">
 Add New Service &amp; Booking Rules
 </h3>
 <button type="button" onClick={() => setShowAdd(false)}>
 <X className="w-4 h-4 text-[#73767D] hover:text-[#181A1E]" />
 </button>
 </div>

 {/* Core Details */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div>
 <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
 Service Name *
 </label>
 <input
 type="text"
 required
 placeholder="e.g. Tooth Scaling & Polish"
 value={form.name}
 onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
 Duration (mins)
 </label>
 <input
 type="number"
 min={5}
 required
 value={form.durationMinutes}
 onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
 Price (৳ BDT)
 </label>
 <input
 type="number"
 min={0}
 value={form.price}
 onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
 Pricing Model
 </label>
 <select
 value={form.pricingModel}
 onChange={(e) => setForm({ ...form, pricingModel: e.target.value })} className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
 >
 {PRICING_MODELS.map((m) => (
 <option key={m} value={m}>
 {m.replace("_", " ")}
 </option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
 Buffer Time (mins)
 </label>
 <input
 type="number"
 min={0}
 value={form.bufferTimeMinutes}
 onChange={(e) => setForm({ ...form, bufferTimeMinutes: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
 />
 </div>
 <div>
 <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
 Category
 </label>
 <input
 type="text"
 placeholder="e.g. Dental, Consultation"
 value={form.category}
 onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
 />
 </div>
 </div>

 {/* Group Booking & Deposit/Cancellation Rules Section */}
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-[#EAEAEA] ">
 {/* Group Capacity Panel */}
 <div className="p-4 rounded-2xl bg-[#F8F8FA] border border-[#EAEAEA] space-y-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Users className="w-4 h-4 text-[#181A1E] " />
 <span className="text-xs font-bold text-[#181A1E] ">
 Group Booking &amp; Party Capacity
 </span>
 </div>
 <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold">
 <input
 type="checkbox"
 checked={form.allowGroupBooking}
 onChange={(e) =>
 setForm({
 ...form,
 allowGroupBooking: e.target.checked,
 maxCapacity: e.target.checked ? Math.max(2, form.maxCapacity) : 1,
 })
 } className="rounded border-[#EAEAEA] text-[#F5C94A] focus:ring-[#F5C94A]"
 />
 Allow Group Slots
 </label>
 </div>
 <div className="grid grid-cols-2 gap-3 items-center">
 <div>
 <label className="block text-[10px] font-bold text-[#73767D] uppercase mb-1">
 Max Attendees per Slot
 </label>
 <input
 type="number"
 min={1}
 max={200}
 disabled={!form.allowGroupBooking}
 value={form.allowGroupBooking ? form.maxCapacity : 1}
 onChange={(e) =>
 setForm({ ...form, maxCapacity: Math.max(1, Number(e.target.value)) })
 } className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs disabled:opacity-50"
 />
 </div>
 <p className="text-[11px] text-[#73767D] leading-relaxed">
 {form.allowGroupBooking
 ? `Up to ${form.maxCapacity} attendees can book or join the same time slot.`
 : "1-on-1 private appointment slot."}
 </p>
 </div>
 </div>

 {/* Deposit & Cancellation Policy Panel */}
 <div className="p-4 rounded-2xl bg-[#F8F8FA] border border-[#EAEAEA] space-y-3">
 <div className="flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-[#181A1E] " />
 <span className="text-xs font-bold text-[#181A1E] ">
 Deposit &amp; Late Cancellation Fee Rules
 </span>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
 <div>
 <label className="block text-[10px] font-bold text-[#73767D] uppercase mb-1">
 Deposit Type
 </label>
 <select
 value={form.depositType}
 onChange={(e) => setForm({ ...form, depositType: e.target.value })} className="w-full px-2.5 py-2 bg-white border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs"
 >
 {DEPOSIT_TYPES.map((d) => (
 <option key={d.value} value={d.value}>
 {d.label}
 </option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-[10px] font-bold text-[#73767D] uppercase mb-1">
 {form.depositType === "PERCENTAGE" ? "Deposit (%)" : "Deposit (৳)"}
 </label>
 <input
 type="number"
 min={0}
 disabled={form.depositType === "NONE"}
 value={form.depositType === "NONE" ? 0 : form.depositValue}
 onChange={(e) => setForm({ ...form, depositValue: Number(e.target.value) })} className="w-full px-2.5 py-2 bg-white border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs disabled:opacity-50"
 />
 </div>
 <div>
 <label className="block text-[10px] font-bold text-[#73767D] uppercase mb-1">
 Cancel Fee (৳)
 </label>
 <input
 type="number"
 min={0}
 value={form.cancellationFee}
 onChange={(e) => setForm({ ...form, cancellationFee: Number(e.target.value) })} className="w-full px-2.5 py-2 bg-white border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs"
 />
 </div>
 <div>
 <label className="block text-[10px] font-bold text-[#73767D] uppercase mb-1">
 Window (Hours)
 </label>
 <input
 type="number"
 min={1}
 value={form.cancellationWindowHours}
 onChange={(e) =>
 setForm({ ...form, cancellationWindowHours: Number(e.target.value) })
 } className="w-full px-2.5 py-2 bg-white border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs"
 />
 </div>
 </div>
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
 Description
 </label>
 <textarea
 rows={2}
 placeholder="Optional service description"
 value={form.description}
 onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none resize-none"
 />
 </div>

 <div className="flex justify-end space-x-2">
 <button
 type="button"
 onClick={() => setShowAdd(false)} className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-xs"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={submitting} className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs flex items-center disabled:opacity-60"
 >
 {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
 Save Service
 </button>
 </div>
 </form>
 )}

 {/* List */}
 {loading ? (
 <div className="py-20 flex justify-center">
 <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
 </div>
 ) : services.length === 0 ? (
 <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] py-12 text-center text-[#73767D] space-y-2">
 <Briefcase className="w-10 h-10 text-[#73767D] mx-auto" />
 <h3 className="text-sm font-bold text-[#181A1E] ">No services added</h3>
 <p className="text-xs text-[#73767D]">
 Create your first service so customers can book appointments.
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {services.map((s) =>
 editingId === s.id ? (
 /* Edit Mode Card */
 <div
 key={s.id} className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-3"
 >
 <div className="flex items-center justify-between mb-1">
 <span className="text-xs font-bold text-[#181A1E] uppercase">
 Editing Service &amp; Rules
 </span>
 <button onClick={() => setEditingId(null)}>
 <X className="w-4 h-4 text-[#73767D] hover:text-[#181A1E]" />
 </button>
 </div>
 <input className="w-full px-3 py-1.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
 value={editForm.name as string}
 onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
 placeholder="Service Name"
 />
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="text-[10px] text-[#73767D] font-semibold uppercase">
 Duration (m)
 </label>
 <input
 type="number"
 min={5} className="w-full px-2 py-1.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs"
 value={editForm.durationMinutes as number}
 onChange={(e) =>
 setEditForm({ ...editForm, durationMinutes: Number(e.target.value) })
 }
 />
 </div>
 <div>
 <label className="text-[10px] text-[#73767D] font-semibold uppercase">
 Price ৳
 </label>
 <input
 type="number"
 min={0} className="w-full px-2 py-1.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs"
 value={editForm.price as number}
 onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
 />
 </div>
 </div>

 {/* Group Capacity Edit */}
 <div className="p-2.5 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold uppercase text-[#181A1E] ">
 Group Booking
 </span>
 <input
 type="checkbox"
 checked={Boolean(editForm.allowGroupBooking)}
 onChange={(e) =>
 setEditForm({
 ...editForm,
 allowGroupBooking: e.target.checked,
 maxCapacity: e.target.checked
 ? Math.max(2, Number(editForm.maxCapacity || 2))
 : 1,
 })
 }
 />
 </div>
 {editForm.allowGroupBooking && (
 <div>
 <label className="text-[10px] text-[#73767D] font-semibold uppercase">
 Max Capacity
 </label>
 <input
 type="number"
 min={2} className="w-full px-2 py-1 bg-white border border-[#EAEAEA] rounded-lg text-xs"
 value={Number(editForm.maxCapacity || 2)}
 onChange={(e) =>
 setEditForm({ ...editForm, maxCapacity: Number(e.target.value) })
 }
 />
 </div>
 )}
 </div>

 {/* Deposit & Cancellation Edit */}
 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="text-[10px] text-[#73767D] font-semibold uppercase">
 Deposit Rule
 </label>
 <select className="w-full px-2 py-1.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs"
 value={(editForm.depositType as string) || "NONE"}
 onChange={(e) => setEditForm({ ...editForm, depositType: e.target.value })}
 >
 <option value="NONE">None</option>
 <option value="FIXED">Fixed (৳)</option>
 <option value="PERCENTAGE">Percent (%)</option>
 </select>
 </div>
 <div>
 <label className="text-[10px] text-[#73767D] font-semibold uppercase">
 Deposit Val
 </label>
 <input
 type="number"
 min={0}
 disabled={editForm.depositType === "NONE"} className="w-full px-2 py-1.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs disabled:opacity-50"
 value={Number(editForm.depositValue || 0)}
 onChange={(e) =>
 setEditForm({ ...editForm, depositValue: Number(e.target.value) })
 }
 />
 </div>
 <div>
 <label className="text-[10px] text-[#73767D] font-semibold uppercase">
 Cancel Fee ৳
 </label>
 <input
 type="number"
 min={0} className="w-full px-2 py-1.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs"
 value={Number(editForm.cancellationFee || 0)}
 onChange={(e) =>
 setEditForm({ ...editForm, cancellationFee: Number(e.target.value) })
 }
 />
 </div>
 <div>
 <label className="text-[10px] text-[#73767D] font-semibold uppercase">
 Cancel Window (h)
 </label>
 <input
 type="number"
 min={1} className="w-full px-2 py-1.5 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs"
 value={Number(editForm.cancellationWindowHours ?? 24)}
 onChange={(e) =>
 setEditForm({
 ...editForm,
 cancellationWindowHours: Number(e.target.value),
 })
 }
 />
 </div>
 </div>

 <button
 onClick={() => handleUpdate(s.id)}
 disabled={submitting} className="w-full flex items-center justify-center py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs disabled:opacity-60"
 >
 {submitting ? (
 <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
 ) : (
 <Save className="w-3.5 h-3.5 mr-1" />
 )}
 Save Changes
 </button>
 </div>
 ) : (
 /* View Mode Card */
 <div
 key={s.id}
 className={`bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-col justify-between ${
 s.isActive ? "" : "opacity-60"
 }`}
 >
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FBF3DC] text-[#181A1E]">
 {s.pricingModel.replace("_", " ")}
 </span>
 <span className="font-extrabold text-base text-[#181A1E] ">
 {formatBDT(s.price)}
 </span>
 </div>
 <h3 className="text-base font-bold text-[#181A1E] mt-1">
 {s.name}
 </h3>
 {s.category && <span className="text-[11px] text-[#73767D]">{s.category}</span>}
 {s.description && (
 <p className="text-xs text-[#73767D] mt-1 line-clamp-2">{s.description}</p>
 )}

 {/* Group Capacity & Deposit/Cancellation Badges */}
 <div className="flex flex-wrap items-center gap-1.5 mt-3">
 {s.allowGroupBooking && Number(s.maxCapacity) > 1 ? (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E2F2FA] text-[#181A1E]">
 <Users className="w-3 h-3" />
 Group up to {s.maxCapacity}
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F3F1E8] text-[#262930]">
 1-on-1 Slot
 </span>
 )}

 {renderDepositBadge(s)}

 {Number(s.cancellationFee) > 0 && (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAD4D6] text-[#181A1E]">
 <AlertCircle className="w-3 h-3" />
 {formatBDT(s.cancellationFee)} fee &lt;{s.cancellationWindowHours || 24}h
 </span>
 )}
 </div>
 </div>

 <div className="pt-4 mt-4 border-t border-[#EAEAEA] flex items-center justify-between text-xs text-[#73767D]">
 <span className="flex items-center font-medium text-[#181A1E] ">
 <Clock className="w-3.5 h-3.5 mr-1 text-[#73767D]" />
 {s.durationMinutes}m
 {s.bufferTimeMinutes > 0 && (
 <span className="ml-1 text-[#73767D]">+{s.bufferTimeMinutes}m buffer</span>
 )}
 </span>
 <div className="flex items-center space-x-2">
 <button
 onClick={() => startEdit(s)} className="p-1.5 rounded-xl bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930]"
 title="Edit"
 >
 <Pencil className="w-3.5 h-3.5" />
 </button>
 <button
 onClick={() => handleToggleActive(s)} className="p-1.5 rounded-xl bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930]"
 title={s.isActive ? "Deactivate" : "Activate"}
 >
 {s.isActive ? (
 <ToggleRight className="w-4 h-4 text-[#181A1E]" />
 ) : (
 <ToggleLeft className="w-4 h-4 text-[#73767D]" />
 )}
 </button>
 <span
 className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
 s.isActive
 ? "bg-[#E3F5EC] text-[#181A1E]"
 : "bg-[#FAD4D6] text-[#181A1E]"
 }`}
 >
 {s.isActive ? "Active" : "Inactive"}
 </span>
 </div>
 </div>
 </div>
 )
 )}
 </div>
 )}
 </div>
 );
}
