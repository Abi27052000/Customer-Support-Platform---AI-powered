import React from 'react';

interface ChatCallModalProps {
  isOpen: boolean;
  title?: string;
  onCancel: () => void;
  onChat: () => void;
  onCall: () => void;
}

const ChatCallModal: React.FC<ChatCallModalProps> = ({ isOpen, title, onCancel, onChat, onCall }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-sm mx-4">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="p-4">
          <div className="flex flex-col gap-3">
            <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={onChat}>Chat</button>
            <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={onCall}>Call</button>
            <div className="text-sm text-gray-600">Chat/Call resolves the ticket.</div>
          </div>
        </div>
        <div className="flex items-center justify-end p-4 border-t">
          <button className="px-3 py-1 bg-white border rounded mr-2" onClick={onCancel}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ChatCallModal;
