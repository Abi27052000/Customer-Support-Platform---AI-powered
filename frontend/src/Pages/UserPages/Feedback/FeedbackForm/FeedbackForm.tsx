import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MessageSquareHeart, Send, Star } from "lucide-react";
import { staffRatingApi, type RateableInteraction } from "../../../../services/staffRatingApi";

const FeedbackForm = () => {
  const [items, setItems] = useState<RateableInteraction[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = items.find((item) => `${item.sourceType}:${item.sourceId}` === selectedId);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await staffRatingApi.listRateable();
      setItems(data);
      setSelectedId(data[0] ? `${data[0].sourceType}:${data[0].sourceId}` : "");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resolved interactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const submitForm = async () => {
    if (!selected) {
      setError("No resolved staff interaction is available to rate.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await staffRatingApi.submitRating({
        sourceType: selected.sourceType,
        sourceId: selected.sourceId,
        rating,
        comment,
      });
      setComment("");
      setMessage("Thank you. Your rating was submitted.");
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <MessageSquareHeart size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Rate Resolved Support</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Ratings appear after staff closes or resolves your ticket or chat.
          </p>
        </div>
      </div>

      {loading && (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          <Loader2 size={17} className="animate-spin" />
          Loading resolved interactions...
        </div>
      )}
      {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={17} />
          {message}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          No resolved staff-handled tickets or chats are ready for rating yet.
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Resolved interaction</label>
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#2D2A8C] focus:bg-white"
            >
              {items.map((item) => (
                <option key={`${item.sourceType}:${item.sourceId}`} value={`${item.sourceType}:${item.sourceId}`}>
                  {item.title} - {item.staff?.name || item.staff?.email || "Support staff"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border transition ${
                    value <= rating
                      ? "border-amber-300 bg-amber-100 text-amber-600"
                      : "border-slate-200 bg-white text-slate-300 hover:text-amber-400"
                  }`}
                  aria-label={`${value} star rating`}
                >
                  <Star size={18} fill={value <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="h-28 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-[#2D2A8C] focus:bg-white"
            placeholder="Optional: tell us what went well or what could improve..."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />

          <button
            onClick={submitForm}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            {submitting ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      )}
    </aside>
  );
};

export default FeedbackForm;
