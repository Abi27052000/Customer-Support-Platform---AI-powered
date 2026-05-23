import React from 'react';

interface InfoModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, title, message, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-sm mx-4">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-700">{message}</p>
        </div>
        <div className="flex items-center justify-end p-4 border-t">
          <button className="px-3 py-1 bg-indigo-600 text-white rounded" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}

export default InfoModal;
