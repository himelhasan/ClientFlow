"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  CreditCard,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
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
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Quotes &amp; Payments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create itemized price estimates and record bKash, Nagad, or Cash payments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold">
            {["ALL", "SENT", "ACCEPTED", "REJECTED"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === s
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
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
          className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">New Price Quote</h3>
            <button type="button" onClick={() => setShowCreate(false)}>
              <X className="w-4 h-4 text-slate-400 hover:text-slate-700" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="Optional"
                value={form.customerEmail}
                onChange={(e) =>
                  setForm({ ...form, customerEmail: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={form.validUntil}
                onChange={(e) =>
                  setForm({ ...form, validUntil: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Line Items
              </label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center"
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
                  className="col-span-6 px-3 py-2 border border-slate-200 rounded-lg text-xs"
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
                  className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-xs"
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
                  className="col-span-3 px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="col-span-1 flex justify-center text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="text-sm font-extrabold text-slate-900">
              Total Estimate:{" "}
              <span className="text-emerald-700">{formatBDT(grandTotal)}</span>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 flex items-center"
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
          className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" /> Record Payment
            </h3>
            <button type="button" onClick={() => setPayingQuoteId(null)}>
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
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
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Payment Method
              </label>
              <select
                value={paymentForm.provider}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, provider: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="SSLCOMMERZ">SSLCommerz / Card</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
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
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      )}

      {/* Quotes Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : quotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-2">
          <FileText className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No quotes yet</h3>
          <p className="text-xs text-slate-400">
            Create itemized price quotes for custom service inquiries and record bKash/Nagad payments.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase font-semibold">
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
            <tbody className="divide-y divide-slate-100">
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
                      className="hover:bg-slate-50/60 cursor-pointer transition"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {q.quoteNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">
                          {q.customer?.name}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500">
                          {q.customer?.phone}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatBDT(q.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        {formatBDT(totalPaid)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            q.status === "ACCEPTED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : q.status === "REJECTED"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
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
                          className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px]"
                        >
                          + Payment
                        </button>
                        {q.status !== "ACCEPTED" && (
                          <button
                            onClick={() => handleStatusUpdate(q.id, "ACCEPTED")}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-emerald-50 text-slate-700 text-[11px] font-semibold"
                          >
                            Accept
                          </button>
                        )}
                        {q.status !== "REJECTED" && (
                          <button
                            onClick={() => handleStatusUpdate(q.id, "REJECTED")}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-red-50 text-slate-700 text-[11px] font-semibold"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${q.id}-details`} className="bg-slate-50/70">
                        <td colSpan={7} className="px-6 py-4 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                                Line Items
                              </p>
                              <div className="space-y-1">
                                {(q.items || []).map((it: any) => (
                                  <div
                                    key={it.id}
                                    className="flex justify-between text-xs bg-white px-3 py-1.5 rounded border border-slate-200/70"
                                  >
                                    <span>
                                      {it.description} × {it.quantity}
                                    </span>
                                    <span className="font-bold">
                                      {formatBDT(it.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                                Payments Recorded
                              </p>
                              {(q.payments || []).length === 0 ? (
                                <p className="text-xs text-slate-400 italic">
                                  No payments recorded yet.
                                </p>
                              ) : (
                                <div className="space-y-1">
                                  {q.payments.map((p: any) => (
                                    <div
                                      key={p.id}
                                      className="flex justify-between text-xs bg-white px-3 py-1.5 rounded border border-emerald-200/80"
                                    >
                                      <span>
                                        <strong>{p.provider}</strong>{" "}
                                        {p.transactionId
                                          ? `(${p.transactionId})`
                                          : ""}
                                      </span>
                                      <span className="font-bold text-emerald-700">
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
      )}
    </div>
  );
}
