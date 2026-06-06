import React, { useEffect, useMemo, useState } from "react";
import { Bot, CalendarDays, ChevronDown, Filter, MessageSquareText, Mic, Search } from "lucide-react";
import {
  conversationSummaryApi,
  type ConversationChannel,
  type ConversationEndedReason,
  type ConversationSummary,
} from "../../../services/conversationSummaryApi";

type ChannelFilter = ConversationChannel | "all";
type OutcomeFilter = ConversationEndedReason | "all";

const channelLabel = (channel: ConversationChannel) => channel === "ai_voice" ? "AI Voice" : "AI Chat";
const channelIcon = (channel: ConversationChannel) => channel === "ai_voice" ? Mic : MessageSquareText;

const outcomeStyle = (outcome: ConversationEndedReason) => {
  if (outcome === "escalated") return "bg-amber-50 text-amber-700 border-amber-100";
  if (outcome === "cleared") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  return "bg-slate-100 text-slate-700 border-slate-200";
};

export const AISummary: React.FC = () => {
  const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [outcome, setOutcome] = useState<OutcomeFilter>("all");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSummaries = async () => {
      try {
        setLoading(true);
        const data = await conversationSummaryApi.listSummaries({
          channel,
          endedReason: outcome,
        });
        setSummaries(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load AI summaries");
      } finally {
        setLoading(false);
      }
    };

    void loadSummaries();
  }, [channel, outcome]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return summaries;

    return summaries.filter((item) =>
      [item.title, item.summary, item.sessionId, item.channel, item.endedReason]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [query, summaries]);

  const stats = useMemo(() => ({
    total: summaries.length,
    chat: summaries.filter((item) => item.channel === "ai_chat").length,
    voice: summaries.filter((item) => item.channel === "ai_voice").length,
    escalated: summaries.filter((item) => item.endedReason === "escalated").length,
  }), [summaries]);

  return (
    <div className="w-full space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-[#2D2A8C]">
              <Bot size={14} />
              AI conversation archive
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-950">AI Summary</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review summaries saved after your AI chat and voice support sessions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Total", stats.total],
              ["Chat", stats.chat],
              ["Voice", stats.voice],
              ["Escalated", stats.escalated],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition focus:border-[#2D2A8C] focus:bg-white"
              placeholder="Search summaries"
            />
          </div>
          <select
            value={channel}
            onChange={(event) => setChannel(event.target.value as ChannelFilter)}
            className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#2D2A8C]"
          >
            <option value="all">All channels</option>
            <option value="ai_chat">AI Chat</option>
            <option value="ai_voice">AI Voice</option>
          </select>
          <select
            value={outcome}
            onChange={(event) => setOutcome(event.target.value as OutcomeFilter)}
            className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#2D2A8C]"
          >
            <option value="all">All outcomes</option>
            <option value="ended">Ended</option>
            <option value="escalated">Escalated</option>
            <option value="cleared">Cleared</option>
          </select>
        </div>
      </div>

      {loading && <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading summaries...</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}</div>}

      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Filter size={28} className="mx-auto text-slate-400" />
          <h3 className="mt-3 text-lg font-semibold text-slate-900">No summaries found</h3>
          <p className="mt-1 text-sm text-slate-500">End an AI chat or voice session to save a summary here.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((item) => {
            const Icon = channelIcon(item.channel);
            const expanded = expandedId === item.id;

            return (
              <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[#2D2A8C]">
                      <Icon size={19} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-slate-950">{item.title}</h2>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{channelLabel(item.channel)}</span>
                        <span className={`rounded-full border px-2 py-0.5 font-medium ${outcomeStyle(item.endedReason)}`}>
                          {item.endedReason}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={13} />
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedId(expanded ? null : item.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    {expanded ? "Show less" : "Details"}
                    <ChevronDown size={15} className={expanded ? "rotate-180 transition" : "transition"} />
                  </button>
                </div>

                <p className={`mt-4 text-sm leading-6 text-slate-600 ${expanded ? "" : "line-clamp-3"}`}>
                  {item.summary}
                </p>

                {expanded && (
                  <div className="mt-4 rounded-lg bg-slate-50 p-4 text-xs text-slate-500">
                    <p><span className="font-semibold text-slate-700">Session:</span> {item.sessionId}</p>
                    <p className="mt-1"><span className="font-semibold text-slate-700">Status:</span> {item.status}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
