import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bot, FileText, LifeBuoy, MessageSquareText, Mic, Star, TicketCheck } from "lucide-react";
import { useAuth } from "../../../Context/AuthContext";
import { conversationSummaryApi, type ConversationSummary } from "../../../services/conversationSummaryApi";
import { requestApi, type SupportRequest } from "../../../services/requestApi";
import { staffRatingApi, type RateableInteraction } from "../../../services/staffRatingApi";

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  badge: string;
  tone: string;
};

const statusTone = (status: string) => {
  if (status === "Open" || status === "escalated") return "border-amber-100 bg-amber-50 text-amber-700";
  if (status === "Resolved" || status === "Closed" || status === "cleared") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
};

export default function Dashboard() {
  const { user, orgs } = useAuth();
  const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
  const [tickets, setTickets] = useState<SupportRequest[]>([]);
  const [rateable, setRateable] = useState<RateableInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [summaryData, ticketData, rateableData] = await Promise.all([
          conversationSummaryApi.listSummaries(),
          requestApi.listRequests(),
          staffRatingApi.listRateable(),
        ]);
        setSummaries(summaryData);
        setTickets(ticketData);
        setRateable(rateableData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const activeOrg = useMemo(
    () => orgs.find((org) => String(org.id) === String(user?.orgId)),
    [orgs, user?.orgId]
  );

  const stats = useMemo(() => {
    const openTickets = tickets.filter((ticket) => ticket.status === "Open").length;
    const resolvedTickets = tickets.filter((ticket) => ticket.status === "Closed" || ticket.status === "Resolved").length;
    const escalations = summaries.filter((summary) => summary.endedReason === "escalated").length;

    return {
      conversations: summaries.length,
      openTickets,
      resolvedTickets,
      escalations,
      rateable: rateable.length,
    };
  }, [rateable.length, summaries, tickets]);

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const summaryItems = summaries.map((summary) => ({
      id: summary.id,
      title: summary.title,
      description: summary.summary,
      date: summary.createdAt,
      badge: summary.channel === "ai_voice" ? "AI Voice" : "AI Chat",
      tone: statusTone(summary.endedReason),
    }));

    const ticketItems = tickets.map((ticket) => ({
      id: ticket._id,
      title: ticket.title,
      description: ticket.description || ticket.conversationSummary || "Support ticket created.",
      date: ticket.createdAt,
      badge: ticket.status,
      tone: statusTone(ticket.status),
    }));

    return [...summaryItems, ...ticketItems]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [summaries, tickets]);

  const actionCards = [
    {
      title: "Start AI Chat",
      description: "Ask questions from the selected organization's knowledge base.",
      icon: MessageSquareText,
      href: "/AI-chat",
    },
    {
      title: "Call AI Voice",
      description: "Speak with the support assistant and save a summary after the call.",
      icon: Mic,
      href: "/AI-voice",
    },
    {
      title: "Create Ticket",
      description: "Open a support request when you need staff help.",
      icon: LifeBuoy,
      href: "/feedback",
    },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-[#2D2A8C]">
              <Bot size={14} />
              Support IQ dashboard
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">
              Welcome back, {user?.name?.split(" ")[0] || "there"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Track your AI support activity, open tickets, resolved cases, and items waiting for your rating.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current organization</p>
            <p className="mt-2 text-lg font-bold text-slate-950">{activeOrg?.name || "No organization selected"}</p>
            <p className="mt-1 text-sm text-slate-500">
              {activeOrg ? "AI chat and support tickets use this workspace." : "Choose an organization before using support tools."}
            </p>
            <Link
              to="/org-picker"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Switch workspace
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      {loading && <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading dashboard...</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "AI Conversations", value: stats.conversations, icon: Bot, detail: "Saved summaries" },
              { label: "Open Tickets", value: stats.openTickets, icon: TicketCheck, detail: "Waiting on support" },
              { label: "Resolved Tickets", value: stats.resolvedTickets, icon: FileText, detail: "Closed or resolved" },
              { label: "Escalations", value: stats.escalations, icon: LifeBuoy, detail: "AI sent to staff" },
              { label: "Awaiting Rating", value: stats.rateable, icon: Star, detail: "Resolved interactions" },
            ].map(({ label, value, icon: Icon, detail }) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
                    <p className="mt-2 text-xs text-slate-500">{detail}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-[#2D2A8C]">
                    <Icon size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Quick Actions</h2>
              <div className="mt-4 space-y-3">
                {actionCards.map(({ title, description, icon: Icon, href }) => (
                  <Link
                    key={title}
                    to={href}
                    className="group block rounded-lg border border-slate-200 p-4 transition hover:border-[#2D2A8C]/40 hover:bg-indigo-50/40"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#2D2A8C] group-hover:bg-white">
                        <Icon size={19} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">{title}</p>
                        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Recent Support Activity</h2>
                  <p className="mt-1 text-sm text-slate-500">Latest summaries and tickets from your account.</p>
                </div>
                <Link to="/reports" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2D2A8C]">
                  View reports
                  <ArrowRight size={15} />
                </Link>
              </div>

              {recentActivity.length === 0 ? (
                <div className="mt-5 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                  <p className="font-semibold text-slate-700">No activity yet</p>
                  <p className="mt-1 text-sm text-slate-500">Start an AI chat, voice call, or support ticket to populate your dashboard.</p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {recentActivity.map((item) => (
                    <div key={`${item.badge}-${item.id}`} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">{item.title}</p>
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{item.description}</p>
                          <p className="mt-2 text-xs text-slate-400">{new Date(item.date).toLocaleString()}</p>
                        </div>
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${item.tone}`}>
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
}
