"use client";

import { useEffect, useState } from "react";
import {
  FileCode,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Eye,
  CheckCircle,
  Plus,
  Loader2,
  Globe,
} from "lucide-react";

export default function FormsDistributionPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    async function loadForms() {
      try {
        const res = await fetch("/api/v1/forms");
        const data = await res.json();
        setForms(data.forms || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadForms();
  }, []);

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
            Form Embeds & Distribution
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Install booking forms on your website, WordPress, social media, or print QR codes.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 space-y-2">
          <FileCode className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No forms generated yet</h3>
          <p className="text-xs text-slate-400">
            Complete the onboarding wizard to automatically generate your first embeddable form.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {forms.map((form) => {
            const jsEmbed = `<script src="${origin}/widget.js" data-form="${form.slug}"></script>`;
            const wpShortcode = `[clientflow_form id="${form.slug}"]`;
            const publicUrl = `${origin}/f/${form.slug}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
              publicUrl
            )}`;

            return (
              <div
                key={form.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base font-bold text-slate-900">{form.name}</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        {form.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{form.description}</p>
                  </div>

                  {/* Analytics counters (Section 33) */}
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span className="flex items-center" title="Form views">
                      <Eye className="w-4 h-4 mr-1 text-slate-400" />
                      <strong>{form.viewCount || 0}</strong> Views
                    </span>
                    <span className="flex items-center" title="Submissions">
                      <CheckCircle className="w-4 h-4 mr-1 text-emerald-600" />
                      <strong>{form._count?.submissions || form.submitCount || 0}</strong> Submissions
                    </span>
                  </div>
                </div>

                {/* Installation Methods (Section 11 & 50) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* JavaScript Embed */}
                  <div className="bg-slate-900 rounded-xl p-4 text-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        JavaScript Website Embed
                      </span>
                      <button
                        onClick={() => copyText(jsEmbed, `js-${form.id}`)}
                        className="text-xs inline-flex items-center space-x-1 text-slate-300 hover:text-white"
                      >
                        {copiedKey === `js-${form.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedKey === `js-${form.id}` ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <code className="text-[11px] font-mono text-slate-200 block bg-slate-950 p-2.5 rounded-lg border border-slate-800 break-all select-all">
                      {jsEmbed}
                    </code>
                    <p className="text-[10px] text-slate-400">
                      Paste anywhere in your HTML, Webflow, Shopify, or Wix site.
                    </p>
                  </div>

                  {/* WordPress Shortcode */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        WordPress Shortcode
                      </span>
                      <button
                        onClick={() => copyText(wpShortcode, `wp-${form.id}`)}
                        className="text-xs inline-flex items-center space-x-1 text-slate-600 hover:text-slate-900"
                      >
                        {copiedKey === `wp-${form.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedKey === `wp-${form.id}` ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <code className="text-xs font-mono text-slate-900 font-semibold block bg-white p-2.5 rounded-lg border border-slate-200">
                      {wpShortcode}
                    </code>
                    <p className="text-[10px] text-slate-500">
                      Use in our WordPress plugin or Elementor widget.
                    </p>
                  </div>
                </div>

                {/* Direct Link & QR Code (Section 34 & 35) */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-500 truncate max-w-sm">
                      Public URL: <strong className="text-slate-700">{publicUrl}</strong>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Open Live Form
                    </a>
                    <a
                      href={qrUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100"
                    >
                      <QrCode className="w-3.5 h-3.5 mr-1.5" />
                      Get QR Code
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
