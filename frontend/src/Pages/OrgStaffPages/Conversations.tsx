import React from 'react';
import FilterBar from '../../Common/Components/FilterBar';
import ConversationItem from '../../Common/Components/ConversationItem';

type ConvStatus = 'Open' | 'Pending' | 'Resolved' | 'Closed';

type Conversation = {
  id: string;
  subject: string;
  customer: string;
  time: string;
  status: ConvStatus;
}

const OrgStaffConversations: React.FC = () => {
  const conversations: Conversation[] = [
    { id: 'C-1001', subject: 'Order delay issue', customer: 'John Doe', time: '2h ago', status: 'Open' },
    { id: 'C-1004', subject: 'Account login problem', customer: 'Ravi Kumar', time: '3h ago', status: 'Pending' },
    { id: 'C-1005', subject: 'Refund request', customer: 'S. Lee', time: '5h ago', status: 'Resolved' },
  ];

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#2D2A8C]">Conversations</h2>
          <div className="text-sm text-gray-600">Total: {conversations.length}</div>
        </div>

        <div className="mt-4">
          <FilterBar />
        </div>

        <div className="mt-4 space-y-3">
          {conversations.map((c) => (
            <ConversationItem key={c.id} convId={c.id} subject={c.subject} customer={c.customer} time={c.time} status={c.status} />
          ))}
        </div>

      </div>
    </div>
  );
};

export default OrgStaffConversations;
