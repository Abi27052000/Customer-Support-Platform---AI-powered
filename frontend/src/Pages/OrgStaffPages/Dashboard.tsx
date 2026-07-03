import React, { useEffect, useMemo, useState } from "react";
import StatCard from "../../Common/Components/StatCard";
import ConversationItem from "../../Common/Components/ConversationItem";
import FilterBar from "../../Common/Components/FilterBar";
import { requestApi, type SupportRequest, type SupportUser } from "../../services/requestApi";

const customerLabel = (user: SupportRequest["userId"]) => {
  if (!user || typeof user === "string") return "Customer";
  const value = user as SupportUser;
  return value.name || value.email || "Customer";
};

const terminalDate = (request: SupportRequest) => {
  const terminal = [...(request.statusHistory || [])]
    .reverse()
    .find((item) => item.status === "Closed" || item.status === "Resolved");
  return terminal?.changedAt || (request.status === "Closed" || request.status === "Resolved" ? request.updatedAt : null);
};

const formatDuration = (minutes: number | null) => {
  if (!minutes || minutes <= 0) return "N/A";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
};

const OrgStaffDashboard: React.FC = () => {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [staffId, setStaffId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (token) {
        const staffRes = await fetch("/api/staff/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          setStaffId(staffData.staff?.id || "");
          localStorage.setItem("staffId", staffData.staff?.id || "");
        }
      }

      const data = await requestApi.listRequests();
      setRequests(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const stats = useMemo(() => {
    const open = requests.filter((item) => item.status === "Open").length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const resolvedToday = requests.filter((item) => {
      const end = terminalDate(item);
      return end ? new Date(end) >= today : false;
    }).length;
    const durations = requests
      .map((item) => {
        const end = terminalDate(item);
        if (!end) return null;
        const value = (new Date(end).getTime() - new Date(item.createdAt).getTime()) / 60000;
        return Number.isFinite(value) && value >= 0 ? value : null;
      })
      .filter((value): value is number => value !== null);
    const averageMinutes = durations.length
      ? durations.reduce((sum, value) => sum + value, 0) / durations.length
      : null;

    return {
      open,
      resolvedToday,
      averageResolution: formatDuration(averageMinutes),
    };
  }, [requests]);

  const handleClose = async (id: string, note?: string) => {
    try {
      const closedByStaffId = staffId || localStorage.getItem("staffId") || undefined;
      await requestApi.closeRequest(id, note, closedByStaffId);
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close ticket");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Open Tickets" value={stats.open} description="Open tickets in your organization" />
          <StatCard title="Resolved Today" value={stats.resolvedToday} description="Closed or resolved today" />
          <StatCard title="Average Resolution" value={stats.averageResolution} description="Across resolved tickets" />
        </div>

        <div className="md:w-96 bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-[#2D2A8C]">Quick Actions</h3>
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <p>Review open tickets, resolve customer issues, and keep notes clear for ratings and reports.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#2D2A8C]">Organization Tickets</h3>
          <div className="text-sm text-gray-500">Showing {requests.length} of {requests.length}</div>
        </div>

        <FilterBar />

        <div className="mt-4 space-y-3">
          {loading && <div className="text-sm text-gray-500">Loading tickets...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!loading && !error && requests.length === 0 && (
            <div className="text-sm text-gray-500">No tickets found for your organization.</div>
          )}
          {!loading && !error && requests.map((request) => (
            <ConversationItem
              key={request._id}
              convId={request._id}
              subject={request.title}
              customer={customerLabel(request.userId)}
              time={new Date(request.createdAt).toLocaleString()}
              status={request.status as any}
              summary={request.description || request.conversationSummary}
              onClose={handleClose}
              onOpen={() => void loadRequests()}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-[#2D2A8C] mb-2">My Tasks</h3>
          <ul className="text-sm text-gray-600 list-disc pl-6">
            <li>Prioritize older open tickets first.</li>
            <li>Use concise resolution notes before closing tickets.</li>
            <li>Check customer ratings after resolved conversations.</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-[#2D2A8C] mb-2">Announcements</h3>
          <p className="text-sm text-gray-600">No announcements right now.</p>
        </div>
      </div>
    </div>
  );
};

export default OrgStaffDashboard;
