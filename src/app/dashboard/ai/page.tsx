"use client";

import { useState } from "react";
import {
  Sparkles,
  Send,
  Bot,
  User,
  CheckCircle2,
  Loader2,
  Languages,
  Cpu,
} from "lucide-react";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  intent?: string;
  detectedLanguage?: string;
  confidence?: number;
}

const SAMPLE_PROMPTS = [
  "আসসালামু আলাইকুম, আপনাদের সেবাসমূহের দাম কত টাকা?",
  "Vaiya kal bikale ki appointment serial pawa jabe?",
  "How much do you charge and can I book an appointment tomorrow?",
  "আপনাদের ঠিকানা কোথায় এবং কখন খোলা থাকে?",
  "I want to speak with a human manager please.",
];

export default function AIReceptionistPage() {
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatTurn[]>([
    {
      role: "assistant",
      content:
        "আসসালামু আলাইকুম! Welcome to the ClientFlow Bilingual AI Receptionist. Test asking about service prices, appointment slots, or clinic location in Bangla (বাংলা), Banglish, or English.",
      intent: "SYSTEM_READY",
      detectedLanguage: "Bilingual (BN/EN)",
      confidence: 1.0,
    },
  ]);

  async function sendPrompt(textToSend: string) {
    if (!textToSend.trim()) return;
    const userMsg = textToSend.trim();
    setInput("");
    setHistory((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/ai/receptionist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Sorry, I could not process that request.",
          intent: data.intent,
          detectedLanguage: data.detectedLanguage,
          confidence: data.confidence,
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
              AI Receptionist (Bangla &amp; English)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automatically detects customer intent across WhatsApp, Facebook, and Instagram using live business services &amp; hours.
          </p>
        </div>

        <button
          onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
          className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold border transition ${
            autoReplyEnabled
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          {autoReplyEnabled
            ? "AI Auto-Receptionist: ACTIVE"
            : "AI Auto-Receptionist: PAUSED"}
        </button>
      </div>

      {/* Capability Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3">
          <Languages className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-slate-900">
              Bangla, Banglish &amp; English
            </p>
            <p className="text-[11px] text-slate-500">
              Responds in the customer&apos;s script automatically
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3">
          <Cpu className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-slate-900">
              Live Service &amp; Fee Grounding
            </p>
            <p className="text-[11px] text-slate-500">
              Pulls real BDT prices &amp; working hours from your database
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3">
          <Bot className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-slate-900">
              Smart Human Handoff
            </p>
            <p className="text-[11px] text-slate-500">
              Flags complex inquiries for staff in the Unified Inbox
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Playground */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[500px]">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">
              Live AI Receptionist Simulator
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Connected to live tenant catalog
          </span>
        </div>

        {/* Sample Prompt Chips */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/70 flex flex-wrap gap-1.5">
          {SAMPLE_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => sendPrompt(prompt)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-[11px] text-slate-700 transition"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {history.map((turn, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                turn.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {turn.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-lg rounded-2xl p-3.5 text-xs space-y-2 ${
                  turn.role === "user"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <p className="leading-relaxed">{turn.content}</p>
                {turn.intent && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                      Intent: {turn.intent}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-white text-slate-600 font-semibold">
                      Lang: {turn.detectedLanguage}
                    </span>
                    {turn.confidence && (
                      <span className="text-slate-400 font-mono">
                        {Math.round(turn.confidence * 100)}% match
                      </span>
                    )}
                  </div>
                )}
              </div>
              {turn.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              AI Receptionist is analyzing intent...
            </div>
          )}
        </div>

        {/* Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendPrompt(input);
          }}
          className="p-3 border-t border-slate-200 flex gap-2 bg-white"
        >
          <input
            type="text"
            placeholder="Ask in Bangla, Banglish, or English (e.g. দাঁতের স্কেলিং কত টাকা?)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
