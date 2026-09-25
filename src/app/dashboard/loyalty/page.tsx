"use client";

import { useEffect, useState } from "react";
import {
  Award,
  Gift,
  Plus,
  Sparkles,
  Crown,
  CreditCard,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
  Search,
  Sliders,
  ArrowUpRight,
  ArrowDownRight,
  X,
} from "lucide-react";
import { formatBDT, formatBdDate } from "@/lib/utils/bangladesh";

type StudioTab = "LEADERBOARD" | "GIFT_CARDS" | "TIER_RULES";

const TIER_BADGE: Record<string, string> = {
  PLATINUM: "bg-[#181A1E] text-[#F5C94A] border border-[#181A1E]",
  GOLD: "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]",
  SILVER: "bg-[#E2F2FA] text-[#174A67] border border-[#C4E3F5]",
  BRONZE: "bg-[#F3F1E8] text-[#262930] border border-[#EAEAEA]",
};

export default function LoyaltyAndGiftCardsPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>("LEADERBOARD");
  const [loading, setLoading] = useState(true);

  // Loyalty Data
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loyaltySummary, setLoyaltySummary] = useState<any>({
    totalMembers: 0,
    totalActivePoints: 0,
    vipCount: 0,
  });
  const [tierConfig, setTierConfig] = useState<any>({
    pointsPerTenBDT: 1,
    redemptionRateBDT: 1,
    tierRules: [],
  });

  // Gift Cards Data
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [gcSummary, setGcSummary] = useState<any>({
    totalIssued: 0,
    activeCount: 0,
    outstandingBalanceBDT: 0,
  });

  // Points Modal State
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsForm, setPointsForm] = useState({
    accountId: "",
    customerName: "",
    customerPhone: "",
    type: "BONUS" as "EARN" | "BONUS" | "REDEEM",
    points: 200,
    spendBDT: 2500,
    description: "Loyalty Bonus Reward",
  });
  const [submittingPoints, setSubmittingPoints] = useState(false);

  // Issue Gift Card Modal State
  const [showIssueGC, setShowIssueGC] = useState(false);
  const [gcForm, setGcForm] = useState({
    initialValue: 2500,
    purchaserName: "Arefin Rahman",
    recipientName: "Sabrina Rahman",
    recipientPhone: "01711334455",
    message: "Treat yourself to a luxury spa & makeover session! 🌸",
  });
  const [submittingGC, setSubmittingGC] = useState(false);

  // Balance Checker & Redeemer
  const [checkCode, setCheckCode] = useState("GC-EID8-9942");
  const [checkedCard, setCheckedCard] = useState<any>(null);
  const [redeemAmt, setRedeemAmt] = useState(1000);
  const [redeemFeedback, setRedeemFeedback] = useState<string | null>(null);
  const [checkingCard, setCheckingCard] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [savingRules, setSavingRules] = useState(false);
  const [rulesSavedMsg, setRulesSavedMsg] = useState(false);

  async function loadAllData() {
    setLoading(true);
    try {
      const [loyRes, gcRes] = await Promise.all([
        fetch("/api/v1/loyalty"),
        fetch("/api/v1/gift-cards"),
      ]);
      const loyData = await loyRes.json();
      const gcData = await gcRes.json();

      if (loyData.accounts) setAccounts(loyData.accounts);
      if (loyData.summary) setLoyaltySummary(loyData.summary);
      if (loyData.config) setTierConfig(loyData.config);

      if (gcData.giftCards) {
        setGiftCards(gcData.giftCards);
        if (gcData.giftCards[0]) setCheckedCard(gcData.giftCards[0]);
      }
      if (gcData.summary) setGcSummary(gcData.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  async function handlePointsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingPoints(true);
    try {
      const res = await fetch("/api/v1/loyalty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pointsForm),
      });
      if (res.ok) {
        setShowPointsModal(false);
        await loadAllData();
      }
    } finally {
      setSubmittingPoints(false);
    }
  }

  async function handleIssueGiftCard(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingGC(true);
    try {
      const res = await fetch("/api/v1/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gcForm),
      });
      const data = await res.json();
      if (res.ok && data.giftCard) {
        setShowIssueGC(false);
        setCheckedCard(data.giftCard);
        setCheckCode(data.giftCard.code);
        await loadAllData();
      }
    } finally {
      setSubmittingGC(false);
    }
  }

  async function handleLookupCode() {
    if (!checkCode.trim()) return;
    setCheckingCard(true);
    setRedeemFeedback(null);
    try {
      const res = await fetch(
        `/api/v1/gift-cards?code=${encodeURIComponent(checkCode.trim())}`
      );
      const data = await res.json();
      setCheckedCard(data.giftCard || null);
      if (!data.found) {
        setRedeemFeedback("No gift card found with that code.");
      }
    } finally {
      setCheckingCard(false);
    }
  }

  async function handleRedeemCard() {
    if (!checkedCard) return;
    setCheckingCard(true);
    setRedeemFeedback(null);
    try {
      const res = await fetch("/api/v1/gift-cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: checkedCard.code,
          redeemAmount: Number(redeemAmt),
        }),
      });
      const data = await res.json();
      if (res.ok && data.giftCard) {
        setCheckedCard(data.giftCard);
        setRedeemFeedback(
          `Redeemed ৳${data.deductedAmountBDT}! Remaining balance: ৳${data.remainingBalanceBDT}.`
        );
        await loadAllData();
      } else {
        setRedeemFeedback(data.error || "Failed to redeem.");
      }
    } finally {
      setCheckingCard(false);
    }
  }

  async function handleSaveTierRules(e: React.FormEvent) {
    e.preventDefault();
    setSavingRules(true);
    setRulesSavedMsg(false);
    try {
      const res = await fetch("/api/v1/loyalty", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tierConfig),
      });
      if (res.ok) {
        setRulesSavedMsg(true);
        setTimeout(() => setRulesSavedMsg(false), 3000);
      }
    } finally {
      setSavingRules(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="space-y-6 bg-[#F8F8F6] text-[#181A1E]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F5C94A] text-[#181A1E] flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#181A1E] tracking-tight">
                v2 Loyalty &amp; Digital Gift Cards Studio
              </h1>
              <p className="text-xs text-[#73767D] mt-0.5">
                Multi-tier rewards (Bronze → Platinum), points per BDT spent,
                and instant digital gift cards (`GC-XXXX-XXXX`).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (accounts[0]) {
                setPointsForm({
                  ...pointsForm,
                  accountId: accounts[0].id,
                  customerName: accounts[0].customer?.name || "",
                  customerPhone: accounts[0].customer?.phone || "",
                });
              }
              setShowPointsModal(true);
            }}
            className="inline-flex items-center px-3.5 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] text-xs font-semibold rounded-xl transition"
          >
            <Award className="w-3.5 h-3.5 mr-1.5 text-[#181A1E]" />
            Award / Redeem Points
          </button>
          <button
            type="button"
            onClick={() => setShowIssueGC(true)}
            className="inline-flex items-center px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold rounded-xl transition"
          >
            <Gift className="w-4 h-4 mr-1.5" />
            Issue Digital Gift Card
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <p className="text-[11px] font-semibold text-[#73767D] uppercase">
            Enrolled Loyalty Members
          </p>
          <p className="text-2xl font-black text-[#181A1E] mt-1">
            {loyaltySummary.totalMembers}
          </p>
          <p className="text-[11px] text-[#184E37] font-semibold mt-1">
            {loyaltySummary.vipCount} Gold &amp; Platinum VIPs
          </p>
        </div>

        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <p className="text-[11px] font-semibold text-[#73767D] uppercase">
            Active Points Liability
          </p>
          <p className="text-2xl font-black text-[#181A1E] mt-1">
            {loyaltySummary.totalActivePoints.toLocaleString()} pts
          </p>
          <p className="text-[11px] text-[#73767D] mt-1">
            Redeemable for {formatBDT(loyaltySummary.totalActivePoints)}
          </p>
        </div>

        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <p className="text-[11px] font-semibold text-[#73767D] uppercase">
            Active Digital Gift Cards
          </p>
          <p className="text-2xl font-black text-[#181A1E] mt-1">
            {gcSummary.activeCount} / {gcSummary.totalIssued}
          </p>
          <p className="text-[11px] text-[#73767D] mt-1">
            Instant WhatsApp &amp; SMS delivery
          </p>
        </div>

        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <p className="text-[11px] font-semibold text-[#73767D] uppercase">
            Unredeemed Gift Balance
          </p>
          <p className="text-2xl font-black text-[#181A1E] mt-1">
            {formatBDT(gcSummary.outstandingBalanceBDT)}
          </p>
          <p className="text-[11px] text-[#184E37] font-semibold mt-1">
            100% upfront prepaid revenue
          </p>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 bg-[#F8F8FA] p-1.5 rounded-[14px] border border-[#EAEAEA] w-fit">
        {[
          {
            id: "LEADERBOARD" as StudioTab,
            label: "Member Points Leaderboard",
            icon: Award,
          },
          {
            id: "GIFT_CARDS" as StudioTab,
            label: "Digital Gift Cards & Balance Checker",
            icon: Gift,
          },
          {
            id: "TIER_RULES" as StudioTab,
            label: "Tier Rules & Multipliers",
            icon: Sliders,
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition ${
                active
                  ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
                  : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* TAB 1: MEMBER POINTS LEADERBOARD                                    */}
      {/* =================================================================== */}
      {activeTab === "LEADERBOARD" && (
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-[#181A1E]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F8FA] border-b border-[#EAEAEA] text-[#73767D] uppercase font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Member</th>
                    <th className="py-3.5 px-4">VIP Tier</th>
                    <th className="py-3.5 px-4">Available Balance</th>
                    <th className="py-3.5 px-4">Lifetime Points</th>
                    <th className="py-3.5 px-4">Latest Transaction</th>
                    <th className="py-3.5 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAEAEA]">
                  {accounts.map((acc) => {
                    const latestTx = acc.transactions?.[0];
                    return (
                      <tr key={acc.id} className="hover:bg-[#F8F8FA]">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[#181A1E]">
                            {acc.customer?.name}
                          </p>
                          <p className="text-[11px] text-[#73767D] font-mono">
                            {acc.customer?.phone}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                              TIER_BADGE[acc.tier] || TIER_BADGE.BRONZE
                            }`}
                          >
                            {acc.tier}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-sm font-black text-[#181A1E]">
                            {Number(acc.pointsBalance).toLocaleString()} pts
                          </span>
                          <span className="block text-[10px] text-[#184E37] font-semibold">
                            Worth ৳{acc.pointsBalance} discount
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#73767D]">
                          {Number(acc.lifetimePoints).toLocaleString()} pts
                        </td>
                        <td className="py-3.5 px-4 max-w-[260px]">
                          {latestTx ? (
                            <div className="flex items-center gap-1.5">
                              {latestTx.points >= 0 ? (
                                <ArrowUpRight className="w-3.5 h-3.5 text-[#184E37] shrink-0" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5 text-[#9E2A2B] shrink-0" />
                              )}
                              <span className="truncate">
                                <strong
                                  className={
                                    latestTx.points >= 0
                                      ? "text-[#184E37]"
                                      : "text-[#9E2A2B]"
                                  }
                                >
                                  {latestTx.points >= 0
                                    ? `+${latestTx.points}`
                                    : latestTx.points}
                                </strong>{" "}
                                — {latestTx.description}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#73767D]">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPointsForm({
                                accountId: acc.id,
                                customerName: acc.customer?.name || "",
                                customerPhone: acc.customer?.phone || "",
                                type: "BONUS",
                                points: 250,
                                spendBDT: 2500,
                                description: "VIP Visit Bonus Points",
                              });
                              setShowPointsModal(true);
                            }}
                            className="px-2.5 py-1 bg-[#E3F5EC] hover:bg-[#CBEAD9] text-[#184E37] font-semibold rounded-xl text-[11px] border border-[#CBEAD9] transition"
                          >
                            + Award
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPointsForm({
                                accountId: acc.id,
                                customerName: acc.customer?.name || "",
                                customerPhone: acc.customer?.phone || "",
                                type: "REDEEM",
                                points: Math.min(300, acc.pointsBalance || 100),
                                spendBDT: 0,
                                description: "Checkout Discount Redemption",
                              });
                              setShowPointsModal(true);
                            }}
                            className="px-2.5 py-1 bg-[#FBF3DC] hover:bg-[#F2E2B6] text-[#5B4712] font-semibold rounded-xl text-[11px] border border-[#F2E2B6] transition"
                          >
                            Redeem
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: DIGITAL GIFT CARDS & BALANCE CHECKER                         */}
      {/* =================================================================== */}
      {activeTab === "GIFT_CARDS" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Balance Checker & Partial/Full Redeemer */}
          <div className="lg:col-span-5 bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#181A1E]" />
              <h3 className="text-sm font-bold text-[#181A1E]">
                Gift Card Balance Checker &amp; POS Redeemer
              </h3>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={checkCode}
                onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
                placeholder="Enter Code e.g. GC-EID8-9942"
                className="flex-1 px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-xs font-mono uppercase text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleLookupCode}
                disabled={checkingCard}
                className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] rounded-xl text-xs font-semibold flex items-center gap-1 transition"
              >
                <Search className="w-3.5 h-3.5" /> Check
              </button>
            </div>

            {checkedCard && (
              <div className="rounded-[14px] bg-[#181A1E] text-white p-5 space-y-3 border border-[#262930]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#F5C94A]">
                    CLIENTFLOW DIGITAL GIFT CARD
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F5C94A] text-[#181A1E]">
                    {checkedCard.status}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <p className="text-lg font-mono font-extrabold tracking-wider">
                    {checkedCard.code}
                  </p>
                  <div className="text-right">
                    <p className="text-[10px] text-[#73767D]">Current Balance</p>
                    <p className="text-2xl font-black text-[#F5C94A]">
                      {formatBDT(checkedCard.currentBalance)}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-[#EAEAEA] flex justify-between pt-2 border-t border-[#262930]">
                  <span>To: {checkedCard.recipientName || "Guest"}</span>
                  <span>Initial: {formatBDT(checkedCard.initialValue)}</span>
                </div>

                {checkedCard.currentBalance > 0 && (
                  <div className="pt-3 border-t border-[#262930] space-y-2">
                    <label className="block text-[10px] uppercase text-[#EAEAEA] font-semibold">
                      Redeem Partial or Full Amount (BDT)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        max={checkedCard.currentBalance}
                        value={redeemAmt}
                        onChange={(e) => setRedeemAmt(Number(e.target.value))}
                        className="w-28 px-3 py-1.5 rounded-xl bg-[#262930] border border-[#3A3D45] text-white text-xs font-bold focus:border-[#F5C94A] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleRedeemCard}
                        disabled={checkingCard}
                        className="flex-1 py-1.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs transition"
                      >
                        Redeem ৳{redeemAmt} Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {redeemFeedback && (
              <div className="p-3 rounded-xl bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9] text-xs font-semibold">
                {redeemFeedback}
              </div>
            )}
          </div>

          {/* Right: Issued Gift Cards Directory */}
          <div className="lg:col-span-7 bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#181A1E]">
                Issued Digital Gift Cards
              </h3>
              <button
                type="button"
                onClick={() => setShowIssueGC(true)}
                className="px-3 py-1.5 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" /> New Card
              </button>
            </div>

            <div className="space-y-3">
              {giftCards.map((gc) => (
                <div
                  key={gc.id}
                  onClick={() => {
                    setCheckedCard(gc);
                    setCheckCode(gc.code);
                  }}
                  className="p-4 rounded-[14px] bg-[#F8F8FA] border border-[#EAEAEA] hover:border-[#F5C94A] cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#181A1E] bg-[#F3F1E8] px-2.5 py-1 rounded-xl border border-[#EAEAEA]">
                        {gc.code}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyCode(gc.code);
                        }}
                        className="text-[#73767D] hover:text-[#181A1E]"
                      >
                        {copiedCode === gc.code ? (
                          <Check className="w-3.5 h-3.5 text-[#184E37]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          gc.status === "ACTIVE"
                            ? "bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9]"
                            : "bg-[#FBF3DC] text-[#5B4712] border border-[#F2E2B6]"
                        }`}
                      >
                        {gc.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#181A1E]">
                      Recipient: {gc.recipientName} ({gc.recipientPhone || "—"})
                    </p>
                    {gc.message && (
                      <p className="text-[11px] text-[#73767D] italic">
                        &ldquo;{gc.message}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black text-[#181A1E]">
                      {formatBDT(gc.currentBalance)}
                    </p>
                    <p className="text-[10px] text-[#73767D]">
                      of {formatBDT(gc.initialValue)} initial
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: TIER RULES & MULTIPLIERS CONFIGURATOR                        */}
      {/* =================================================================== */}
      {activeTab === "TIER_RULES" && (
        <form
          onSubmit={handleSaveTierRules}
          className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#181A1E]">
                Points Earning &amp; Tier Multiplier Rules
              </h3>
              <p className="text-xs text-[#73767D]">
                Configure how customers earn and redeem loyalty points per BDT
                spent.
              </p>
            </div>
            <button
              type="submit"
              disabled={savingRules}
              className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
            >
              {savingRules ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Save Tier Rules
            </button>
          </div>

          {rulesSavedMsg && (
            <div className="p-3 rounded-xl bg-[#E3F5EC] text-[#184E37] border border-[#CBEAD9] text-xs font-semibold">
              Loyalty earning rules &amp; tier multipliers saved!
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-[14px] bg-[#F8F8FA] border border-[#EAEAEA]">
              <label className="block text-xs font-bold text-[#181A1E] mb-1">
                Base Earning Rate (Points per ৳10 spent)
              </label>
              <input
                type="number"
                min={1}
                value={tierConfig.pointsPerTenBDT}
                onChange={(e) =>
                  setTierConfig({
                    ...tierConfig,
                    pointsPerTenBDT: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs font-semibold focus:border-[#F5C94A] focus:outline-none"
              />
            </div>

            <div className="p-4 rounded-[14px] bg-[#F8F8FA] border border-[#EAEAEA]">
              <label className="block text-xs font-bold text-[#181A1E] mb-1">
                Redemption Value (1 Point = ৳X Discount)
              </label>
              <input
                type="number"
                min={0.5}
                step="0.5"
                value={tierConfig.redemptionRateBDT}
                onChange={(e) =>
                  setTierConfig({
                    ...tierConfig,
                    redemptionRateBDT: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 bg-white border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs font-semibold focus:border-[#F5C94A] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(tierConfig.tierRules || []).map((rule: any, idx: number) => (
              <div
                key={rule.tier}
                className="p-4 rounded-[14px] border border-[#EAEAEA] bg-[#F8F8FA] space-y-2"
              >
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    TIER_BADGE[rule.tier] || TIER_BADGE.BRONZE
                  }`}
                >
                  {rule.tier} TIER
                </span>
                <div>
                  <label className="block text-[10px] font-bold text-[#73767D] uppercase">
                    Min Lifetime Points
                  </label>
                  <input
                    type="number"
                    value={rule.minPoints}
                    onChange={(e) => {
                      const next = [...tierConfig.tierRules];
                      next[idx] = {
                        ...next[idx],
                        minPoints: Number(e.target.value),
                      };
                      setTierConfig({ ...tierConfig, tierRules: next });
                    }}
                    className="w-full mt-1 px-2.5 py-1.5 bg-white border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs font-semibold focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#73767D] uppercase">
                    Points Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={rule.multiplier}
                    onChange={(e) => {
                      const next = [...tierConfig.tierRules];
                      next[idx] = {
                        ...next[idx],
                        multiplier: Number(e.target.value),
                      };
                      setTierConfig({ ...tierConfig, tierRules: next });
                    }}
                    className="w-full mt-1 px-2.5 py-1.5 bg-white border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs font-semibold focus:border-[#F5C94A] focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-[#73767D] pt-1">{rule.perks}</p>
              </div>
            ))}
          </div>
        </form>
      )}

      {/* =================================================================== */}
      {/* MODAL: AWARD / REDEEM POINTS                                        */}
      {/* =================================================================== */}
      {showPointsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handlePointsSubmit}
            className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 max-w-md w-full space-y-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#181A1E]">
                Award or Redeem Loyalty Points
              </h3>
              <button type="button" onClick={() => setShowPointsModal(false)}>
                <X className="w-4 h-4 text-[#73767D]" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                Select Member
              </label>
              <select
                value={pointsForm.accountId}
                onChange={(e) => {
                  const found = accounts.find((a) => a.id === e.target.value);
                  setPointsForm({
                    ...pointsForm,
                    accountId: e.target.value,
                    customerName: found?.customer?.name || "",
                    customerPhone: found?.customer?.phone || "",
                  });
                }}
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.customer?.name} ({a.tier} — {a.pointsBalance} pts)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {["BONUS", "EARN", "REDEEM"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() =>
                    setPointsForm({ ...pointsForm, type: t as any })
                  }
                  className={`py-2 rounded-xl text-xs transition ${
                    pointsForm.type === t
                      ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold border border-[#F5C94A]"
                      : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium border border-[#EAEAEA]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {pointsForm.type === "EARN" ? (
              <div>
                <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                  Booking Spend Amount (BDT)
                </label>
                <input
                  type="number"
                  value={pointsForm.spendBDT}
                  onChange={(e) =>
                    setPointsForm({
                      ...pointsForm,
                      spendBDT: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                  Points Amount
                </label>
                <input
                  type="number"
                  value={pointsForm.points}
                  onChange={(e) =>
                    setPointsForm({
                      ...pointsForm,
                      points: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                Reason / Note
              </label>
              <input
                type="text"
                value={pointsForm.description}
                onChange={(e) =>
                  setPointsForm({ ...pointsForm, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPointsModal(false)}
                className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPoints}
                className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs transition"
              >
                Confirm Transaction
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ISSUE DIGITAL GIFT CARD                                      */}
      {/* =================================================================== */}
      {showIssueGC && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleIssueGiftCard}
            className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 max-w-md w-full space-y-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#181A1E]">
                Issue Digital Gift Card (`GC-XXXX-XXXX`)
              </h3>
              <button type="button" onClick={() => setShowIssueGC(false)}>
                <X className="w-4 h-4 text-[#73767D]" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                Gift Card Value (BDT)
              </label>
              <div className="flex gap-2 mb-2">
                {[1000, 2500, 5000, 10000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setGcForm({ ...gcForm, initialValue: val })}
                    className={`flex-1 py-1.5 rounded-xl text-xs transition ${
                      gcForm.initialValue === val
                        ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold border border-[#F5C94A]"
                        : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium border border-[#EAEAEA]"
                    }`}
                  >
                    ৳{val}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                  Purchaser Name
                </label>
                <input
                  type="text"
                  required
                  value={gcForm.purchaserName}
                  onChange={(e) =>
                    setGcForm({ ...gcForm, purchaserName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  required
                  value={gcForm.recipientName}
                  onChange={(e) =>
                    setGcForm({ ...gcForm, recipientName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                Recipient WhatsApp / Phone
              </label>
              <input
                type="text"
                value={gcForm.recipientPhone}
                onChange={(e) =>
                  setGcForm({ ...gcForm, recipientPhone: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#73767D] uppercase mb-1">
                Personal Gift Message
              </label>
              <textarea
                rows={2}
                value={gcForm.message}
                onChange={(e) =>
                  setGcForm({ ...gcForm, message: e.target.value })
                }
                className="w-full px-3 py-2 bg-[#F8F8FA] border border-[#EAEAEA] rounded-xl text-[#181A1E] text-xs focus:border-[#F5C94A] focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowIssueGC(false)}
                className="px-4 py-2 bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingGC}
                className="px-4 py-2 bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold rounded-xl text-xs transition"
              >
                Generate &amp; Issue Code
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
