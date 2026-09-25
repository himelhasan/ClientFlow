"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, Calendar, Check, Loader2, Save } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayConfig {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
  breakStart: string;
  breakEnd: string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Bangladesh default schedule:
 *  Mon-Thu  09:00-18:00 (working, 13:00-14:00 break)
 *  Fri      09:00-13:00 (half-day Jummah, no explicit break)
 *  Sat      closed
 *  Sun      closed
 */
function defaultConfig(dayOfWeek: number): DayConfig {
  if (dayOfWeek >= 1 && dayOfWeek <= 4) {
    // Monday – Thursday
    return {
      dayOfWeek,
      startTime: "09:00",
      endTime: "18:00",
      isWorkingDay: true,
      breakStart: "13:00",
      breakEnd: "14:00",
    };
  }
  if (dayOfWeek === 5) {
    // Friday – Jummah half-day
    return {
      dayOfWeek,
      startTime: "09:00",
      endTime: "13:00",
      isWorkingDay: true,
      breakStart: "",
      breakEnd: "",
    };
  }
  // Saturday (6) and Sunday (0) – closed
  return {
    dayOfWeek,
    startTime: "09:00",
    endTime: "18:00",
    isWorkingDay: false,
    breakStart: "",
    breakEnd: "",
  };
}

function buildInitialConfig(): DayConfig[] {
  return Array.from({ length: 7 }, (_, i) => defaultConfig(i));
}

// ─── Sub-component: a single day row ─────────────────────────────────────────

interface DayRowProps {
  config: DayConfig;
  onChange: (updated: DayConfig) => void;
  onSave: (dayOfWeek: number) => Promise<void>;
  saveState: SaveState;
}

