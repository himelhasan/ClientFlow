"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  CreditCard,
  Loader2,
  X,
} from "lucide-react";
import { formatBDT, formatBdDate } from "@/lib/utils/bangladesh";

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Payment modal state
  const [payingQuoteId, setPayingQuoteId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    provider: "BKASH",
    transactionId: "",
  });

  // Quote creation form
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    validUntil: "",
    notes: "",
  });
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 1000 },
  ]);

  async function loadQuotes() {
    setLoading(true);
    try {
      const url =
        statusFilter === "ALL"
          ? "/api/v1/quotes"
          : `/api/v1/quotes?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      setQuotes(data.quotes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuotes();
  }, [statusFilter]);

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 500 }]);
  }

  function removeItem(idx: number) {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof LineItem, val: string | number) {
    setItems(
      items.map((it, i) => (i === idx ? { ...it, [field]: val } : it))
    );
  }

  const grandTotal = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
    0
  );

  async function handleCreateQuote(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          validUntil: "",
          notes: "",
        });
        setItems([{ description: "", quantity: 1, unitPrice: 1000 }]);
        await loadQuotes();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create quote");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusUpdate(quoteId: string, status: string) {
    await fetch("/api/v1/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId, status }),
    });
    setQuotes((prev) =>
      prev.map((q) => (q.id === quoteId ? { ...q, status } : q))
    );
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payingQuoteId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/quotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: payingQuoteId,
          status: "ACCEPTED",
          payment: paymentForm,
        }),
      });
      if (res.ok) {
        setPayingQuoteId(null);
        setPaymentForm({ amount: 0, provider: "BKASH", transactionId: "" });
        await loadQuotes();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
            Quotes &amp; Payments
          </h1>
          <p className="text-xs text-[#73767D] mt-1">
            Create itemized price estimates and record bKash, Nagad, or Cash payments.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            {["ALL", "SENT", "ACCEPTED", "REJECTED"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 transition ${
                  statusFilter === s
                    ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl"
                    : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Create Quote
          </button>
        </div>
      </div>

      {/* Create Quote Form */}
      {showCreate && (
        <form
          onSubmit={handleCreateQuote}
          className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#181A1E]">New Price Quote</h3>
            <button type="button" onClick={() => setShowCreate(false)}>
              <X className="w-4 h-4 text-[#73767D] hover:text-[#181A1E]" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Customer Name *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Tanvir Ahmed"
                value={form.customerName}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Phone *
              </label>
              <input
                required
                type="text"
                placeholder="017XXXXXXXX"
                value={form.customerPhone}
                onChange={(e) =>
                  setForm({ ...form, customerPhone: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="Optional"
                value={form.customerEmail}
                onChange={(e) =>
                  setForm({ ...form, customerEmail: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) =>
                  setForm({ ...form, validUntil: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-xs"
              />
            </div>
          </div>

          {/* Line items */}
          <div className="bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#181A1E] uppercase">
                Line Items
              </label>
              <button
                type="button"
                onClick={addItem}
                className="px-2.5 py-1 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-xs flex items-center"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
              </button>
            </div>

            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input
                  required
                  type="text"
                  placeholder="Service or item description"
                  value={it.description}
                  onChange={(e) =>
                    updateItem(idx, "description", e.target.value)
                  }
                  className="col-span-6 px-3 py-2 bg-white border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-xs"
                />
                <input
                  required
                  type="number"
                  min={1}
                  placeholder="Qty"
                  value={it.quantity}
                  onChange={(e) =>
                    updateItem(idx, "quantity", Number(e.target.value))
                  }
                  className="col-span-2 px-3 py-2 bg-white border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-xs"
                />
                <input
                  required
                  type="number"
                  min={0}
                  placeholder="Unit Price (৳)"
                  value={it.unitPrice}
                  onChange={(e) =>
                    updateItem(idx, "unitPrice", Number(e.target.value))
                  }
                  className="col-span-3 px-3 py-2 bg-white border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-xs"
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="col-span-1 flex justify-center text-[#73767D] hover:text-[#9E2A2B]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#EAEAEA]">
            <div className="text-sm font-extrabold text-[#181A1E]">
              Total Estimate:{" "}
              <span className="text-[#181A1E]">{formatBDT(grandTotal)}</span>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs flex items-center"
              >
                {submitting && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                )}
                Save &amp; Send Quote
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Record Payment Modal */}
      {payingQuoteId && (
        <form
          onSubmit={handleRecordPayment}
          className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#181A1E] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#181A1E]" /> Record Payment
            </h3>
            <button type="button" onClick={() => setPayingQuoteId(null)}>
              <X className="w-4 h-4 text-[#73767D]" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Amount (৳ BDT) *
              </label>
              <input
                required
                type="number"
                min={1}
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    amount: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                Payment Method
              </label>
              <select
                value={paymentForm.provider}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, provider: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-xs"
              >
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="SSLCOMMERZ">SSLCommerz / Card</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#181A1E] uppercase mb-1">
                TrxID / Reference
              </label>
              <input
                type="text"
                placeholder="e.g. BKA82910X"
                value={paymentForm.transactionId}
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    transactionId: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      )}

      {/* Quotes Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
        </div>
      ) : quotes.length === 0 ? (
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] text-center space-y-2">
          <FileText className="w-10 h-10 text-[#73767D] mx-auto" />
          <h3 className="text-sm font-bold text-[#181A1E]">No quotes yet</h3>
          <p className="text-xs text-[#73767D]">
            Create itemized price quotes for custom service inquiries and record bKash/Nagad payments.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F8FA] border-b border-[#EAEAEA] text-[#73767D] uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Quote #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Paid</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {quotes.map((q) => {
                  const totalPaid = (q.payments || []).reduce(
                    (s: number, p: any) => s + Number(p.amount),
                    0
                  );
                  const isExpanded = expandedId === q.id;
                  return (
                    <>
                      <tr
                        key={q.id}
                        onClick={() =>
                          setExpandedId(isExpanded ? null : q.id)
                        }
                        className="hover:bg-[#F8F8FA] cursor-pointer transition"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-[#181A1E]">
                          {q.quoteNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-[#181A1E]">
                            {q.customer?.name}
                          </p>
                          <p className="text-[11px] font-mono text-[#73767D]">
                            {q.customer?.phone}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#181A1E]">
                          {formatBDT(q.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#181A1E]">
                          {formatBDT(totalPaid)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              q.status === "ACCEPTED"
                                ? "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]"
                                : q.status === "REJECTED"
                                ? "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2]"
                                : "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]"
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#73767D]">
                          {formatBdDate(q.createdAt)}
                        </td>
                        <td
                          className="py-3.5 px-4 text-right space-x-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setPayingQuoteId(q.id);
                              setPaymentForm({
                                amount: Math.max(
                                  0,
                                  Number(q.totalAmount) - totalPaid
                                ),
                                provider: "BKASH",
                                transactionId: "",
                              });
                            }}
                            className="px-2.5 py-1 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-[11px]"
                          >
                            + Payment
                          </button>
                          {q.status !== "ACCEPTED" && (
                            <button
                              onClick={() => handleStatusUpdate(q.id, "ACCEPTED")}
                              className="px-2.5 py-1 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-[11px]"
                            >
                              Accept
                            </button>
                          )}
                          {q.status !== "REJECTED" && (
                            <button
                              onClick={() => handleStatusUpdate(q.id, "REJECTED")}
                              className="px-2.5 py-1 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-[11px]"
                            >
                              Reject
                            </button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${q.id}-details`}>
                          <td colSpan={7} className="px-4 py-3">
                            <div className="bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-[#73767D] uppercase mb-1.5">
                                  Line Items
                                </p>
                                <div className="space-y-1">
                                  {(q.items || []).map((it: any) => (
                                    <div
                                      key={it.id}
                                      className="flex justify-between text-xs bg-white px-3 py-1.5 rounded-xl border border-[#EAEAEA]"
                                    >
                                      <span className="text-[#181A1E]">
                                        {it.description} × {it.quantity}
                                      </span>
                                      <span className="font-bold text-[#181A1E]">
                                        {formatBDT(it.amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-[#73767D] uppercase mb-1.5">
                                  Payments Recorded
                                </p>
                                {(q.payments || []).length === 0 ? (
                                  <p className="text-xs text-[#73767D] italic">
                                    No payments recorded yet.
                                  </p>
                                ) : (
                                  <div className="space-y-1">
                                    {q.payments.map((p: any) => (
                                      <div
                                        key={p.id}
                                        className="flex justify-between text-xs bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9] px-3 py-1.5 rounded-xl"
                                      >
                                        <span>
                                          <strong>{p.provider}</strong>{" "}
                                          {p.transactionId
                                            ? `(${p.transactionId})`
                                            : ""}
                                        </span>
                                        <span className="font-bold">
                                          {formatBDT(p.amount)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
