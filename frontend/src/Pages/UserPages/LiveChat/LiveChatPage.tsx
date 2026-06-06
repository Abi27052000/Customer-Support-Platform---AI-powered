import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, MessagesSquare } from "lucide-react";
import { useAuth } from "../../../Context/AuthContext";
import { socket } from "../AITextChat/socket";
import LiveChatPanel from "../../../Components/LiveChat/LiveChatPanel";

const LiveChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const roomId = useMemo(() => `live_${user?.id || "guest"}_${Date.now()}`, [user?.id]);

  if (!user?.orgId) {
    return (
      <div className="flex min-h-[calc(100vh-136px)] items-center justify-center">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-[#2D2A8C]">
            <Building2 size={22} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Select an organization first</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Live staff chat needs an organization workspace so the right support team can see your request.
          </p>
          <button
            onClick={() => navigate('/org-picker')}
            className="mt-5 rounded-lg bg-[#2D2A8C] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#242170]"
          >
            Choose Organization
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#2D2A8C] text-white">
              <MessagesSquare size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-950">Live Staff Chat</h1>
              <p className="text-sm text-slate-500">Talk directly with your organization's support staff.</p>
            </div>
          </div>
          <Link to="/feedback" className="text-sm font-semibold text-[#2D2A8C]">
            Create a ticket instead
          </Link>
        </div>
      </div>

      <LiveChatPanel
        socket={socket}
        roomId={roomId}
        title="Customer Support"
        subtitle={`Reference ${roomId.replace("live_", "#")}`}
        username={user.name}
        role="customer"
        orgId={user.orgId}
        customerId={user.id}
      />
    </div>
  );
};

export default LiveChatPage;
