import React from "react";
import StatCard from "../../Common/Components/StatCard";
import ConversationItem from "../../Common/Components/ConversationItem";
import FilterBar from "../../Common/Components/FilterBar";

const OrgStaffDashboard: React.FC = () => {
  const conversations = [
    { id: 'C-1001', subject: 'Order delay issue', customer: 'John Doe', time: '2h ago', status: 'Open' },
    { id: 'C-1002', subject: 'Billing question', customer: 'Jane Smith', time: '4h ago', status: 'Pending' },
    { id: 'C-1003', subject: 'Feature request', customer: 'Acme', time: '1d ago', status: 'Resolved' },
  ];

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
            <ConversationItem key={c.id} convId={c.id} subject={c.subject} customer={c.customer} time={c.time} status={c.status as any} />
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
