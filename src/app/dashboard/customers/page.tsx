"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Users,
  Search,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import { formatBDT, formatBdDate } from "@/lib/utils/bangladesh";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerCount {
  leads: number;
  bookings: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  normalizedPhone: string;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  tags: string[] | null;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: string | number;
  createdAt: string;
  _count: CustomerCount;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[180, 120, 140, 80, 80, 80].map((w, i) => (
        <td key={i} className="py-3.5 px-4">
          <div
            className="h-3 rounded-full bg-slate-200"
            style={{ width: w }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Expanded detail panel ────────────────────────────────────────────────────

function ExpandedDetail({ customer }: { customer: Customer }) {
  const tags: string[] = Array.isArray(customer.tags) ? customer.tags : [];

  return (
    <tr className="bg-slate-50/80">
      <td colSpan={6} className="px-4 pb-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 pl-1">
          {/* Contact detail */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Contact
            </p>
            {customer.phone && (
              <p className="flex items-center gap-1.5 text-xs text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono">{customer.phone}</span>
              </p>
            )}
            {customer.email && (
              <p className="flex items-center gap-1.5 text-xs text-slate-700">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="break-all">{customer.email}</span>
              </p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Address
            </p>
            {customer.address || customer.city ? (
              <p className="text-xs text-slate-700 leading-relaxed">
                {[customer.address, customer.city].filter(Boolean).join(", ")}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">Not provided</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Notes
            </p>
            {customer.notes ? (
              <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                {customer.notes}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">No notes</p>
            )}
          </div>

          {/* Tags + lead count */}
          <div className="space-y-2">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Tags
              </p>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No tags</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Leads
              </p>
              <p className="text-xs font-bold text-slate-800">
                {customer._count.leads}{" "}
                <span className="font-normal text-slate-500">
                  {customer._count.leads === 1 ? "lead" : "leads"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadCustomers = useCallback(
    async (searchTerm: string, pageNum: number) => {
      // Cancel any in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: "20",
          ...(searchTerm ? { search: searchTerm } : {}),
        });
        const res = await fetch(`/api/v1/customers?${params}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setCustomers(data.customers ?? []);
        setTotal(data.total ?? 0);
        setPages(data.pages ?? 1);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Failed to load customers:", err);
        }
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Re-fetch when search or page changes
  useEffect(() => {
    loadCustomers(debouncedSearch, page);
  }, [debouncedSearch, page, loadCustomers]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
    setExpandedId(null);
  }, [debouncedSearch]);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-700" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
              Customers
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 ml-10">
            {total > 0 ? (
              <>
                <span className="font-bold text-slate-800">{total}</span>{" "}
                customer{total !== 1 ? "s" : ""} in your database
              </>
            ) : (
              "Manage and search your customer database"
            )}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone or email…"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-600 animate-spin" />
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4 text-right">Bookings</th>
                <th className="py-3.5 px-4 text-right">Revenue</th>
                <th className="py-3.5 px-4 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && customers.length === 0
                ? Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                : customers.map((c) => (
                    <>
                      {/* Main row */}
                      <tr
                        key={c.id}
                        onClick={() => toggleExpand(c.id)}
                        className="hover:bg-slate-50/70 cursor-pointer transition"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center justify-center shrink-0 select-none">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">
                                {c.name}
                              </p>
                              {c.city && (
                                <p className="text-[10px] text-slate-400">
                                  {c.city}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-mono text-slate-700">{c.phone}</p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {c.email ? (
                            <span className="truncate max-w-[160px] block">
                              {c.email}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-bold text-slate-900">
                            {c.totalBookings}
                          </span>
                          {c.completedBookings > 0 && (
                            <span className="ml-1 text-[10px] text-slate-400">
                              ({c.completedBookings} done)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                          {formatBDT(c.totalRevenue)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 text-slate-500">
                            <span>{formatBdDate(c.createdAt)}</span>
                            {expandedId === c.id ? (
                              <ChevronUp className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail */}
                      {expandedId === c.id && (
                        <ExpandedDetail key={`${c.id}-detail`} customer={c} />
                      )}
                    </>
                  ))}

              {/* Empty state */}
              {!loading && customers.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="py-16 text-center space-y-3">
                      <Users className="w-10 h-10 text-slate-200 mx-auto" />
                      <p className="text-sm font-bold text-slate-700">
                        {search
                          ? "No customers match your search"
                          : "No customers yet"}
                      </p>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        {search
                          ? "Try a different name, phone number, or email address."
                          : "Customers are created automatically when leads submit your booking forms."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Page{" "}
              <span className="font-bold text-slate-800">{page}</span> of{" "}
              <span className="font-bold text-slate-800">{pages}</span> ·{" "}
              {total} customer{total !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages || loading}
                className="px-3 py-1.5 rounded-lg border border-slate-200 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
