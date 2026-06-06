import { useState } from "react";
import { FaPaperPlane, FaTicketAlt } from "react-icons/fa";
import { useAuth } from "../../../Context/AuthContext";
import { requestApi, type SupportRequest, type SupportStaff } from "../../../services/requestApi";

const staffLabel = (staff: SupportRequest["assignedTo"]) => {
  if (!staff || typeof staff === "string") return "Not assigned yet";
  const value = staff as SupportStaff;
  return value.name || value.email || "Support staff";
};

const SupportTicketForm = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [created, setCreated] = useState<SupportRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitTicket = async () => {
    if (!title.trim()) {
      setError("Please add a ticket title.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const ticket = await requestApi.createRequest({
        orgId: user?.orgId,
        title: title.trim(),
        description: description.trim(),
      });
      setCreated(ticket);
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FaTicketAlt /> Create a Support Ticket
      </h2>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {created && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Ticket created: #{created._id.slice(-8)}. Assigned to {staffLabel(created.assignedTo)}.
        </div>
      )}

      <div className="space-y-4">
        <input
          className="w-full border rounded-lg p-3 focus:outline-blue-500"
          placeholder="Ticket title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <textarea
          className="w-full border rounded-lg p-3 h-32 focus:outline-blue-500"
          placeholder="Describe your issue..."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <button
          onClick={submitTicket}
          disabled={submitting}
          className="flex items-center gap-2 bg-[#2D2A8C] hover:bg-[#1f1d6d] disabled:opacity-60 text-white px-5 py-2 rounded-lg"
        >
          <FaPaperPlane /> {submitting ? "Creating..." : "Create Ticket"}
        </button>
      </div>
    </div>
  );
};

export default SupportTicketForm;
