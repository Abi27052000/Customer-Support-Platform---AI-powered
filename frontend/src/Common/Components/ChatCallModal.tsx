import React, { useState } from 'react';

interface ChatCallModalProps {
  isOpen: boolean;
  title?: string;
  onCancel: () => void;
  onChat: () => void;
  onCall: () => void;
  onResolve: (note?: string) => void;
}

const ChatCallModal: React.FC<ChatCallModalProps> = ({ isOpen, title, onCancel, onChat, onCall, onResolve }) => {
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-lg bg-white shadow-lg mx-4">
        <div className="border-b border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">Contact the customer or mark this ticket as resolved.</p>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onChat}>
              Chat
            </button>
            <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onCall}>
              Call
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Resolution note</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-[#2D2A8C] focus:bg-white"
              rows={3}
              placeholder="Optional: explain how this ticket was resolved"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 p-5">
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onCancel}>
            Close
          </button>
          <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700" onClick={() => onResolve(note)}>
            Resolve Ticket
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatCallModal;
