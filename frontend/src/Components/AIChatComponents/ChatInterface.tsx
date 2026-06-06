import React, { useState, useEffect, useRef } from 'react';
import { Bot, FileText, LifeBuoy, RotateCcw, ShieldCheck, XCircle } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import EscalationView from './EscalationView';
import type { Message, Source } from '../../types/chat.types';
import { chatApi } from '../../services/chatApi';
import { conversationSummaryApi, type ConversationEndedReason } from '../../services/conversationSummaryApi';
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
  const summarySaveStartedRef = useRef(false);
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

  const saveChatSummary = async (
    endedReason: ConversationEndedReason,
    conversationMessages: Message[] = messages
  ) => {
    if (conversationMessages.length === 0 || savingSummary || summarySaveStartedRef.current) return;

    summarySaveStartedRef.current = true;
    setSavingSummary(true);
    setError(null);

    try {
      await conversationSummaryApi.saveSummary({
        channel: 'ai_chat',
        sessionId,
        orgId: organizationId,
        endedReason,
        conversationText: buildConversationText(conversationMessages),
      });

      setSummarySaved(true);
      if (endedReason !== 'escalated') {
        setEnded(true);
      }
    } catch (err) {
      summarySaveStartedRef.current = false;
      setError(err instanceof Error ? err.message : 'Failed to save conversation summary');
      console.error('Error saving chat summary:', err);
    } finally {
      setSavingSummary(false);
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
          void saveChatSummary('escalated', conversationAfterResponse);
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
        if (messages.length > 0 && !summarySaved && !summarySaveStartedRef.current) {
          await saveChatSummary('cleared');
        }

        await chatApi.clearHistory(sessionId);
        setMessages([]);
        setSources({});
        setError(null);
        setEnded(false);
        setSummarySaved(false);
        setEscalationTicket(null);
        setEscalationTicketError(null);
        escalationTicketStartedRef.current = false;
        summarySaveStartedRef.current = false;
      } catch (err) {
        setError('Failed to clear chat history');
        console.error('Error clearing chat:', err);
      }
    }
  };

  const handleEndChat = async () => {
    await saveChatSummary('ended');
  };

  const handleReturnToChat = () => {
    negativeStreakRef.current = 0;
    setEscalated(false);
  };

  if (escalated) {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {/* Keep the header so the user knows which session they're in */}
        <div className="border-b border-slate-200 bg-white p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Support Escalation</h1>
              <p className="text-sm text-slate-500">A staff ticket is being prepared for this chat.</p>
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
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2D2A8C] text-white">
                <Bot size={21} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-950">AI Chat Agent</h1>
                <p className="text-sm text-slate-500">
                  Ask questions from your organization knowledge base.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <ShieldCheck size={14} />
              Org selected
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-mono text-slate-500">
              {sessionId.replace('session_', '#')}
            </span>
            <button
              onClick={handleClearChat}
              disabled={savingSummary}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RotateCcw size={14} />
              Clear
            </button>
            <button
              onClick={handleEndChat}
              disabled={messages.length === 0 || loading || savingSummary || summarySaved}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2D2A8C] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#242170] disabled:bg-slate-300"
            >
              <XCircle size={14} />
              {savingSummary ? 'Saving...' : summarySaved ? 'Saved' : 'End Chat'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="border-l-4 border-red-500 bg-red-50 p-4 text-red-700">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {summarySaved && (
        <div className="border-l-4 border-emerald-500 bg-emerald-50 p-4 text-emerald-800">
          <p className="font-bold">Conversation ended</p>
          <p>The AI summary was saved for staff review.</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="w-full max-w-2xl text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-indigo-50 text-[#2D2A8C]">
                <Bot size={28} />
              </div>
              <h3 className="mt-5 text-2xl font-bold text-slate-900">How can I help today?</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Ask about policies, services, refunds, billing, or anything covered by your organization documents.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  { icon: FileText, text: 'Explain a policy' },
                  { icon: LifeBuoy, text: 'Get support guidance' },
                  { icon: ShieldCheck, text: 'Use org knowledge' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-600 shadow-sm">
                    <Icon size={18} className="mx-auto mb-2 text-[#2D2A8C]" />
                    {text}
                  </div>
                ))}
              </div>
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
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-[#2D2A8C] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#2D2A8C] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-[#2D2A8C] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
