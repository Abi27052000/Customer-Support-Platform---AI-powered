import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Inbox, MessageSquareText, RefreshCcw, Search } from "lucide-react";
import { useAuth } from "../../Context/AuthContext";
import LiveChatPanel from "../../Components/LiveChat/LiveChatPanel";
import { liveChatApi, type LiveChatSession } from "../../services/liveChatApi";
import { socket } from "../UserPages/AITextChat/socket";

const personLabel = (value: LiveChatSession["customerId"]) => {
  if (!value || typeof value === "string") return "Customer";
  return value.name || value.email || "Customer";
};

const lastMessage = (session: LiveChatSession) => {
  const item = session.messages?.[session.messages.length - 1];
  return item?.message || "No messages yet";
};

const RealChat = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LiveChatSession[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [staffId, setStaffId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await liveChatApi.listStaffSessions();
      setSessions(data);
      setSelectedRoom((current) => current || data[0]?.roomId || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load live chats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadStaff = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("/api/staff/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setStaffId(data.staff?.id || "");
      } catch (loadError) {
        console.error("Failed to load staff profile", loadError);
      }
    };

    void loadStaff();
    void loadSessions();
  }, []);

  useEffect(() => {
    if (!user?.orgId) return;

    socket.emit("join_staff_org", { orgId: user.orgId });
    const handleSessionUpdated = (session: LiveChatSession) => {
      if (String(session.orgId) !== String(user.orgId)) return;
      setSessions((current) => {
        const next = current.filter((item) => item.roomId !== session.roomId);
        return [session, ...next].sort(
          (a, b) =>
            new Date(b.lastMessageAt || b.updatedAt || b.createdAt).getTime() -
            new Date(a.lastMessageAt || a.updatedAt || a.createdAt).getTime()
        );
      });
      setSelectedRoom((current) => current || session.roomId);
    };

    socket.on("chat_session_updated", handleSessionUpdated);
    return () => {
      socket.off("chat_session_updated", handleSessionUpdated);
    };
  }, [user?.orgId]);

  const filteredSessions = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sessions;

    return sessions.filter((session) =>
      [session.roomId, personLabel(session.customerId), lastMessage(session), session.status]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [query, sessions]);

  const selectedSession = useMemo(
    () => sessions.find((session) => session.roomId === selectedRoom) || null,
    [selectedRoom, sessions]
  );

  const closeSelectedSession = async () => {
    if (!selectedSession) return;

    try {
      setClosing(true);
      const updated = await liveChatApi.closeSession(selectedSession.roomId);
      setSessions((current) => current.map((session) => (session.roomId === updated.roomId ? updated : session)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close chat");
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#2D2A8C] text-white">
              <MessageSquareText size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-950">Live Staff Chat</h1>
              <p className="text-sm text-slate-500">Handle customer rooms from your organization in real time.</p>
            </div>
          </div>

          <button
            onClick={loadSessions}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="relative">
              <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-[#2D2A8C] focus:bg-white"
                placeholder="Search rooms"
              />
            </div>
          </div>

          <div className="max-h-[620px] overflow-y-auto p-3">
            {loading ? (
              <p className="p-4 text-sm text-slate-500">Loading live chats...</p>
            ) : filteredSessions.length === 0 ? (
              <div className="p-8 text-center">
                <Inbox size={28} className="mx-auto text-slate-300" />
                <p className="mt-3 font-semibold text-slate-700">No live chats yet</p>
                <p className="mt-1 text-sm text-slate-500">Customer rooms will appear here when they open live chat.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSessions.map((session) => {
                  const active = session.roomId === selectedRoom;
                  return (
                    <button
                      key={session.roomId}
                      onClick={() => setSelectedRoom(session.roomId)}
                      className={`w-full rounded-lg border p-4 text-left transition ${
                        active
                          ? "border-[#2D2A8C] bg-indigo-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">{personLabel(session.customerId)}</p>
                          <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{lastMessage(session)}</p>
                          <p className="mt-2 text-xs text-slate-400">
                            {new Date(session.lastMessageAt || session.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                            session.status === "Open"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <main>
          {selectedSession ? (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={closeSelectedSession}
                  disabled={closing || selectedSession.status !== "Open"}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <CheckCircle2 size={16} />
                  {closing ? "Closing..." : "Close chat"}
                </button>
              </div>
              <LiveChatPanel
                socket={socket}
                roomId={selectedSession.roomId}
                title={personLabel(selectedSession.customerId)}
                subtitle={`Room ${selectedSession.roomId}`}
                username={user?.name || "Staff"}
                role="staff"
                orgId={user?.orgId}
                staffId={staffId}
                initialMessages={selectedSession.messages || []}
                disabled={selectedSession.status !== "Open"}
              />
            </div>
          ) : (
            <div className="flex min-h-[620px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center">
              <div>
                <Inbox size={32} className="mx-auto text-slate-300" />
                <p className="mt-3 font-semibold text-slate-700">Select a chat room</p>
                <p className="mt-1 text-sm text-slate-500">Open customer chats from the inbox to start replying.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default RealChat;
