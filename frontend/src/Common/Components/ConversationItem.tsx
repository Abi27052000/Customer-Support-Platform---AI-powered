import React, { useState } from "react";
import ConfirmModal from './ConfirmModal';
import ChatCallModal from './ChatCallModal';
import InfoModal from './InfoModal';

interface ConversationItemProps {
  convId: string;
  subject: string;
  customer: string;
  time: string;
  status: 'Open' | 'Pending' | 'Resolved' | 'Closed';
  summary?: string;
  onClose?: (id: string, note?: string) => void;
  onOpen?: (id: string) => void;
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

const getJsonAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const ConversationItem: React.FC<ConversationItemProps> = ({ convId, subject, customer, time, status, summary, onClose, onOpen }) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
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

      <div className="flex shrink-0 items-center gap-2 relative">
        <>
          <button
            className={`text-sm px-3 py-1 border rounded hover:bg-[#f3f4ff] ${status === 'Closed' ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => { if (status !== 'Closed') setConfirmOpen(true); }}
            disabled={status === 'Closed'}
          >
            Close
          </button>
          <ConfirmModal
            isOpen={confirmOpen}
            title={`Close: ${subject}`}
            message={`Are you sure you want to close this request?`}
            confirmLabel="Close Request"
            cancelLabel="Cancel"
            onCancel={() => setConfirmOpen(false)}
            onConfirm={(note) => {
              setConfirmOpen(false);
              if (onClose) onClose(convId, note);
            }}
          />
        </>
        <div>
          <button
            className={`text-sm px-3 py-1 bg-[#2D2A8C] text-white rounded ${status === 'Closed' ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => { if (status !== 'Closed') { setPanelOpen(!panelOpen); if (!panelOpen && onOpen) onOpen(convId); } }}
            disabled={status === 'Closed'}
          >
            Open
          </button>
          <ChatCallModal
            isOpen={panelOpen}
            title={subject}
            onCancel={() => setPanelOpen(false)}
            onChat={async () => {
              try {
                const closedByStaffId = localStorage.getItem('staffId') || undefined;
                await fetch(`/api/requests/${convId}/resolve`, { method: 'PUT', headers: getJsonAuthHeaders(), body: JSON.stringify({ resolvedByStaffId: closedByStaffId, note: 'Resolved via Chat' }) });
                setInfoMessage('Marked as Resolved');
                setInfoOpen(true);
                setPanelOpen(false);
                if (onClose) onClose(convId, 'Resolved via Chat');
              } catch (err) { console.error(err); }
            }}
            onCall={async () => {
              try {
                const closedByStaffId = localStorage.getItem('staffId') || undefined;
                await fetch(`/api/requests/${convId}/resolve`, { method: 'PUT', headers: getJsonAuthHeaders(), body: JSON.stringify({ resolvedByStaffId: closedByStaffId, note: 'Resolved via Call' }) });
                setInfoMessage('Marked as Resolved');
                setInfoOpen(true);
                setPanelOpen(false);
                if (onClose) onClose(convId, 'Resolved via Call');
              } catch (err) { console.error(err); }
            }}
          />
        </div>
        <InfoModal isOpen={infoOpen} title={subject} message={infoMessage} onClose={() => setInfoOpen(false)} />
      </div>
    </div>
  );
}

export default ConversationItem;
