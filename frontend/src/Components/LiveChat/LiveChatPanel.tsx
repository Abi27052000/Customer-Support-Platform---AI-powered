import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Wifi } from "lucide-react";
import type { Socket } from "socket.io-client";
import type { LiveChatMessage } from "../../services/liveChatApi";

interface LiveChatPanelProps {
  socket: Socket;
  roomId: string;
  title: string;
  subtitle?: string;
  username: string;
  role: 'customer' | 'staff';
  orgId?: string;
  customerId?: string;
  staffId?: string;
  initialMessages?: LiveChatMessage[];
  disabled?: boolean;
}

interface SocketMessage extends LiveChatMessage {
  room: string;
  time?: string;
  orgId?: string;
  customerId?: string;
  staffId?: string;
}

const messageTime = (message: LiveChatMessage) => {
  const date = message.sentAt ? new Date(message.sentAt) : new Date();
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const LiveChatPanel = ({
  socket,
  roomId,
  title,
  subtitle,
  username,
  role,
  orgId,
  customerId,
  staffId,
  initialMessages = [],
  disabled = false,
}: LiveChatPanelProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<LiveChatMessage[]>(initialMessages);

  // Reseed only when switching rooms; live updates arrive via receive_message.
  // Depending on initialMessages here would wipe the list on every render,
  // since the default [] is a new reference each time.
  const initialMessagesRef = useRef(initialMessages);
  initialMessagesRef.current = initialMessages;

  useEffect(() => {
    setMessages(initialMessagesRef.current);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;

    const joinRoom = () => {
      socket.emit("join_room", {
        roomId,
        orgId,
        customerId,
        staffId,
        role,
      });
    };

    joinRoom();
    // Rooms are lost on the server when the connection drops, so rejoin
    // whenever the socket reconnects.
    socket.on("connect", joinRoom);

    const handleReceive = (data: SocketMessage) => {
      if (data.room !== roomId) return;
      setMessages((current) => [
        ...current,
        {
          author: data.author,
          role: data.role,
          message: data.message,
          sentAt: data.sentAt || new Date().toISOString(),
        },
      ]);
    };

    socket.on("receive_message", handleReceive);
    return () => {
      socket.off("connect", joinRoom);
      socket.off("receive_message", handleReceive);
    };
  }, [customerId, orgId, role, roomId, socket, staffId]);

  const canSend = useMemo(() => message.trim().length > 0 && !disabled && roomId, [disabled, message, roomId]);

  const sendMessage = () => {
    if (!canSend) return;

    const outgoing: SocketMessage = {
      room: roomId,
      author: username,
      role,
      message: message.trim(),
      time: new Date().toLocaleTimeString(),
      sentAt: new Date().toISOString(),
      orgId,
      customerId,
      staffId,
    };

    socket.emit("send_message", outgoing);
    setMessage("");
  };

  return (
    <div className="flex h-full min-h-[620px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle || `Room ${roomId}`}</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Wifi size={14} />
            Live
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-5">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="font-semibold text-slate-700">No messages yet</p>
              <p className="mt-1 text-sm text-slate-500">Send the first message to start the live support chat.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((item, index) => {
              const mine = item.role === role && item.author === username;
              return (
                <div key={`${item.sentAt || index}-${index}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-lg px-4 py-3 shadow-sm ${
                      mine
                        ? "bg-[#2D2A8C] text-white"
                        : "border border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    {!mine && <p className="mb-1 text-xs font-semibold text-slate-400">{item.author || "Support"}</p>}
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">{item.message}</p>
                    <p className={`mt-1 text-right text-[11px] ${mine ? "text-white/70" : "text-slate-400"}`}>
                      {messageTime(item)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white p-4">
        <div className="flex gap-3">
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && sendMessage()}
            disabled={disabled}
            className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-[#2D2A8C] focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            placeholder={disabled ? "This chat is closed" : "Type your message..."}
          />
          <button
            onClick={sendMessage}
            disabled={!canSend}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#2D2A8C] text-white transition hover:bg-[#242170] disabled:bg-slate-300"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveChatPanel;
