import { useEffect, useState } from "react";
import { FaPaperPlane, FaComments, FaStar } from "react-icons/fa";
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
    <div className="bg-white shadow-lg rounded-xl p-6 border">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FaComments /> Rate Your Resolved Support Experience
      </h2>

      {loading && <p className="text-sm text-gray-500">Loading resolved interactions...</p>}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {message && <p className="text-sm text-emerald-600 mb-3">{message}</p>}

      {!loading && items.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          No resolved staff-handled tickets or chats are ready for rating yet.
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Resolved interaction</label>
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="w-full border rounded-lg p-3 focus:outline-blue-500"
            >
              {items.map((item) => (
                <option key={`${item.sourceType}:${item.sourceId}`} value={`${item.sourceType}:${item.sourceId}`}>
                  {item.title} - {item.staff?.name || item.staff?.email || "Support staff"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`h-10 w-10 rounded-full border flex items-center justify-center ${
                    value <= rating ? "bg-yellow-100 border-yellow-300 text-yellow-600" : "bg-white text-gray-300"
                  }`}
                  aria-label={`${value} star rating`}
                >
                  <FaStar />
                </button>
              ))}
            </div>
          </div>

          <textarea
            className="w-full border rounded-lg p-3 h-32 focus:outline-blue-500"
            placeholder="Optional: tell us what went well or what could improve..."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />

          <button
            onClick={submitForm}
            disabled={submitting}
            className="mt-1 flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg"
          >
            <FaPaperPlane /> {submitting ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedbackForm;
