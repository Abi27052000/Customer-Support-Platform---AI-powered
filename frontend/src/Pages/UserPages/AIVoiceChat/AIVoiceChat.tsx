import React, { useCallback, useState, useEffect, useRef } from 'react';
import { vapiService } from '../../../services/vapiService';
import { type CallStatus } from '../../../types/vapi.types';
import VoiceControls from '../../../Components/AIVoiceComponents/VoiceControls';
import EscalationView from '../../../Components/AIChatComponents/EscalationView';
import { conversationSummaryApi, type ConversationEndedReason } from '../../../services/conversationSummaryApi';
import { useAuth } from '../../../Context/AuthContext';

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
interface VoiceTranscriptLine {
  role: 'user' | 'assistant';
  content: string;
}

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

export const AIVoiceChat: React.FC = () => {
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState<CallStatus>({
    isActive: false,
    isConnecting: false,
  });
  const [isMuted, setIsMuted] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [savingSummary, setSavingSummary] = useState(false);
  const [summarySaved, setSummarySaved] = useState(false);
  const sessionIdRef = useRef(`voice_${Date.now()}`);
  const negativeStreakRef = useRef(0);
  const transcriptsRef = useRef<VoiceTranscriptLine[]>([]);
  const endedReasonRef = useRef<ConversationEndedReason>('ended');
  const saveRequestedRef = useRef(false);

  const buildConversationText = (transcripts: VoiceTranscriptLine[]) =>
    transcripts
      .map((line) => {
        const speaker = line.role === 'user' ? 'Customer' : 'AI Assistant';
        return `${speaker}: ${line.content}`;
      })
      .join('\n');

  const saveVoiceSummary = useCallback(
    async (endedReason: ConversationEndedReason) => {
      if (saveRequestedRef.current || transcriptsRef.current.length === 0) return;
      if (!user?.orgId) {
        setCallStatus({
          isActive: false,
          isConnecting: false,
          error: 'Unable to save summary because no organization is selected.',
        });
        return;
      }

      saveRequestedRef.current = true;
      setSavingSummary(true);

      try {
        await conversationSummaryApi.saveSummary({
          channel: 'ai_voice',
          sessionId: sessionIdRef.current,
          orgId: user.orgId,
          endedReason,
          conversationText: buildConversationText(transcriptsRef.current),
        });
        setSummarySaved(true);
      } catch (error) {
        console.error('Failed to save voice summary:', error);
        setCallStatus({
          isActive: false,
          isConnecting: false,
          error: error instanceof Error ? error.message : 'Failed to save voice summary.',
        });
      } finally {
        setSavingSummary(false);
      }
    },
    [user?.orgId]
  );

  useEffect(() => {
    const vapi = vapiService.getVapi();

    vapi.on('call-start', () => {
      sessionIdRef.current = `voice_${Date.now()}`;
      transcriptsRef.current = [];
      endedReasonRef.current = 'ended';
      saveRequestedRef.current = false;
      negativeStreakRef.current = 0;
      setEscalated(false);
      setSummarySaved(false);
      setCallStatus({ isActive: true, isConnecting: false });
    });

    vapi.on('call-end', async () => {
      setCallStatus({ isActive: false, isConnecting: false });
      await saveVoiceSummary(endedReasonRef.current);
    });

    vapi.on('message', async (message: any) => {
      if (
        message?.type === 'transcript' &&
        (message?.role === 'user' || message?.role === 'assistant') &&
        message?.transcriptType === 'final' &&
        typeof message?.transcript === 'string' &&
        message.transcript.trim().length > 0
      ) {
        const transcript = message.transcript.trim();
        transcriptsRef.current.push({
          role: message.role,
          content: transcript,
        });

        if (message.role !== 'user') return;

        console.log(`[Voice] User transcript: "${transcript}"`);
        const result = await detectNegative(transcript);

        if (result.isNegative) {
          negativeStreakRef.current += 1;
          console.log(`[EmotionSense] Negative streak: ${negativeStreakRef.current}/${STREAK_LIMIT}`);
        } else {
          console.log(`[EmotionSense] Negative streak reset to 0`);
          negativeStreakRef.current = 0;
        }

        if (result.isUrgent) {
          console.log(`[EmotionSense] 🚨 URGENT escalation triggered! High-confidence negative emotion detected.`);
        } else if (negativeStreakRef.current >= STREAK_LIMIT) {
          console.log(`[EmotionSense] 🚨 STREAK escalation triggered! Negative emotions for ${STREAK_LIMIT} consecutive messages.`);
        }

        if (result.isUrgent || negativeStreakRef.current >= STREAK_LIMIT) {
          console.log('[EmotionSense] Ending Vapi call and showing escalation screen...');
          endedReasonRef.current = 'escalated';
          vapiService.stopCall();
          setEscalated(true);
        }
      }
    });

    vapi.on('error', (error: Error) => {
      console.error('Vapi error:', error);
      setCallStatus({
        isActive: false,
        isConnecting: false,
        error: error.message || 'An error occurred',
      });
    });

    return () => {
      vapi.removeAllListeners();
    };
  }, [saveVoiceSummary]);

  const handleStartCall = async () => {
    try {
      sessionIdRef.current = `voice_${Date.now()}`;
      transcriptsRef.current = [];
      endedReasonRef.current = 'ended';
      saveRequestedRef.current = false;
      negativeStreakRef.current = 0;
      setSummarySaved(false);
      setCallStatus({ isActive: false, isConnecting: true, error: undefined });
      await vapiService.startCall();
    } catch (error) {
      console.error('Failed to start call:', error);
      setCallStatus({
        isActive: false,
        isConnecting: false,
        error: 'Failed to start call. Please try again.',
      });
    }
  };

  const handleEndCall = () => {
    endedReasonRef.current = 'ended';
    vapiService.stopCall();
  };

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    vapiService.setMuted(newMutedState);
    setIsMuted(newMutedState);
  };

  const handleReturnToCall = () => {
    negativeStreakRef.current = 0;
    setEscalated(false);
  };

  if (escalated) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-indigo-700 text-white p-4 shadow-md">
          <h1 className="text-xl font-bold">Support Escalation</h1>
          <p className="text-sm opacity-80">Your call has been ended — a staff member will follow up</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <EscalationView onGoBack={handleReturnToCall} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-linear-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-8">
        {/* Chatbot Icon with glow effect when active */}
        <div className="relative">
          {callStatus.isActive && (
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-75 animate-pulse"></div>
          )}
          <div
            className={`
              relative w-32 h-32 rounded-full flex items-center justify-center text-white text-6xl
              transition-all duration-300 shadow-2xl
              ${
                callStatus.isActive
                  ? 'bg-blue-600 shadow-blue-500/50 animate-pulse'
                  : 'bg-gray-600 shadow-gray-500/50'
              }
            `}
          >
            {callStatus.isConnecting ? '⏳' : '🤖'}
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">AI Voice Assistant</h1>
          <p className="text-gray-600">
            {callStatus.isConnecting && 'Connecting...'}
            {callStatus.isActive && 'Listening...'}
            {!callStatus.isActive && !callStatus.isConnecting && !savingSummary && !summarySaved && 'Ready to talk'}
            {savingSummary && 'Saving summary...'}
            {summarySaved && 'Summary saved for staff review'}
            {callStatus.error && `Error: ${callStatus.error}`}
          </p>
        </div>

        {/* Voice Controls */}
        <div className="mt-8">
          <VoiceControls
            callStatus={callStatus}
            isMuted={isMuted}
            onStartCall={handleStartCall}
            onEndCall={handleEndCall}
            onToggleMute={handleToggleMute}
          />
        </div>
      </div>
    </div>
  );
};
