import { useState } from "react";
import { CheckCircle2, Loader2, Send, TicketPlus } from "lucide-react";
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
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#2D2A8C] text-white">
          <TicketPlus size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Create a Support Ticket</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Tell the support team what happened. Your ticket is routed to available staff automatically.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {created && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Ticket created: #{created._id.slice(-8)}</p>
            <p className="mt-1">Assigned to {staffLabel(created.assignedTo)}.</p>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
          <input
            className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#2D2A8C] focus:bg-white"
            placeholder="Example: Billing issue with my last invoice"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            className="h-32 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-[#2D2A8C] focus:bg-white"
            placeholder="Add the details staff should know..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <button
          onClick={submitTicket}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2D2A8C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#242170] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
          {submitting ? "Creating..." : "Create Ticket"}
        </button>
      </div>
    </section>
  );
};

export default SupportTicketForm;
