import React from "react";

interface ConversationItemProps {
  convId: string;
  subject: string;
  customer: string;
  time: string;
  status: 'Open' | 'Pending' | 'Resolved' | 'Closed';
}

const statusColor = (s: string) => {
  switch (s) {
    case 'Open': return 'bg-red-100 text-red-600';
    case 'Pending': return 'bg-yellow-100 text-yellow-700';
    case 'Resolved': return 'bg-green-100 text-green-700';
    case 'Closed': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

const ConversationItem: React.FC<ConversationItemProps> = ({ convId, subject, customer, time, status }) => {
  return (
    <div className="p-3 rounded-lg border flex items-center justify-between bg-white">
      <div>
        <div className="text-sm font-medium text-[#111827]">{subject}</div>
        <div className="text-xs text-gray-400">#{convId} • {customer} • {time} • <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor(status)}`}>{status}</span></div>
      </div>

      <div className="flex items-center gap-2">
        <button className="text-sm px-3 py-1 border rounded hover:bg-[#f3f4ff]">Assign</button>
        <button className="text-sm px-3 py-1 bg-[#2D2A8C] text-white rounded">Open</button>
      </div>
    </div>
  );
}

export default ConversationItem;
