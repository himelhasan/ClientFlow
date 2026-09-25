"use client";

import React, { useEffect, useState } from "react";
import {
  Star,
  Sparkles,
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  TrendingUp,
  Filter,
  Plus,
  X,
} from "lucide-react";

export default function ReviewsReputationPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalReviews: 5,
    averageRating: 4.4,
    npsScore: 60,
    replyRate: 60,
    sentimentBreakdown: { POSITIVE: 3, NEUTRAL: 1, NEGATIVE: 1 },
  });
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [sentimentFilter, setSentimentFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Reply state per review
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Send Review Request modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqCustomerName, setReqCustomerName] = useState("Nusrat Jahan");
  const [reqCustomerPhone, setReqCustomerPhone] = useState("+8801711223344");
  const [reqChannel, setReqChannel] = useState("WHATSAPP");
  const [reqService, setReqService] = useState("HydraFacial MD & LED Glow Therapy");
  const [banner, setBanner] = useState<string | null>(null);

  async function fetchReviews() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (platformFilter !== "ALL") params.set("platform", platformFilter);
      if (sentimentFilter !== "ALL") params.set("sentiment", sentimentFilter);

      const res = await fetch(`/api/v1/reviews?${params.toString()}`);
      const data = await res.json();
      if (data.reviews) {
        setReviews(data.reviews);
        setMetrics(data.metrics || metrics);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReviews();
  }, [platformFilter, sentimentFilter]);

  function notify(msg: string) {
    setBanner(msg);
    setTimeout(() => setBanner(null), 5000);
  }

  async function handleGenerateAiReply(reviewId: string) {
    setGeneratingId(reviewId);
    try {
      const res = await fetch("/api/v1/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, action: "GENERATE_AI_REPLY" }),
      });
      const data = await res.json();
      if (data.aiSuggestedReply) {
        setReplyDrafts((prev) => ({ ...prev, [reviewId]: data.aiSuggestedReply }));
      }
    } finally {
      setGeneratingId(null);
    }
  }

  async function handlePublishReply(reviewId: string) {
    const reply = replyDrafts[reviewId];
    if (!reply) return;
    setSavingId(reviewId);
    try {
      const res = await fetch("/api/v1/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, reply }),
      });
      const data = await res.json();
      if (data.success) {
        notify("Owner reply published and customer notified!");
        await fetchReviews();
      }
    } finally {
      setSavingId(null);
    }
  }

  async function handleToggleVisibility(review: any) {
    const nextStatus = review.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED";
    await fetch("/api/v1/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: review.id, status: nextStatus }),
    });
    notify(
      nextStatus === "PUBLISHED"
        ? "Review made public on your booking page & portal."
        : "Review hidden from public widget."
    );
    await fetchReviews();
  }

  async function handleSendReviewRequest(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/v1/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "SEND_REVIEW_REQUEST",
        customerName: reqCustomerName,
        customerPhone: reqCustomerPhone,
        channel: reqChannel,
        serviceName: reqService,
      }),
    });
    const data = await res.json();
    if (data.success) {
      notify(data.message);
      setShowRequestModal(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[#181A1E]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#184E37] bg-[#E3F5EC] border border-[#CBEAD9] px-2.5 py-1 rounded-full">
            Reputation & Sentiment Engine
          </span>
          <h1 className="text-2xl font-bold text-[#181A1E] mt-2">
            Reviews & Reputation Management
          </h1>
          <p className="text-sm text-[#73767D] mt-1">
            Monitor Google, Facebook, and Internal reviews, track Net Promoter Score (NPS), and publish AI-assisted owner responses.
          </p>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="px-4 py-2.5 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold flex items-center gap-2 shrink-0 transition"
        >
          <Send className="w-4 h-4" />
          Send Review Request
        </button>
      </div>

      {banner && (
        <div className="p-4 rounded-[14px] bg-[#E3F5EC] border border-[#CBEAD9] text-[#184E37] text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{banner}</span>
          </div>
          <button onClick={() => setBanner(null)} className="text-xs underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <div className="flex items-center justify-between text-xs text-[#73767D] mb-1">
            <span>Average Star Rating</span>
            <Star className="w-4 h-4 text-[#F5C94A] fill-[#F5C94A]" />
          </div>
          <div className="text-3xl font-bold text-[#181A1E]">
            {metrics.averageRating} <span className="text-sm font-normal text-[#73767D]">/ 5.0</span>
          </div>
          <div className="text-xs text-[#184E37] font-medium mt-1">
            Based on {metrics.totalReviews} verified reviews
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <div className="flex items-center justify-between text-xs text-[#73767D] mb-1">
            <span>Net Promoter Score (NPS)</span>
            <TrendingUp className="w-4 h-4 text-[#184E37]" />
          </div>
          <div className="text-3xl font-bold text-[#181A1E]">+{metrics.npsScore}</div>
          <div className="text-xs text-[#184E37] font-medium mt-1">
            World-Class Loyalty Benchmark (&gt;50)
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <div className="flex items-center justify-between text-xs text-[#73767D] mb-1">
            <span>Sentiment Breakdown</span>
            <ThumbsUp className="w-4 h-4 text-[#174A67]" />
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="text-xs text-[#181A1E]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#184E37] mr-1" />
              <strong>{metrics.sentimentBreakdown?.POSITIVE || 0}</strong> Positive
            </div>
            <div className="text-xs text-[#181A1E]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#F5C94A] mr-1" />
              <strong>{metrics.sentimentBreakdown?.NEUTRAL || 0}</strong> Neutral
            </div>
            <div className="text-xs text-[#181A1E]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#9E2A2B] mr-1" />
              <strong>{metrics.sentimentBreakdown?.NEGATIVE || 0}</strong> Negative
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-[#F3F1E8] overflow-hidden flex mt-2.5">
            <div className="bg-[#184E37] h-full" style={{ width: "75%" }} />
            <div className="bg-[#F5C94A] h-full" style={{ width: "15%" }} />
            <div className="bg-[#9E2A2B] h-full" style={{ width: "10%" }} />
          </div>
        </div>

        <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
          <div className="flex items-center justify-between text-xs text-[#73767D] mb-1">
            <span>Owner Response Rate</span>
            <MessageSquare className="w-4 h-4 text-[#5B4712]" />
          </div>
          <div className="text-3xl font-bold text-[#181A1E]">{metrics.replyRate}%</div>
          <div className="text-xs text-[#5B4712] font-medium mt-1">
            1-Click AI Reply Assistant Ready
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-[20px] border border-[#EAEAEA] p-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#73767D] flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Platform:
          </span>
          {["ALL", "INTERNAL", "GOOGLE", "FACEBOOK"].map((plat) => (
            <button
              key={plat}
              onClick={() => setPlatformFilter(plat)}
              className={`px-3 py-1.5 rounded-xl text-xs transition ${
                platformFilter === plat
                  ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
                  : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium border border-[#EAEAEA]"
              }`}
            >
              {plat === "ALL" ? "All Channels" : plat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-[#73767D] mr-1">Sentiment:</span>
          {["ALL", "POSITIVE", "NEUTRAL", "NEGATIVE"].map((sent) => (
            <button
              key={sent}
              onClick={() => setSentimentFilter(sent)}
              className={`px-3 py-1.5 rounded-xl text-xs transition ${
                sentimentFilter === sent
                  ? "bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] font-semibold"
                  : "bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] font-medium border border-[#EAEAEA]"
              }`}
            >
              {sent}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((rev) => {
          const draft = replyDrafts[rev.id] ?? rev.reply ?? "";
          return (
            <div
              key={rev.id}
              className="bg-white rounded-[20px] border border-[#EAEAEA] p-6 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)] space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E3F5EC] text-[#184E37] font-bold flex items-center justify-center text-sm border border-[#CBEAD9]">
                    {rev.customerName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#181A1E]">{rev.customerName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          rev.platform === "GOOGLE" || rev.platform === "FACEBOOK"
                            ? "bg-[#E2F2FA] text-[#174A67] border-[#C4E3F5]"
                            : "bg-[#E3F5EC] text-[#184E37] border-[#CBEAD9]"
                        }`}
                      >
                        {rev.platform}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          rev.sentimentScore === "POSITIVE"
                            ? "bg-[#E3F5EC] text-[#184E37] border-[#CBEAD9]"
                            : rev.sentimentScore === "NEUTRAL"
                            ? "bg-[#FBF3DC] text-[#5B4712] border-[#F2E2B6]"
                            : "bg-[#FAD4D6] text-[#9E2A2B] border-[#F5BFC2]"
                        }`}
                      >
                        {rev.sentimentScore}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          rev.status === "PUBLISHED"
                            ? "bg-[#E3F5EC] text-[#184E37] border-[#CBEAD9]"
                            : "bg-[#FAD4D6] text-[#9E2A2B] border-[#F5BFC2]"
                        }`}
                      >
                        {rev.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#73767D] mt-0.5">
                      {rev.serviceName} · Specialist: <strong className="text-[#181A1E]">{rev.staffName}</strong> ·{" "}
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < rev.rating ? "fill-[#F5C94A] text-[#F5C94A]" : "text-[#EAEAEA]"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => handleToggleVisibility(rev)}
                    className="px-3 py-1.5 rounded-xl border border-[#EAEAEA] bg-[#F3F1E8] hover:bg-[#EAE6D7] text-xs font-medium text-[#262930] flex items-center gap-1.5 transition"
                  >
                    {rev.status === "PUBLISHED" ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Hide Publicly
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Publish
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-sm text-[#181A1E] bg-[#F8F8FA] p-4 rounded-[14px] border border-[#EAEAEA]">
                &ldquo;{rev.comment}&rdquo;
              </p>

              {/* AI Reply Composer */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#181A1E]">
                    Owner Response {rev.repliedAt ? "(Published)" : "(Not Replied Yet)"}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleGenerateAiReply(rev.id)}
                    disabled={generatingId === rev.id}
                    className="px-3 py-1 rounded-xl bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] text-xs font-medium flex items-center gap-1.5 transition border border-[#EAEAEA]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {generatingId === rev.id ? "Drafting..." : "1-Click Generate AI Reply"}
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <textarea
                    rows={2}
                    value={draft}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({ ...prev, [rev.id]: e.target.value }))
                    }
                    placeholder="Write a personal reply or click '1-Click Generate AI Reply'..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-xs text-[#181A1E] focus:border-[#F5C94A] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handlePublishReply(rev.id)}
                    disabled={savingId === rev.id || !draft}
                    className="px-4 py-2 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold shrink-0 disabled:opacity-50 transition"
                  >
                    {savingId === rev.id ? "Saving..." : "Publish Reply"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* SEND REVIEW REQUEST MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[20px] border border-[#EAEAEA] max-w-md w-full p-6 space-y-4 shadow-[0_2px_16px_-4px_rgba(24,24,27,0.04)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#181A1E]">
                Send Automated Review Request
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-1 rounded-lg text-[#73767D] hover:text-[#181A1E] hover:bg-[#F3F1E8] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[#73767D]">
              Send a direct 1-tap review link via WhatsApp or SMS. Customers who leave a review automatically receive +50 loyalty points.
            </p>
            <form onSubmit={handleSendReviewRequest} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={reqCustomerName}
                  onChange={(e) => setReqCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Phone Number (WhatsApp / SMS)
                </label>
                <input
                  type="text"
                  value={reqCustomerPhone}
                  onChange={(e) => setReqCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Completed Treatment
                </label>
                <input
                  type="text"
                  value={reqService}
                  onChange={(e) => setReqService(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#181A1E] mb-1">
                  Delivery Channel
                </label>
                <select
                  value={reqChannel}
                  onChange={(e) => setReqChannel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F8F8FA] border border-[#EAEAEA] text-[#181A1E] text-sm focus:border-[#F5C94A] focus:outline-none"
                >
                  <option value="WHATSAPP">WhatsApp Interactive Template (Recommended)</option>
                  <option value="SMS">SMS Shortlink</option>
                  <option value="EMAIL">Email Survey</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAEAEA] bg-[#F3F1E8] hover:bg-[#EAE6D7] text-[#262930] text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F5C94A] hover:bg-[#EBBF3E] text-[#181A1E] text-xs font-semibold transition"
                >
                  Dispatch Invite Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
