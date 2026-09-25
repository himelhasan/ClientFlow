"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Users,
  Search,
  Phone,
  Mail,
  Loader2,
  Download,
  Upload,
  Plus,
  Tag,
  Trash2,
  Bell,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  Sliders,
  MessageSquare,
  ShieldCheck,
  Clock,
  Sparkles,
  Building2,
} from "lucide-react";
import { formatBDT, formatBdDate } from "@/lib/utils/bangladesh";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerBooking {
  id: string;
  bookingNumber: string;
  status: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number | string;
  service?: {
    id: string;
    name: string;
    durationMinutes: number;
    price: number | string;
  };
  staff?: {
    id: string;
    name: string;
  };
}

interface CustomFieldDef {
  id: string;
  entityType: string;
  key: string;
  label: string;
  fieldType: string;
  options?: string[] | null;
  required: boolean;
  defaultValue?: string | null;
}

interface CustomFieldVal {
  id: string;
  definitionId: string;
  key?: string;
  label?: string;
  fieldType?: string;
  value: any;
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
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: string | number;
  optInWhatsapp: boolean;
  optInSms: boolean;
  optInEmail: boolean;
  preferredChannel: string;
  preferredLanguage: string;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  createdAt: string;
  _count: {
    leads: number;
    bookings: number;
  };
  bookings?: CustomerBooking[];
  customFieldValues?: CustomFieldVal[];
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

const BOOKING_STATUS_BADGE: Record<string, string> = {
  COMPLETED: "bg-[#E3F5EC] text-[#184E37] border-[#CBEAD9]",
  CONFIRMED: "bg-[#E2F2FA] text-[#174A67] border-[#C4E3F5]",
  PENDING: "bg-[#FBF3DC] text-[#5B4712] border-[#F2E2B6]",
  NO_SHOW: "bg-[#FAD4D6] text-[#9E2A2B] border-[#F5BFC2]",
  CANCELLED: "bg-[#F8F8FA] text-[#73767D] border-[#EAEAEA]",
};

const SAMPLE_CSV = `name,phone,email,city,tags,preferredLanguage
Ayesha Siddiqua,+8801715001122,ayesha@example.com,Dhaka,VIP|Bridal,bn
Mahmudul Hasan,+8801819334455,mahmud@example.com,Dhaka,Corporate,en
Rubina Yasmin,+8801911667788,rubina@example.com,Sylhet,Regular,bn`;

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[28, 170, 120, 140, 80, 80, 90].map((w, i) => (
        <td key={i} className="py-3.5 px-4">
          <div
            className="h-3 rounded-full bg-[#EAEAEA]"
            style={{ width: w }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [loading, setLoading] = useState(true);

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("ALL");

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [showBulkTagPrompt, setShowBulkTagPrompt] = useState(false);
  const [showBulkCommPrompt, setShowBulkCommPrompt] = useState(false);

  // CSV Import Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvInput, setCsvInput] = useState(SAMPLE_CSV);
  const [importing, setImporting] = useState(false);

  // New Customer Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    city: "Dhaka",
    tags: "VIP, Regular",
    preferredChannel: "WHATSAPP",
    preferredLanguage: "en",
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Customer 360 Drawer
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [drawerTab, setDrawerTab] = useState<"BOOKINGS" | "COMM_PREFS" | "CUSTOM_FIELDS">("BOOKINGS");
  const [savingDrawer, setSavingDrawer] = useState(false);
  const [rebookingId, setRebookingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Editable state inside Customer 360 Drawer
  const [commPrefsForm, setCommPrefsForm] = useState({
    optInWhatsapp: true,
    optInSms: true,
    optInEmail: true,
    preferredChannel: "WHATSAPP",
    preferredLanguage: "en",
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
  });
  const [customFieldsForm, setCustomFieldsForm] = useState<Record<string, any>>({});

  const abortRef = useRef<AbortController | null>(null);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  }

  const loadCustomers = useCallback(
    async (searchTerm: string, pageNum: number, businessFilter = selectedBusinessId) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: "20",
          ...(searchTerm ? { search: searchTerm } : {}),
          ...(businessFilter && businessFilter !== "ALL" ? { businessId: businessFilter } : {}),
        });
        const res = await fetch(`/api/v1/customers?${params}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setCustomers(data.customers ?? []);
        setCustomFieldDefs(data.customFieldDefs ?? []);
        setTotal(data.total ?? 0);
        setPages(data.pages ?? 1);
        if (data.isSuperAdmin !== undefined) setIsSuperAdmin(data.isSuperAdmin);
        if (data.businesses) setBusinesses(data.businesses);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Failed to load customers:", err);
        }
      } finally {
        setLoading(false);
      }
    },
    [selectedBusinessId]
  );

  useEffect(() => {
    loadCustomers(debouncedSearch, page, selectedBusinessId);
  }, [debouncedSearch, page, selectedBusinessId, loadCustomers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Open Customer 360 Drawer
  function openCustomer360(customer: Customer) {
    setActiveCustomer(customer);
    setDrawerTab("BOOKINGS");
    setCommPrefsForm({
      optInWhatsapp: customer.optInWhatsapp ?? true,
      optInSms: customer.optInSms ?? true,
      optInEmail: customer.optInEmail ?? true,
      preferredChannel: customer.preferredChannel || "WHATSAPP",
      preferredLanguage: customer.preferredLanguage || "en",
      quietHoursStart: customer.quietHoursStart || "22:00",
      quietHoursEnd: customer.quietHoursEnd || "08:00",
    });

    const cfMap: Record<string, any> = {};
    for (const def of customFieldDefs) {
      const existing = customer.customFieldValues?.find(
        (v) => v.definitionId === def.id || v.key === def.key
      );
      cfMap[def.id] =
        existing?.value !== undefined
          ? existing.value
          : def.defaultValue ?? (def.fieldType === "BOOLEAN" ? false : "");
    }
    setCustomFieldsForm(cfMap);
  }

  // Checkbox selection helpers
  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === customers.length && customers.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map((c) => c.id));
    }
  }

  // Export CSV
  function handleExportCsv(onlySelected = false) {
    const idsQuery =
      onlySelected && selectedIds.length > 0
        ? `&ids=${encodeURIComponent(selectedIds.join(","))}`
        : "";
    window.open(`/api/v1/customers/bulk?format=csv${idsQuery}`, "_blank");
    showToast(
      onlySelected
        ? `Exporting ${selectedIds.length} selected customer(s) to CSV…`
        : "Exporting full CRM database to CSV…"
    );
  }

  // Bulk Tag
  async function handleBulkTag() {
    if (!bulkTagInput.trim() || selectedIds.length === 0) return;
    setBulkBusy(true);
    try {
      const tagsToAdd = bulkTagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch("/api/v1/customers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_TAG",
          customerIds: selectedIds,
          tags: tagsToAdd,
          mode: "ADD",
        }),
      });
      if (res.ok) {
        setCustomers((prev) =>
          prev.map((c) => {
            if (!selectedIds.includes(c.id)) return c;
            const existing = Array.isArray(c.tags) ? c.tags : [];
            return {
              ...c,
              tags: Array.from(new Set([...existing, ...tagsToAdd])),
            };
          })
        );
        showToast(`Added tag(s) to ${selectedIds.length} customers`);
        setBulkTagInput("");
        setShowBulkTagPrompt(false);
      }
    } finally {
      setBulkBusy(false);
    }
  }

  // Bulk Communication Preferences
  async function handleBulkCommUpdate(prefs: {
    optInWhatsapp?: boolean;
    optInSms?: boolean;
    optInEmail?: boolean;
  }) {
    if (selectedIds.length === 0) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/v1/customers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_COMM_PREFS",
          customerIds: selectedIds,
          prefs,
        }),
      });
      if (res.ok) {
        setCustomers((prev) =>
          prev.map((c) =>
            selectedIds.includes(c.id) ? { ...c, ...prefs } : c
          )
        );
        showToast(
          `Updated communication preferences for ${selectedIds.length} customers`
        );
        setShowBulkCommPrompt(false);
      }
    } finally {
      setBulkBusy(false);
    }
  }

  // Bulk Delete
  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/v1/customers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_DELETE",
          customerIds: selectedIds,
        }),
      });
      if (res.ok) {
        setCustomers((prev) =>
          prev.filter((c) => !selectedIds.includes(c.id))
        );
        setTotal((t) => Math.max(0, t - selectedIds.length));
        showToast(`Deleted ${selectedIds.length} customer(s)`);
        setSelectedIds([]);
      }
    } finally {
      setBulkBusy(false);
    }
  }

  // CSV Import
  async function handleImportCsv(e: React.FormEvent) {
    e.preventDefault();
    if (!csvInput.trim()) return;
    setImporting(true);
    try {
      const res = await fetch("/api/v1/customers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "IMPORT_CSV",
          csvText: csvInput,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data.customers) && data.customers.length > 0) {
          setCustomers((prev) => [...data.customers, ...prev]);
          setTotal((t) => t + (data.importedCount || data.customers.length));
        } else {
          loadCustomers(debouncedSearch, 1);
        }
        setShowImportModal(false);
        showToast(
          `Imported ${data.importedCount ?? 0} new & updated ${
            data.updatedCount ?? 0
          } customers`
        );
      }
    } finally {
      setImporting(false);
    }
  }

  // Create Single Customer
  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) return;
    setCreatingCustomer(true);
    try {
      const tags = newCustomer.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch("/api/v1/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCustomer,
          tags,
        }),
      });
      const data = await res.json();
      if (res.ok && data.customer) {
        setCustomers((prev) => [data.customer, ...prev]);
        setTotal((t) => t + 1);
        setShowNewModal(false);
        setNewCustomer({
          name: "",
          phone: "",
          email: "",
          city: "Dhaka",
          tags: "VIP, Regular",
          preferredChannel: "WHATSAPP",
          preferredLanguage: "en",
        });
        showToast(`Created customer ${data.customer.name}`);
      }
    } finally {
      setCreatingCustomer(false);
    }
  }

  // Save Communication Preferences & Custom Fields in Customer 360 Drawer
  async function handleSaveCustomer360() {
    if (!activeCustomer) return;
    setSavingDrawer(true);
    try {
      const res = await fetch("/api/v1/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeCustomer.id,
          ...commPrefsForm,
          customFields: customFieldsForm,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const updatedCust: Customer = {
          ...activeCustomer,
          ...commPrefsForm,
          customFieldValues: customFieldDefs.map((d) => ({
            id: `cfv-${d.id}`,
            definitionId: d.id,
            key: d.key,
            label: d.label,
            fieldType: d.fieldType,
            value: customFieldsForm[d.id],
          })),
        };
        setActiveCustomer(updatedCust);
        setCustomers((prev) =>
          prev.map((c) => (c.id === activeCustomer.id ? updatedCust : c))
        );
        showToast("Customer 360 preferences & custom fields saved!");
      }
    } finally {
      setSavingDrawer(false);
    }
  }

  // 1-Click Rebook inside Customer 360
  async function handleOneClickRebook(booking: CustomerBooking) {
    if (!activeCustomer) return;
    setRebookingId(booking.id);
    try {
      const res = await fetch("/api/v1/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "QUICK_REBOOK",
          customerId: activeCustomer.id,
          serviceId: booking.service?.id,
          serviceName: booking.service?.name || "Follow-up Appointment",
          staffId: booking.staff?.id,
          price: booking.price,
        }),
      });
      const data = await res.json();
      if (res.ok && data.booking) {
        const updatedBookings = [
          data.booking,
          ...(activeCustomer.bookings || []),
        ];
        const updatedCustomer = {
          ...activeCustomer,
          totalBookings: (activeCustomer.totalBookings || 0) + 1,
          bookings: updatedBookings,
        };
        setActiveCustomer(updatedCustomer);
        setCustomers((prev) =>
          prev.map((c) => (c.id === activeCustomer.id ? updatedCustomer : c))
        );
        showToast(
          `Rebooked ${
            booking.service?.name || "Appointment"
          } (${data.booking.bookingNumber})`
        );
      }
    } finally {
      setRebookingId(null);
    }
  }

  // Calculate preview rows for CSV modal
  const csvPreviewRows = csvInput
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean)
    .map((line) => {
      const cols = line.split(",");
      return {
        name: cols[0] || "",
        phone: cols[1] || "",
        email: cols[2] || "",
        city: cols[3] || "Dhaka",
        tags: cols[4] || "Imported",
      };
    });

  return (
    <div className="space-y-6 pb-20 bg-[#F8F8F6] text-[#181A1E]">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#181A1E] text-white px-4 py-3 rounded-2xl shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex items-center gap-2.5 text-xs font-semibold border border-[#2D3139]">
          <CheckCircle2 className="w-4 h-4 text-[#F5C94A] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FBF3DC] border border-[#F2E2B6] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#5B4712]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
                  Customers & CRM 360
                </h1>
                {isSuperAdmin && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#174A67]" />
                    Super User Unified
                  </span>
                )}
              </div>
              <p className="text-xs text-[#73767D]">
                {total > 0 ? (
                  <>
                    <span className="font-bold text-[#181A1E]">{total}</span>{" "}
                    customer{total !== 1 ? "s" : ""}{isSuperAdmin ? " across all businesses" : ""} · Click any customer for
                    360° profile, booking history & custom fields
                  </>
                ) : (
                  "Manage customer relationships, communication preferences & custom fields"
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#73767D] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone or email…"
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#EAEAEA] rounded-xl text-[#181A1E] placeholder-[#73767D] focus:border-[#F5C94A] focus:outline-none"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#181A1E] animate-spin" />
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#181A1E] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>

          <button
            type="button"
            onClick={() => handleExportCsv(false)}
            className="px-3.5 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#181A1E] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Super User Multi-Business Filter Bar */}
      {(isSuperAdmin || businesses.length > 1) && (
        <div className="bg-white p-3.5 rounded-2xl border border-[#EAEAEA] shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#E2F2FA] text-[#174A67] flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#181A1E]">Cross-Business CRM Filter:</span>
              <span className="text-[11px] text-[#73767D] ml-1.5 hidden sm:inline">Viewing customers across multi-tenant businesses</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedBusinessId("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedBusinessId === "ALL"
                  ? "bg-[#181A1E] text-white shadow-sm"
                  : "bg-[#F8F8FA] hover:bg-[#EAEAEA] text-[#73767D]"
              }`}
            >
              <span>All Businesses</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#E2F2FA] text-[#174A67]">Unified</span>
            </button>
            {businesses.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBusinessId(b.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedBusinessId === b.id
                    ? "bg-[#181A1E] text-white shadow-sm"
                    : "bg-[#F8F8FA] hover:bg-[#EAEAEA] text-[#73767D]"
                }`}
              >
                <Building2 className="w-3 h-3 text-[#174A67]" />
                <span>{b.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Bulk CRM Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#181A1E] text-white rounded-2xl p-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] border border-[#2E323B] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-[#F5C94A] text-[#181A1E] text-xs font-extrabold">
              {selectedIds.length} Selected
            </span>
            <span className="text-xs text-[#D1D5DB]">
              Bulk CRM Operations
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Tag */}
            {showBulkTagPrompt ? (
              <div className="flex items-center gap-1.5 bg-[#262930] px-2.5 py-1 rounded-xl border border-[#3B404B]">
                <input
                  type="text"
                  value={bulkTagInput}
                  onChange={(e) => setBulkTagInput(e.target.value)}
                  placeholder="e.g. VIP, Ramadan-Offer"
                  className="bg-transparent text-xs text-white placeholder-[#9CA3AF] focus:outline-none w-36"
                />
                <button
                  type="button"
                  onClick={handleBulkTag}
                  disabled={bulkBusy}
                  className="px-2.5 py-1 bg-[#F5C94A] text-[#181A1E] rounded-lg text-[11px] font-bold"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkTagPrompt(false)}
                  className="text-[#9CA3AF] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowBulkTagPrompt(true)}
                className="px-3 py-1.5 bg-[#262930] hover:bg-[#323640] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Tag className="w-3.5 h-3.5 text-[#F5C94A]" />
                Bulk Tag
              </button>
            )}

            {/* Bulk Opt-In/Opt-Out */}
            {showBulkCommPrompt ? (
              <div className="flex items-center gap-1.5 bg-[#262930] px-2.5 py-1 rounded-xl border border-[#3B404B]">
                <button
                  type="button"
                  onClick={() =>
                    handleBulkCommUpdate({
                      optInWhatsapp: true,
                      optInSms: true,
                      optInEmail: true,
                    })
                  }
                  className="px-2 py-1 bg-[#E3F5EC] text-[#184E37] rounded-lg text-[10px] font-bold"
                >
                  Opt-In All Channels
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleBulkCommUpdate({
                      optInWhatsapp: false,
                      optInSms: false,
                      optInEmail: false,
                    })
                  }
                  className="px-2 py-1 bg-[#FAD4D6] text-[#9E2A2B] rounded-lg text-[10px] font-bold"
                >
                  Opt-Out Marketing
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkCommPrompt(false)}
                  className="text-[#9CA3AF] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowBulkCommPrompt(true)}
                className="px-3 py-1.5 bg-[#262930] hover:bg-[#323640] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Bell className="w-3.5 h-3.5 text-[#F5C94A]" />
                Opt-in / Opt-out
              </button>
            )}

            {/* Export Selected CSV */}
            <button
              type="button"
              onClick={() => handleExportCsv(true)}
              className="px-3 py-1.5 bg-[#262930] hover:bg-[#323640] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-[#F5C94A]" />
              Export Selected CSV
            </button>

            {/* Bulk Delete */}
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={bulkBusy}
              className="px-3 py-1.5 bg-[#9E2A2B] hover:bg-[#7F2021] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2 py-1.5 text-xs text-[#9CA3AF] hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F8FA] border-b border-[#EAEAEA] text-[#73767D] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      customers.length > 0 &&
                      selectedIds.length === customers.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-[#D1D5DB] text-[#181A1E] focus:ring-[#F5C94A]"
                  />
                </th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Phone & Channels</th>
                <th className="py-3.5 px-4">Tags</th>
                <th className="py-3.5 px-4 text-right">Bookings</th>
                <th className="py-3.5 px-4 text-right">Total Revenue</th>
                <th className="py-3.5 px-4 text-right">360° Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {loading && customers.length === 0
                ? Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                : customers.map((c) => {
                    const isSelected = selectedIds.includes(c.id);
                    const tags: string[] = Array.isArray(c.tags) ? c.tags : [];
                    return (
                      <tr
                        key={c.id}
                        onClick={() => openCustomer360(c)}
                        className={`hover:bg-[#F8F8FA] cursor-pointer transition ${
                          isSelected ? "bg-[#FBF3DC]/40" : ""
                        }`}
                      >
                        <td
                          className="py-3.5 px-4"
                          onClick={(e) => toggleSelect(c.id, e)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-[#D1D5DB] text-[#181A1E] focus:ring-[#F5C94A]"
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9] text-xs font-extrabold flex items-center justify-center shrink-0 select-none">
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-[#181A1E]">
                                  {c.name}
                                </p>
                                {c.tenant && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]">
                                    <Building2 className="w-2.5 h-2.5" />
                                    {c.tenant.name}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#73767D]">
                                {c.email || c.city || "Dhaka"} ·{" "}
                                <span className="uppercase font-semibold">
                                  {c.preferredLanguage || "en"}
                                </span>
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-mono text-[#181A1E] font-medium">
                            {c.phone}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                c.optInWhatsapp !== false
                                  ? "bg-[#E3F5EC] text-[#184E37]"
                                  : "bg-[#F8F8FA] text-[#73767D] line-through"
                              }`}
                            >
                              WA
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                c.optInSms !== false
                                  ? "bg-[#E2F2FA] text-[#174A67]"
                                  : "bg-[#F8F8FA] text-[#73767D] line-through"
                              }`}
                            >
                              SMS
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                c.optInEmail !== false
                                  ? "bg-[#FBF3DC] text-[#5B4712]"
                                  : "bg-[#F8F8FA] text-[#73767D] line-through"
                              }`}
                            >
                              EMAIL
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F3F1E8] text-[#181A1E] border border-[#EAEAEA]"
                                >
                                  {tag}
                                </span>
                              ))}
                              {tags.length > 3 && (
                                <span className="text-[10px] text-[#73767D]">
                                  +{tags.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#73767D] italic">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-bold text-[#181A1E]">
                            {c.totalBookings}
                          </span>
                          <span className="ml-1 text-[10px] text-[#73767D]">
                            ({c.completedBookings} done)
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#181A1E]">
                          {formatBDT(c.totalRevenue)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCustomer360(c);
                            }}
                            className="px-3 py-1.5 bg-[#F3F1E8] hover:bg-[#F5C94A] text-[#181A1E] font-semibold rounded-xl text-[11px] transition"
                          >
                            View 360°
                          </button>
                        </td>
                      </tr>
                    );
                  })}

              {!loading && customers.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="py-16 text-center space-y-3">
                      <Users className="w-10 h-10 text-[#73767D] mx-auto" />
                      <p className="text-sm font-bold text-[#181A1E]">
                        {search
                          ? "No customers match your search"
                          : "No customers yet"}
                      </p>
                      <p className="text-xs text-[#73767D] max-w-xs mx-auto">
                        Import a CSV list or click Add Customer to populate your
                        CRM database.
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
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#EAEAEA] text-xs text-[#73767D]">
            <span>
              Page <span className="font-bold text-[#181A1E]">{page}</span> of{" "}
              <span className="font-bold text-[#181A1E]">{pages}</span> ·{" "}
              {total} customer{total !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="px-3 py-1.5 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl disabled:opacity-40 transition"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages || loading}
                className="px-3 py-1.5 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl disabled:opacity-40 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Customer 360 Drawer / Modal ───────────────────────────────────────── */}
      {activeCustomer && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] border-l border-[#EAEAEA] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 bg-[#F8F8FA] border-b border-[#EAEAEA] flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9] text-lg font-extrabold flex items-center justify-center">
                  {activeCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-extrabold text-[#181A1E]">
                      {activeCustomer.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]">
                      Customer 360°
                    </span>
                    {activeCustomer.tenant && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]">
                        <Building2 className="w-2.5 h-2.5" />
                        {activeCustomer.tenant.name}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#73767D] mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3" />
                      {activeCustomer.phone}
                    </span>
                    {activeCustomer.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {activeCustomer.email}
                      </span>
                    )}
                    <span>Joined {formatBdDate(activeCustomer.createdAt)}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveCustomer(null)}
                className="p-2 rounded-xl bg-white border border-[#EAEAEA] text-[#73767D] hover:text-[#181A1E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* KPI Summary Strip */}
            <div className="grid grid-cols-4 gap-3 px-6 py-3.5 bg-white border-b border-[#EAEAEA]">
              <div className="bg-[#F8F8FA] rounded-xl p-2.5 border border-[#EAEAEA]">
                <p className="text-[10px] font-bold text-[#73767D] uppercase">
                  Total Revenue
                </p>
                <p className="text-sm font-extrabold text-[#181A1E] mt-0.5">
                  {formatBDT(activeCustomer.totalRevenue)}
                </p>
              </div>
              <div className="bg-[#F8F8FA] rounded-xl p-2.5 border border-[#EAEAEA]">
                <p className="text-[10px] font-bold text-[#73767D] uppercase">
                  Bookings
                </p>
                <p className="text-sm font-extrabold text-[#181A1E] mt-0.5">
                  {activeCustomer.totalBookings} total
                </p>
              </div>
              <div className="bg-[#F8F8FA] rounded-xl p-2.5 border border-[#EAEAEA]">
                <p className="text-[10px] font-bold text-[#73767D] uppercase">
                  Completed
                </p>
                <p className="text-sm font-extrabold text-[#184E37] mt-0.5">
                  {activeCustomer.completedBookings} visits
                </p>
              </div>
              <div className="bg-[#F8F8FA] rounded-xl p-2.5 border border-[#EAEAEA]">
                <p className="text-[10px] font-bold text-[#73767D] uppercase">
                  No-Show / Cancel
                </p>
                <p className="text-sm font-extrabold text-[#9E2A2B] mt-0.5">
                  {(activeCustomer.bookings || []).filter(
                    (b) => b.status === "NO_SHOW"
                  ).length + (activeCustomer.cancelledBookings || 0)}
                </p>
              </div>
            </div>

            {/* Drawer Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#EAEAEA] bg-white">
              {[
                {
                  id: "BOOKINGS",
                  label: "1. Booking History",
                  icon: Calendar,
                },
                {
                  id: "COMM_PREFS",
                  label: "2. Communication Preferences",
                  icon: MessageSquare,
                },
                {
                  id: "CUSTOM_FIELDS",
                  label: "3. Custom Fields",
                  icon: Sliders,
                },
              ].map((t) => {
                const Icon = t.icon;
                const active = drawerTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDrawerTab(t.id as any)}
                    className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition ${
                      active
                        ? "border-[#181A1E] text-[#181A1E]"
                        : "border-transparent text-[#73767D] hover:text-[#181A1E]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* TAB 1: BOOKING HISTORY */}
              {drawerTab === "BOOKINGS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#181A1E]">
                        Chronological Appointment History
                      </h3>
                      <p className="text-xs text-[#73767D]">
                        Click 1-Click Rebook on any past service to schedule an
                        instant repeat visit
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleOneClickRebook({
                          id: "new-fast",
                          bookingNumber: "#NEW",
                          status: "CONFIRMED",
                          date: new Date().toISOString(),
                          startTime: "11:00",
                          endTime: "12:00",
                          price: 2500,
                          service: {
                            id: "",
                            name: "Priority Repeat Consultation",
                            durationMinutes: 60,
                            price: 2500,
                          },
                        })
                      }
                      className="px-3 py-1.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Quick Rebook
                    </button>
                  </div>

                  {!activeCustomer.bookings ||
                  activeCustomer.bookings.length === 0 ? (
                    <div className="p-8 bg-[#F8F8FA] rounded-2xl border border-[#EAEAEA] text-center space-y-2">
                      <Calendar className="w-8 h-8 text-[#73767D] mx-auto" />
                      <p className="text-xs font-bold text-[#181A1E]">
                        No recorded appointments yet
                      </p>
                      <p className="text-[11px] text-[#73767D]">
                        Use Quick Rebook above to create this customer&apos;s
                        first appointment.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeCustomer.bookings.map((bk) => (
                        <div
                          key={bk.id}
                          className="p-4 rounded-2xl border border-[#EAEAEA] bg-[#F8F8FA] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-extrabold text-[#181A1E]">
                                {bk.bookingNumber}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  BOOKING_STATUS_BADGE[bk.status] ||
                                  "bg-white text-[#181A1E] border-[#EAEAEA]"
                                }`}
                              >
                                {bk.status}
                              </span>
                              <span className="text-xs font-bold text-[#181A1E]">
                                {bk.service?.name || "Service Appointment"}
                              </span>
                            </div>
                            <p className="text-xs text-[#73767D]">
                              {formatBdDate(bk.date)} · {bk.startTime} –{" "}
                              {bk.endTime}
                              {bk.staff?.name
                                ? ` · Specialist: ${bk.staff.name}`
                                : ""}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-extrabold text-[#181A1E]">
                              {formatBDT(bk.price)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOneClickRebook(bk)}
                              disabled={rebookingId === bk.id}
                              className="px-3 py-1.5 bg-white hover:bg-[#F5C94A] text-[#181A1E] border border-[#EAEAEA] rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                            >
                              {rebookingId === bk.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                              )}
                              1-Click Rebook
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: COMMUNICATION PREFERENCES */}
              {drawerTab === "COMM_PREFS" && (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-[#F8F8FA] border border-[#EAEAEA] space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#184E37]" />
                      <h3 className="text-xs font-extrabold text-[#181A1E] uppercase tracking-wider">
                        Channel Opt-In Consent
                      </h3>
                    </div>

                    {[
                      {
                        key: "optInWhatsapp",
                        title: "WhatsApp Automated & Service Messages",
                        desc: "Allow booking confirmations, 24h reminders, and WhatsApp inbox replies",
                      },
                      {
                        key: "optInSms",
                        title: "SMS Text Alerts (Bangladesh Bulk SMS)",
                        desc: "Fallback & urgent appointment notifications via SMS",
                      },
                      {
                        key: "optInEmail",
                        title: "Email Receipts, Invoices & Campaigns",
                        desc: "Send PDF quotes, invoices, and promotional newsletters",
                      },
                    ].map((item) => {
                      const checked = (commPrefsForm as any)[item.key];
                      return (
                        <label
                          key={item.key}
                          className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#EAEAEA] cursor-pointer"
                        >
                          <div>
                            <p className="text-xs font-bold text-[#181A1E]">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-[#73767D]">
                              {item.desc}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setCommPrefsForm((prev) => ({
                                ...prev,
                                [item.key]: e.target.checked,
                              }))
                            }
                            className="w-4 h-4 rounded text-[#181A1E] focus:ring-[#F5C94A]"
                          />
                        </label>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#181A1E] mb-1.5">
                        Preferred Channel
                      </label>
                      <select
                        value={commPrefsForm.preferredChannel}
                        onChange={(e) =>
                          setCommPrefsForm((prev) => ({
                            ...prev,
                            preferredChannel: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E]"
                      >
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="SMS">SMS</option>
                        <option value="EMAIL">Email</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#181A1E] mb-1.5">
                        Preferred Language
                      </label>
                      <select
                        value={commPrefsForm.preferredLanguage}
                        onChange={(e) =>
                          setCommPrefsForm((prev) => ({
                            ...prev,
                            preferredLanguage: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E]"
                      >
                        <option value="en">English (EN)</option>
                        <option value="bn">বাংলা / Bengali (BN)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F8F8FA] border border-[#EAEAEA] space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#5B4712]" />
                      <h3 className="text-xs font-extrabold text-[#181A1E] uppercase tracking-wider">
                        Quiet Hours (Do Not Disturb Window)
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#73767D] mb-1">
                          Quiet Hours Start
                        </label>
                        <input
                          type="time"
                          value={commPrefsForm.quietHoursStart}
                          onChange={(e) =>
                            setCommPrefsForm((prev) => ({
                              ...prev,
                              quietHoursStart: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#73767D] mb-1">
                          Quiet Hours End
                        </label>
                        <input
                          type="time"
                          value={commPrefsForm.quietHoursEnd}
                          onChange={(e) =>
                            setCommPrefsForm((prev) => ({
                              ...prev,
                              quietHoursEnd: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CUSTOM FIELDS */}
              {drawerTab === "CUSTOM_FIELDS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#181A1E]">
                        Customer Custom Fields
                      </h3>
                      <p className="text-xs text-[#73767D]">
                        Platform-wide custom attributes configured for CUSTOMER
                        entities
                      </p>
                    </div>
                    <a
                      href="/dashboard/custom-fields"
                      className="text-xs font-bold text-[#5B4712] bg-[#FBF3DC] px-3 py-1.5 rounded-xl border border-[#F2E2B6] hover:bg-[#F5C94A]"
                    >
                      Manage Schema →
                    </a>
                  </div>

                  <div className="space-y-3">
                    {customFieldDefs.map((def) => {
                      const val = customFieldsForm[def.id] ?? "";
                      return (
                        <div
                          key={def.id}
                          className="p-3.5 bg-[#F8F8FA] rounded-xl border border-[#EAEAEA]"
                        >
                          <label className="block text-xs font-bold text-[#181A1E] mb-1.5">
                            {def.label}{" "}
                            <span className="text-[10px] font-mono text-[#73767D]">
                              ({def.fieldType})
                            </span>
                          </label>

                          {def.fieldType === "SELECT" &&
                          Array.isArray(def.options) ? (
                            <select
                              value={String(val)}
                              onChange={(e) =>
                                setCustomFieldsForm((prev) => ({
                                  ...prev,
                                  [def.id]: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E]"
                            >
                              <option value="">Select option…</option>
                              {def.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : def.fieldType === "BOOLEAN" ? (
                            <label className="inline-flex items-center gap-2 text-xs text-[#181A1E] cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(val === true || val === "true")}
                                onChange={(e) =>
                                  setCustomFieldsForm((prev) => ({
                                    ...prev,
                                    [def.id]: e.target.checked,
                                  }))
                                }
                                className="rounded text-[#181A1E]"
                              />
                              <span>Enabled / Yes</span>
                            </label>
                          ) : (
                            <input
                              type={
                                def.fieldType === "DATE"
                                  ? "date"
                                  : def.fieldType === "NUMBER"
                                  ? "number"
                                  : "text"
                              }
                              value={String(val)}
                              onChange={(e) =>
                                setCustomFieldsForm((prev) => ({
                                  ...prev,
                                  [def.id]: e.target.value,
                                }))
                              }
                              placeholder={`Enter ${def.label.toLowerCase()}…`}
                              className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-xl text-xs text-[#181A1E]"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-[#F8F8FA] border-t border-[#EAEAEA] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveCustomer(null)}
                className="px-4 py-2 bg-white border border-[#EAEAEA] rounded-xl text-xs font-semibold text-[#73767D] hover:text-[#181A1E]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveCustomer360}
                disabled={savingDrawer}
                className="px-5 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] rounded-xl text-xs font-extrabold flex items-center gap-1.5"
              >
                {savingDrawer && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Customer 360 Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CSV Import Modal ─────────────────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] max-w-xl w-full p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#181A1E]">
                  Import Customers via CSV
                </h2>
                <p className="text-xs text-[#73767D]">
                  Paste CSV rows or upload a `.csv` file with automatic phone
                  normalization
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1.5 rounded-lg text-[#73767D] hover:text-[#181A1E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportCsv} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#181A1E]">
                    CSV Content (`name,phone,email,city,tags,preferredLanguage`)
                  </label>
                  <label className="text-[11px] font-bold text-[#5B4712] cursor-pointer hover:underline">
                    Upload .csv file
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setCsvInput(String(ev.target?.result || ""));
                        };
                        reader.readAsText(file);
                      }}
                    />
                  </label>
                </div>
                <textarea
                  rows={5}
                  value={csvInput}
                  onChange={(e) => setCsvInput(e.target.value)}
                  className="w-full p-3 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl font-mono text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                />
              </div>

              {/* Live Preview */}
              {csvPreviewRows.length > 0 && (
                <div className="bg-[#F8F8FA] rounded-xl p-3 border border-[#EAEAEA] space-y-2">
                  <p className="text-[10px] font-bold text-[#73767D] uppercase">
                    Preview ({csvPreviewRows.length} rows detected)
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {csvPreviewRows.slice(0, 5).map((r, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded-lg border border-[#EAEAEA]"
                      >
                        <span className="font-bold text-[#181A1E]">
                          {r.name}
                        </span>
                        <span className="font-mono text-[#73767D]">
                          {r.phone}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-[#E3F5EC] text-[#184E37] rounded-full font-bold">
                          {r.tags}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-[#F3F1E8] text-[#181A1E] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-5 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] rounded-xl text-xs font-extrabold flex items-center gap-1.5"
                >
                  {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Import {csvPreviewRows.length} Customers
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add Single Customer Modal ────────────────────────────────────────── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] max-w-md w-full p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#181A1E]">
                Add New Customer
              </h2>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-lg text-[#73767D] hover:text-[#181A1E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#181A1E] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. Tariqul Islam"
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#181A1E] mb-1">
                  Phone / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  value={newCustomer.phone}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="+8801711000000"
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#181A1E] mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#181A1E] mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={newCustomer.city}
                    onChange={(e) =>
                      setNewCustomer((p) => ({ ...p, city: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#181A1E] mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={newCustomer.tags}
                  onChange={(e) =>
                    setNewCustomer((p) => ({ ...p, tags: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-[#F3F1E8] rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCustomer}
                  className="px-5 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] rounded-xl text-xs font-extrabold flex items-center gap-1.5"
                >
                  {creatingCustomer && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
