"use client";

import { useEffect, useState } from "react";
import { Target, MessageCircle, Phone, Mail, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { formatBdDateTime } from "@/lib/utils/bangladesh";

export default function LeadsPipeline() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function loadLeads() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/leads");
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  async function handleStatusChange(leadId: string, status: string) {
    setUpdatingId(leadId);
    try {
      await fetch("/api/v1/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, status }),
      });
      await loadLeads();
    } catch (err) {
      alert("Failed to update lead status");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Lead Management & Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track inquiries captured across Website forms, Facebook, Instagram, and WhatsApp.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-2">
          <Target className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No leads captured yet</h3>
          <p className="text-xs text-slate-400">
            When visitors submit your widget form or initiate inquiries, they will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Channel Source</th>
                  <th className="py-3.5 px-4">Title / Service</th>
                  <th className="py-3.5 px-4">Messaging Allowance</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Captured At</th>
                  <th className="py-3.5 px-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{l.customer?.name}</p>
                      <p className="text-slate-500 text-[11px] font-mono">{l.customer?.phone}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {l.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {l.title || "Inquiry"}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3 text-[11px] font-semibold text-slate-600">
                        <span className="flex items-center" title="WhatsApp sent">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                          {l.whatsappSent}/3
                        </span>
                        <span className="flex items-center" title="SMS sent">
                          <Phone className="w-3.5 h-3.5 text-blue-600 mr-1" />
                          {l.smsSent}/2
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          l.status === "BOOKED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : l.status === "QUALIFIED"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : l.status === "LOST"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {formatBdDateTime(l.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {updatingId === l.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600 inline" />
                      ) : (
                        <select
                          value={l.status}
                          onChange={(e) => handleStatusChange(l.id, e.target.value)}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs font-medium focus:outline-none"
                        >
                          <option value="NEW">NEW</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="QUALIFIED">QUALIFIED</option>
                          <option value="BOOKED">BOOKED</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="LOST">LOST</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
