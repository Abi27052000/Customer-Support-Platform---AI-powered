import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import EscalationView from './EscalationView';
import type { Message, Source } from '../../types/chat.types';
import { chatApi } from '../../services/chatApi';
import { conversationSummaryApi } from '../../services/conversationSummaryApi';
import { requestApi, type SupportRequest } from '../../services/requestApi';

const EMOTION_SENSE_TEXT_API = 'http://localhost:8000/api/emotion-sense/analyze/text';

// Labels from the multimodal model (EMOTION_MAP in emotion_sense_controller)
const NEGATIVE_EMOTIONS = new Set(['anger', 'disgust', 'fear', 'sadness']);
const HIGH_URGENCY_EMOTIONS = new Set(['anger', 'disgust', 'fear']);
const HIGH_URGENCY_THRESHOLD = 0.55;
const STREAK_LIMIT = 2;

interface EmotionEntry   { label: string; confidence: number }
interface SentimentEntry { label: string; confidence: number }
interface ESUtterance    { emotions: EmotionEntry[]; sentiments: SentimentEntry[] }
interface ESResponse     { utterances: ESUtterance[] }

async function detectNegative(text: string): Promise<{ isNegative: boolean; isUrgent: boolean; details?: any }> {
  try {
    console.log(`[EmotionSense] Analyzing text: "${text}"`);
    const res = await fetch(EMOTION_SENSE_TEXT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.warn(`[EmotionSense] API error: ${res.status} ${res.statusText}`);
      return { isNegative: false, isUrgent: false };
    }
    const data: ESResponse = await res.json();
    const utterance = data.utterances?.[0];
    if (!utterance) {
      console.warn('[EmotionSense] No utterance in response');
      return { isNegative: false, isUrgent: false };
    }

    const topEmotion   = utterance.emotions[0];
    const topSentiment = utterance.sentiments[0];

    console.log(`[EmotionSense] Top Emotion: ${topEmotion?.label} (${(topEmotion?.confidence * 100).toFixed(1)}%)`);
    console.log(`[EmotionSense] All Emotions:`, utterance.emotions.map(e => `${e.label}=${(e.confidence * 100).toFixed(1)}%`).join(', '));
    console.log(`[EmotionSense] Top Sentiment: ${topSentiment?.label} (${(topSentiment?.confidence * 100).toFixed(1)}%)`);

    const isNegative =
      NEGATIVE_EMOTIONS.has(topEmotion?.label) ||
      topSentiment?.label === 'negative';

    const isUrgent =
      HIGH_URGENCY_EMOTIONS.has(topEmotion?.label) &&
      (topEmotion?.confidence ?? 0) > HIGH_URGENCY_THRESHOLD;

    console.log(`[EmotionSense] isNegative=${isNegative}, isUrgent=${isUrgent}`);

    return { isNegative, isUrgent, details: { topEmotion, topSentiment } };
  } catch (err) {
    console.error('[EmotionSense] Detection failed:', err);
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
  const [ended, setEnded] = useState(false);
  const [savingSummary, setSavingSummary] = useState(false);
  const [summarySaved, setSummarySaved] = useState(false);
  const [escalationTicket, setEscalationTicket] = useState<SupportRequest | null>(null);
  const [creatingEscalationTicket, setCreatingEscalationTicket] = useState(false);
  const [escalationTicketError, setEscalationTicketError] = useState<string | null>(null);
  const negativeStreakRef = useRef(0);
  const escalationTicketStartedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildConversationText = (conversationMessages: Message[]) =>
    conversationMessages
      .map((message) => {
        const speaker = message.role === 'user' ? 'Customer' : 'AI Assistant';
        return `${speaker}: ${message.content}`;
      })
      .join('\n');

  const createEscalationTicket = async (conversationMessages: Message[]) => {
    if (escalationTicketStartedRef.current) return;
    escalationTicketStartedRef.current = true;
    setCreatingEscalationTicket(true);
    setEscalationTicketError(null);

    const conversationText = buildConversationText(conversationMessages).slice(-2000);

    try {
      const ticket = await requestApi.createRequest({
        orgId: organizationId,
        title: 'AI chat escalation',
        description: conversationText || 'Customer was escalated from AI chat due to negative sentiment.',
        conversationSummary: conversationText,
      });
      setEscalationTicket(ticket);
    } catch (err) {
      setEscalationTicketError(err instanceof Error ? err.message : 'Failed to create escalation ticket');
    } finally {
      setCreatingEscalationTicket(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (ended) return;

    setError(null);

    // Capture current message length so we can key sources correctly
    const currentLength = messages.length;

    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // 1. Get AI response immediately and show it
      const response = await chatApi.sendMessage({
        session_id: sessionId,
        organization_id: organizationId,
        query: content,
        top_k: 3,
        score_threshold: 0.4,
      });

      const aiMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
      };
      const aiMsgIndex = currentLength + 1;
      const conversationAfterResponse = [...messages, userMessage, aiMessage];
      setMessages((prev) => [...prev, aiMessage]);
      setSources((prev) => ({
        ...prev,
        [aiMsgIndex]: response.sources,
      }));
      setLoading(false);

      // 2. Fire-and-forget: emotion detection runs in the background
      //    Escalation can trigger after the AI response is already visible
      detectNegative(content).then((emotionResult) => {
        if (emotionResult.isNegative) {
          negativeStreakRef.current += 1;
          console.log(`[EmotionSense] Negative streak: ${negativeStreakRef.current}/${STREAK_LIMIT}`);
        } else {
          console.log(`[EmotionSense] Negative streak reset to 0`);
          negativeStreakRef.current = 0;
        }

        if (emotionResult.isUrgent) {
          console.log(`[EmotionSense] 🚨 URGENT escalation triggered! High-confidence negative emotion detected.`);
        } else if (negativeStreakRef.current >= STREAK_LIMIT) {
          console.log(`[EmotionSense] 🚨 STREAK escalation triggered! Negative emotions for ${STREAK_LIMIT} consecutive messages.`);
        }

        if (emotionResult.isUrgent || negativeStreakRef.current >= STREAK_LIMIT) {
          console.log('[EmotionSense] Setting escalated=true');
          setEscalated(true);
          void createEscalationTicket(conversationAfterResponse);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      console.error('Error sending message:', err);
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
        setEnded(false);
        setSummarySaved(false);
        setEscalationTicket(null);
        setEscalationTicketError(null);
        escalationTicketStartedRef.current = false;
      } catch (err) {
        setError('Failed to clear chat history');
        console.error('Error clearing chat:', err);
      }
    }
  };

  const handleEndChat = async () => {
    if (messages.length === 0 || savingSummary || summarySaved) return;

    setSavingSummary(true);
    setError(null);

    try {
      await conversationSummaryApi.saveSummary({
        channel: 'ai_chat',
        sessionId,
        orgId: organizationId,
        endedReason: 'ended',
        conversationText: buildConversationText(messages),
      });

      setEnded(true);
      setSummarySaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save conversation summary');
      console.error('Error saving chat summary:', err);
    } finally {
      setSavingSummary(false);
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
          <EscalationView
            onGoBack={handleReturnToChat}
            ticket={escalationTicket}
            creatingTicket={creatingEscalationTicket}
            ticketError={escalationTicketError}
          />
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
          <div className="flex gap-2">
            <button
              onClick={handleClearChat}
              disabled={savingSummary}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-lg transition-colors text-sm"
            >
              Clear Chat
            </button>
            <button
              onClick={handleEndChat}
              disabled={messages.length === 0 || loading || savingSummary || summarySaved}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 rounded-lg transition-colors text-sm"
            >
              {savingSummary ? 'Saving...' : summarySaved ? 'Summary Saved' : 'End Chat'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {summarySaved && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-4">
          <p className="font-bold">Conversation ended</p>
          <p>The AI summary was saved for staff review.</p>
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
      <ChatInput onSendMessage={handleSendMessage} disabled={loading || ended || savingSummary} />
    </div>
  );
};

export default ChatInterface;