function DayRow({ config, onChange, onSave, saveState }: DayRowProps) {
  const isFriday = config.dayOfWeek === 5;
  const isSatSun = config.dayOfWeek === 0 || config.dayOfWeek === 6;

  function field(key: keyof DayConfig, value: string | boolean) {
    onChange({ ...config, [key]: value });
  }

  const labelCls =
    "block text-[10px] font-bold text-[#73767D] uppercase tracking-wider mb-1";
  const inputCls =
    "w-full px-2.5 py-1.5 text-xs bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] focus:border-[#F5C94A] focus:outline-none font-mono disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 transition ${
        config.isWorkingDay
          ? "bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]"
          : "bg-[#F8F8FA] rounded-[14px] border border-[#EAEAEA] p-4"
      }`}
    >
      {/* Day label + toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => field("isWorkingDay", !config.isWorkingDay)}
          className={`flex-shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition ${
            config.isWorkingDay
              ? "bg-[#F5C94A] border-[#F5C94A] text-[#181A1E]"
              : "bg-white border-[#EAEAEA]"
          }`}
          aria-label={`Toggle ${DAY_NAMES[config.dayOfWeek]}`}
        >
          {config.isWorkingDay && (
            <Check className="w-3 h-3 text-[#181A1E]" strokeWidth={3} />
          )}
        </button>
        <div>
          <p
            className={`text-sm font-bold ${
              config.isWorkingDay ? "text-[#181A1E]" : "text-[#73767D]"
            }`}
          >
            {DAY_NAMES[config.dayOfWeek]}
          </p>
          {isFriday && (
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6] font-semibold mt-1">
              🕌 Jummah day
            </span>
          )}
          {isSatSun && (
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#F3F1E8] text-[#262930] font-medium mt-1">
              Weekend
            </span>
          )}
        </div>
      </div>

      {/* Time inputs + save */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[90px]">
          <label className={labelCls}>Opens</label>
          <input
            type="time"
            value={config.startTime}
            onChange={(e) => field("startTime", e.target.value)}
            disabled={!config.isWorkingDay}
            className={inputCls}
          />
        </div>
        <div className="flex-1 min-w-[90px]">
          <label className={labelCls}>Closes</label>
          <input
            type="time"
            value={config.endTime}
            onChange={(e) => field("endTime", e.target.value)}
            disabled={!config.isWorkingDay}
            className={inputCls}
          />
        </div>

        {/* Divider */}
        <div className="hidden sm:flex items-center pb-1 text-[#73767D] text-xs font-bold select-none">
          |
        </div>

        <div className="flex-1 min-w-[90px]">
          <label className={labelCls}>Break start</label>
          <input
            type="time"
            value={config.breakStart}
            onChange={(e) => field("breakStart", e.target.value)}
            disabled={!config.isWorkingDay}
            className={inputCls}
          />
        </div>
        <div className="flex-1 min-w-[90px]">
          <label className={labelCls}>Break end</label>
          <input
            type="time"
            value={config.breakEnd}
            onChange={(e) => field("breakEnd", e.target.value)}
            disabled={!config.isWorkingDay}
            className={inputCls}
          />
        </div>

        {/* Per-row save */}
        <div className="pb-0.5">
          <button
            type="button"
            onClick={() => onSave(config.dayOfWeek)}
            disabled={saveState === "saving"}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs transition ${
              saveState === "saved"
                ? "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9] font-semibold rounded-xl"
                : saveState === "error"
                ? "bg-[#FAD4D6] text-[#9E2A2B] border border-[#F5BFC2] font-semibold rounded-xl"
                : "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl"
            }`}
          >
            {saveState === "saving" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveState === "saved" ? (
              <Check className="w-3.5 h-3.5" strokeWidth={3} />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            {saveState === "saving"
              ? "Saving…"
              : saveState === "saved"
              ? "Saved"
              : saveState === "error"
              ? "Retry"
              : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AvailabilityPage() {
  const [days, setDays] = useState<DayConfig[]>(buildInitialConfig());
  const [loading, setLoading] = useState(true);
  const [saveStates, setSaveStates] = useState<Record<number, SaveState>>({});
  const [savingAll, setSavingAll] = useState(false);

  // ── Load existing config ──────────────────────────────────────────────────
  const loadAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/availability");
      const data = await res.json();

      if (Array.isArray(data.availability) && data.availability.length > 0) {
        // Merge API data over defaults
        const merged = buildInitialConfig();
        for (const record of data.availability as DayConfig[]) {
          const idx = record.dayOfWeek;
          if (idx >= 0 && idx <= 6) {
            merged[idx] = {
              dayOfWeek: idx,
              startTime: record.startTime ?? "09:00",
              endTime: record.endTime ?? "18:00",
              isWorkingDay: record.isWorkingDay,
              breakStart: record.breakStart ?? "",
              breakEnd: record.breakEnd ?? "",
            };
          }
        }
        setDays(merged);
      }
    } catch (err) {
      console.error("Failed to load availability:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  // ── Save single day ───────────────────────────────────────────────────────
  async function saveDay(dayOfWeek: number) {
    setSaveStates((prev) => ({ ...prev, [dayOfWeek]: "saving" }));
    const config = days[dayOfWeek];
    try {
      const res = await fetch("/api/v1/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: config.dayOfWeek,
          startTime: config.startTime,
          endTime: config.endTime,
          isWorkingDay: config.isWorkingDay,
          breakStart: config.breakStart || null,
          breakEnd: config.breakEnd || null,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setSaveStates((prev) => ({ ...prev, [dayOfWeek]: "saved" }));
      setTimeout(
        () =>
          setSaveStates((prev) => ({ ...prev, [dayOfWeek]: "idle" })),
        2000
      );
    } catch {
      setSaveStates((prev) => ({ ...prev, [dayOfWeek]: "error" }));
    }
  }

  // ── Save all ──────────────────────────────────────────────────────────────
  async function saveAll() {
    setSavingAll(true);
    // Fire all saves sequentially to avoid overwhelming the DB
    for (let i = 0; i < 7; i++) {
      await saveDay(i);
    }
    setSavingAll(false);
  }

  function updateDay(updated: DayConfig) {
    setDays((prev) => {
      const next = [...prev];
      next[updated.dayOfWeek] = updated;
      return next;
    });
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#181A1E]" />
      </div>
    );
  }

  const workingDays = days.filter((d) => d.isWorkingDay).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#FBF3DC] border border-[#F2E2B6] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#5B4712]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
              Availability
            </h1>
          </div>
          <p className="text-xs text-[#73767D] mt-1 ml-10">
            Configure your weekly business hours. Bangladesh defaults applied.
          </p>
        </div>

        <button
          type="button"
          onClick={saveAll}
          disabled={savingAll}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs transition disabled:opacity-60"
        >
          {savingAll ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {savingAll ? "Saving all…" : "Save All"}
        </button>
      </div>

      {/* Summary bar */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex items-center gap-4 text-xs text-[#73767D]">
        <Calendar className="w-4 h-4 text-[#73767D] shrink-0" />
        <span>
          <span className="font-bold text-[#181A1E]">{workingDays}</span> working
          {workingDays === 1 ? " day" : " days"} per week ·{" "}
          <span className="font-bold text-[#181A1E]">{7 - workingDays}</span> day
          {7 - workingDays === 1 ? "" : "s"} off
        </span>
        <span className="ml-auto text-[11px] text-[#73767D]">
          Timezone: Asia/Dhaka (UTC+6)
        </span>
      </div>

      {/* Day rows */}
      <div className="space-y-3">
        {days.map((config) => (
          <DayRow
            key={config.dayOfWeek}
            config={config}
            onChange={updateDay}
            onSave={saveDay}
            saveState={saveStates[config.dayOfWeek] ?? "idle"}
          />
        ))}
      </div>

      <p className="text-[11px] text-[#73767D] text-center">
        Changes apply to all future bookings. Existing confirmed bookings are
        unaffected.
      </p>
    </div>
  );
}
