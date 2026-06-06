import React, { useEffect, useState } from "react";
import StatCard from "../../Common/Components/StatCard";
import ConversationItem from "../../Common/Components/ConversationItem";
import FilterBar from "../../Common/Components/FilterBar";

const OrgStaffDashboard: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [staffId, setStaffId] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const staffRes = await fetch('/api/staff/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (staffRes.ok) {
            const staffData = await staffRes.json();
            setStaffId(staffData.staff?.id || "");
            localStorage.setItem('staffId', staffData.staff?.id || "");
          }
        }

        const res = await fetch('/api/requests');
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        const mapped = data.requests.map((r: any) => ({ id: r._id, subject: r.title, customer: r.userId, time: new Date(r.createdAt).toLocaleString(), status: r.status, summary: r.description }));
        setConversations(mapped);
      } catch (err) {
        console.error('load requests', err);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Open Conversations" value={12} description="Conversations assigned to you" />
          <StatCard title="Resolved Today" value={5} description="Resolved by the team" />
          <StatCard title="Average Response" value={'1h 23m'} description="Average first response time" />
        </div>

        <div className="md:w-96 bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-[#2D2A8C]">Quick Actions</h3>
          <div className="mt-3 space-y-2">
            <button className="w-full text-left px-3 py-2 border rounded hover:bg-[#f3f4ff]">Start New Conversation</button>
            <button className="w-full text-left px-3 py-2 border rounded hover:bg-[#f3f4ff]">View My Assignments</button>
            <button className="w-full text-left px-3 py-2 border rounded hover:bg-[#f3f4ff]">Mark All as Read</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#2D2A8C]">Recent Conversations</h3>
          <div className="text-sm text-gray-500">Showing 3 of 25</div>
        </div>

        <FilterBar />

        <div className="mt-4 space-y-3">
          {conversations.map((c) => (
            <ConversationItem
              key={c.id}
              convId={c.id}
              subject={c.subject}
              customer={c.customer}
              time={c.time}
              status={c.status as any}
              summary={c.summary}
              onClose={async (id, note) => {
                try {
                  // include closedByStaffId if available in localStorage (optional)
                  const closedByStaffId = staffId || localStorage.getItem('staffId') || undefined;
                  await fetch(`/api/requests/${id}/close`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note, closedByStaffId }) });
                  // reload
                  const res = await fetch('/api/requests');
                  const data = await res.json();
                  const mapped = data.requests.map((r: any) => ({ id: r._id, subject: r.title, customer: r.userId, time: new Date(r.createdAt).toLocaleString(), status: r.status, summary: r.description }));
                  setConversations(mapped);
                } catch (err) { console.error(err); }
              }}
              onOpen={(id) => {
                // placeholder: open panel shown by ConversationItem; additional logic can be added here
                console.log('open', id);
              }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-[#2D2A8C] mb-2">My Tasks</h3>
          <ul className="text-sm text-gray-600 list-disc pl-6">
            <li>Follow up with John Doe on order #C-1001</li>
            <li>Close resolved tickets</li>
            <li>Update knowledge base article</li>
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
