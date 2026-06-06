import { useEffect, useMemo, useState } from "react";
import { Clock, Inbox, Loader2, Ticket } from "lucide-react";
import { requestApi, type SupportRequest } from "../../../../services/requestApi";

const statusStyle = (status: SupportRequest["status"]) => {
  if (status === "Open") return "bg-red-50 text-red-700 border-red-100";
  if (status === "Resolved") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const RecentTickets = () => {
  const [tickets, setTickets] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        const data = await requestApi.listRequests();
        setTickets(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tickets");
      } finally {
        setLoading(false);
      }
    };

    void loadTickets();
  }, []);

  const recentTickets = useMemo(() => tickets.slice(0, 6), [tickets]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Ticket size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Recent Tickets</h2>
            <p className="mt-1 text-sm text-slate-500">Your latest support requests and their current status.</p>
          </div>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {tickets.length} total
        </span>
      </div>

      {loading && (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          <Loader2 size={17} className="animate-spin" />
          Loading tickets...
        </div>
      )}

      {error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {!loading && !error && recentTickets.length === 0 && (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
          <Inbox size={28} className="mx-auto text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-700">No tickets yet</p>
          <p className="mt-1 text-sm text-slate-500">Create a ticket above when you need staff help.</p>
        </div>
      )}

      {!loading && !error && recentTickets.length > 0 && (
        <div className="mt-5 space-y-3">
          {recentTickets.map((ticket) => (
            <div key={ticket._id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{ticket.title}</p>
                  {ticket.description && (
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{ticket.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                    <Clock size={14} />
                    {new Date(ticket.createdAt).toLocaleString()}
                    <span>#{ticket._id.slice(-8)}</span>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecentTickets;
