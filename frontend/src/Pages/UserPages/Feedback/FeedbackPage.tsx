import { MessageSquareText, Star, TicketCheck } from "lucide-react";
import FeedbackForm from "./FeedbackForm/FeedbackForm";
import RecentTickets from "./PreviousSection/PreviousSection";
import SupportTicketForm from "./SupportTicketForm";

const FeedbackPage = () => {
  return (
    <div className="w-full space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-[#2D2A8C]">
              <MessageSquareText size={14} />
              Support center
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">Feedback & Support Tickets</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Create a support ticket, rate resolved staff interactions, and track your recent requests from one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-80">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <TicketCheck size={18} className="text-[#2D2A8C]" />
              <p className="mt-2 text-xs font-medium text-slate-500">Tickets</p>
              <p className="text-sm font-semibold text-slate-900">Create & track</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Star size={18} className="text-amber-500" />
              <p className="mt-2 text-xs font-medium text-slate-500">Ratings</p>
              <p className="text-sm font-semibold text-slate-900">After resolution</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <SupportTicketForm />
        <FeedbackForm />
      </div>

      <RecentTickets />
    </div>
  );
};

export default FeedbackPage;
