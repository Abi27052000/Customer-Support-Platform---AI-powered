import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message, Source } from '../types/chat.types';

interface ChatMessageProps {
  message: Message;
  sources?: Source[];
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, sources }) => {
  const isUser = message.role === 'user';

  const markdownComponents = {
    h1: ({ children }: any) => <h1 className={`text-lg font-bold mb-2 ${isUser ? 'text-white' : 'text-gray-900'}`}>{children}</h1>,
    h2: ({ children }: any) => <h2 className={`text-base font-bold mb-2 ${isUser ? 'text-white' : 'text-gray-900'}`}>{children}</h2>,
    h3: ({ children }: any) => <h3 className={`text-sm font-bold mb-1 ${isUser ? 'text-white' : 'text-gray-900'}`}>{children}</h3>,
    p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
    li: ({ children }: any) => <li>{children}</li>,
    strong: ({ children }: any) => <strong className="font-bold">{children}</strong>,
    em: ({ children }: any) => <em className="italic">{children}</em>,
    code: ({ children }: any) => <code className={`px-1 py-0.5 rounded text-xs ${isUser ? 'bg-blue-700' : 'bg-gray-300'}`}>{children}</code>,
    pre: ({ children }: any) => <pre className={`p-2 rounded text-xs overflow-x-auto mb-2 ${isUser ? 'bg-blue-700' : 'bg-gray-300'}`}>{children}</pre>,
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-900'
          }`}
        >
          <div className="text-sm">
            <ReactMarkdown components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Show sources for assistant messages */}
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            <p className="font-semibold mb-1">Sources:</p>
            <div className="space-y-1">
              {sources.map((source, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>
                    {source.pdf_filename} (Chunk {source.chunk_index}, Score:{' '}
                    {source.score.toFixed(2)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>

      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-blue-600 text-white ml-2 order-1'
            : 'bg-gray-300 text-gray-700 mr-2 order-2'
        }`}
      >
        {isUser ? 'U' : 'AI'}
      </div>
    </div>
  );
};

export default ChatMessage;
