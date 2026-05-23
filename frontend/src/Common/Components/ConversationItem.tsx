import React from "react";

interface ConversationItemProps {
  convId: string;
  subject: string;
  customer: string;
  time: string;
  status: 'Open' | 'Pending' | 'Resolved' | 'Closed';
  summary?: string;
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

const shortId = (id: string) => id.length > 10 ? id.slice(-8) : id;

const ConversationItem: React.FC<ConversationItemProps> = ({ convId, subject, customer, time, status, summary }) => {
  return (
    <div className="p-4 rounded-lg border flex items-start justify-between gap-4 bg-white">
      <div className="min-w-0">
        <div className="text-base font-semibold text-[#111827]">{subject}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
          <span>#{shortId(convId)}</span>
          <span>{customer}</span>
          <span>{time}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs ${statusColor(status)}`}>{status}</span>
        </div>
        {summary && <p className="mt-3 text-sm leading-6 text-gray-700 max-w-4xl">{summary}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button className="text-sm px-3 py-1 border rounded hover:bg-[#f3f4ff]">Assign</button>
        <button className="text-sm px-3 py-1 bg-[#2D2A8C] text-white rounded">Open</button>
      </div>
    </div>
  );
}

export default ConversationItem;
