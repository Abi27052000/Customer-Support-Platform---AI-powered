import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import EscalationView from './EscalationView';
import type { Message, Source } from '../../types/chat.types';
import { chatApi } from '../../services/chatApi';

const EMOTION_API = 'http://localhost:8000/api/emotion-detection/';

const NEGATIVE_EMOTIONS = new Set([
  'anger', 'annoyance', 'disgust', 'fear', 'sadness',
  'grief', 'remorse', 'disappointment', 'disapproval', 'nervousness',
]);

const HIGH_URGENCY_EMOTIONS = new Set(['anger', 'disgust', 'fear']);
const HIGH_URGENCY_THRESHOLD = 0.55;
const STREAK_LIMIT = 2;

async function detectNegative(text: string): Promise<{ isNegative: boolean; isUrgent: boolean }> {
  try {
    const res = await fetch(EMOTION_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return { isNegative: false, isUrgent: false };
    const data: { emotions: string[]; all_probabilities: Record<string, number> } = await res.json();

    const isNegative = data.emotions.some((e) => NEGATIVE_EMOTIONS.has(e));
    const isUrgent = [...HIGH_URGENCY_EMOTIONS].some(
      (e) => (data.all_probabilities[e] ?? 0) > HIGH_URGENCY_THRESHOLD
    );
    return { isNegative, isUrgent };
  } catch {
    return { isNegative: false, isUrgent: false };
  }
}

interface ChatInterfaceProps {
  sessionId: string;
  organizationId: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  sessionId,
  organizationId,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sources, setSources] = useState<{ [key: number]: Source[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escalated, setEscalated] = useState(false);
  const negativeStreakRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    setError(null);

    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    // Run emotion detection in parallel with the chat request (fire-and-forget style)
    const emotionPromise = detectNegative(content);

    try {
      const [response, emotionResult] = await Promise.all([
        chatApi.sendMessage({
          session_id: sessionId,
          organization_id: organizationId,
          query: content,
          top_k: 3,
          score_threshold: 0.4,
        }),
        emotionPromise,
      ]);

      // Update negative streak counter
      if (emotionResult.isNegative) {
        negativeStreakRef.current += 1;
      } else {
        negativeStreakRef.current = 0;
      }

      // Escalate if urgently negative OR streak threshold reached
      if (emotionResult.isUrgent || negativeStreakRef.current >= STREAK_LIMIT) {
        setEscalated(true);
        setLoading(false);
        return;
      }

      const aiMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      setSources((prev) => ({
        ...prev,
        [messages.length + 1]: response.sources,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      try {
        await chatApi.clearHistory(sessionId);
        setMessages([]);
        setSources({});
        setError(null);
      } catch (err) {
        setError('Failed to clear chat history');
        console.error('Error clearing chat:', err);
      }
    }
  };

  const handleReturnToChat = () => {
    negativeStreakRef.current = 0;
    setEscalated(false);
  };

  if (escalated) {
    return (
      <div className="flex flex-col h-full bg-gray-100">
        {/* Keep the header so the user knows which session they're in */}
        <div className="bg-indigo-700 text-white p-4 shadow-md">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">Support Escalation</h1>
              <p className="text-sm opacity-80">Session: {sessionId} | Org: {organizationId}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <EscalationView onGoBack={handleReturnToChat} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">AI RAG Chatbot</h1>
            <p className="text-sm opacity-90">
              Session: {sessionId} | Org: {organizationId}
            </p>
          </div>
          <button
            onClick={handleClearChat}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors text-sm"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium">Start a conversation</h3>
              <p className="mt-1 text-sm">
                Ask questions about your uploaded documents
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                message={message}
                sources={message.role === 'assistant' ? sources[index] : undefined}
              />
            ))}
            {loading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-200 rounded-lg px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
    </div>
  );
};

export default ChatInterface;
