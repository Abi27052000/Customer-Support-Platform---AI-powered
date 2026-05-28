import React, { useState } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: (note?: string) => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onCancel, onConfirm }) => {
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">{title || 'Confirm'}</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onCancel} aria-label="Close">✕</button>
        </div>

        <div className="p-4">
          {message && <p className="text-sm text-gray-600 mb-3">{message}</p>}

          <label className="block text-sm text-gray-700 mb-1">Optional note</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full border rounded p-2 text-sm" rows={3} />
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <button className="px-3 py-1 bg-white border rounded" onClick={onCancel}>{cancelLabel}</button>
          <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => onConfirm(note)}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
