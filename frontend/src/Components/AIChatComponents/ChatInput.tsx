import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      <div className="flex items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2 transition focus-within:border-[#2D2A8C] focus-within:bg-white">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or describe your issue..."
          disabled={disabled}
          className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
          rows={2}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#2D2A8C] text-white transition hover:bg-[#242170] disabled:cursor-not-allowed disabled:bg-slate-300"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-400">Press Enter to send. Shift + Enter adds a new line.</p>
    </div>
  );
};

export default ChatInput;
