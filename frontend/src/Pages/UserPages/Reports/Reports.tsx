import { useEffect, useMemo, useState } from "react";
import { Download, FileText, MessageSquareText, Mic, Printer, TicketCheck, TrendingUp } from "lucide-react";
import { conversationSummaryApi, type ConversationSummary } from "../../../services/conversationSummaryApi";
import { requestApi, type SupportRequest } from "../../../services/requestApi";
import { staffRatingApi, type RateableInteraction } from "../../../services/staffRatingApi";

type ActivityItem = {
  id: string;
  type: "summary" | "ticket";
  title: string;
  detail: string;
  badge: string;
  createdAt: string;
};

const csvEscape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const statusStyle = (status: string) => {
  if (status === "Open" || status === "escalated") return "bg-amber-50 text-amber-700 border-amber-100";
  if (status === "Resolved" || status === "cleared") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const Reports = () => {
  const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
  const [tickets, setTickets] = useState<SupportRequest[]>([]);
  const [rateableInteractions, setRateableInteractions] = useState<RateableInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      const [summaryData, ticketData, rateableData] = await Promise.all([
        conversationSummaryApi.listSummaries(),
        requestApi.listRequests(),
        staffRatingApi.listRateable(),
      ]);
      setSummaries(summaryData);
      setTickets(ticketData);
      setRateableInteractions(rateableData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, []);

  const stats = useMemo(() => {
    const chat = summaries.filter((item) => item.channel === "ai_chat").length;
    const voice = summaries.filter((item) => item.channel === "ai_voice").length;
    const escalated = summaries.filter((item) => item.endedReason === "escalated").length;
    const openTickets = tickets.filter((item) => item.status === "Open").length;
    const closedTickets = tickets.filter((item) => item.status === "Closed" || item.status === "Resolved").length;

    return {
      totalSummaries: summaries.length,
      chat,
      voice,
      escalated,
      totalTickets: tickets.length,
      openTickets,
      closedTickets,
      awaitingRatings: rateableInteractions.length,
    };
  }, [rateableInteractions.length, summaries, tickets]);

  const activities = useMemo<ActivityItem[]>(() => {
    const summaryItems = summaries.map((item) => ({
      id: item.id,
      type: "summary" as const,
      title: item.title,
      detail: item.summary,
      badge: item.channel === "ai_voice" ? "AI Voice" : "AI Chat",
      createdAt: item.createdAt,
    }));
    const ticketItems = tickets.map((item) => ({
      id: item._id,
      type: "ticket" as const,
      title: item.title,
      detail: item.description || item.conversationSummary || "No description provided.",
      badge: item.status,
      createdAt: item.createdAt,
    }));

    return [...summaryItems, ...ticketItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);
  }, [summaries, tickets]);

  const exportCsv = () => {
    const rows = [
      ["Type", "Title", "Status/Channel", "Date", "Details"],
      ...summaries.map((item) => [
        "AI Summary",
        item.title,
        `${item.channel} / ${item.endedReason}`,
        new Date(item.createdAt).toLocaleString(),
        item.summary,
      ]),
      ...tickets.map((item) => [
        "Ticket",
        item.title,
        item.status,
        new Date(item.createdAt).toLocaleString(),
        item.description || item.conversationSummary || "",
      ]),
    ];

    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `support-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6">
      <style>{`
        @media print {
          button, nav, aside, .print-hidden { display: none !important; }
          body { background: white !important; }
          .print-card { box-shadow: none !important; border-color: #cbd5e1 !important; }
        }
      `}</style>

      <div className="print-card rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-[#2D2A8C]">
              <FileText size={14} />
              Personal support report
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">Reports</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review your AI conversations, support tickets, escalations, and recent support activity.
            </p>
          </div>

          <div className="print-hidden flex flex-wrap gap-2">
            <button
              onClick={exportCsv}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={printReport}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2D2A8C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#242170] disabled:bg-slate-300"
            >
              <Printer size={16} />
              Print
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading report...</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "AI Conversations", value: stats.totalSummaries, icon: TrendingUp, detail: "Saved AI summaries" },
              { label: "AI Chat", value: stats.chat, icon: MessageSquareText, detail: "Text support sessions" },
              { label: "AI Voice", value: stats.voice, icon: Mic, detail: "Voice support sessions" },
              { label: "Tickets", value: stats.totalTickets, icon: TicketCheck, detail: `${stats.openTickets} open, ${stats.closedTickets} closed` },
            ].map(({ label, value, icon: Icon, detail }) => (
              <div key={label} className="print-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-1 text-3xl font-bold text-slate-950">{value}</p>
                    <p className="mt-2 text-xs text-slate-500">{detail}</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50 text-[#2D2A8C]">
                    <Icon size={21} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
            <div className="print-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Outcome Snapshot</h2>
              <div className="mt-4 space-y-3">
                {[
                  ["Escalated AI sessions", stats.escalated],
                  ["Open tickets", stats.openTickets],
                  ["Closed or resolved tickets", stats.closedTickets],
                  ["Awaiting ratings", stats.awaitingRatings],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className="font-semibold text-slate-950">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="print-card rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-950">Recent Activity</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {activities.length} items
                </span>
              </div>

              {activities.length === 0 ? (
                <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  No report data yet. End an AI session or create a support ticket to populate this report.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {activities.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">{item.title}</p>
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{item.detail}</p>
                          <p className="mt-2 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle(item.badge)}`}>
                          {item.badge}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
