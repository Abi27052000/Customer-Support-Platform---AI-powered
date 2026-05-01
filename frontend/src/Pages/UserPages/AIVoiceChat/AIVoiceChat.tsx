import React, { useState, useEffect, useRef } from 'react';
import { vapiService } from '../../../services/vapiService';
import { type CallStatus } from '../../../types/vapi.types';
import VoiceControls from '../../../Components/AIVoiceComponents/VoiceControls';
import EscalationView from '../../../Components/AIChatComponents/EscalationView';

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

async function detectNegative(text: string): Promise<{ isNegative: boolean; isUrgent: boolean }> {
  try {
    const res = await fetch(EMOTION_SENSE_TEXT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return { isNegative: false, isUrgent: false };
    const data: ESResponse = await res.json();
    const utterance = data.utterances?.[0];
    if (!utterance) return { isNegative: false, isUrgent: false };

    const topEmotion   = utterance.emotions[0];
    const topSentiment = utterance.sentiments[0];

    const isNegative =
      NEGATIVE_EMOTIONS.has(topEmotion?.label) ||
      topSentiment?.label === 'negative';

    const isUrgent =
      HIGH_URGENCY_EMOTIONS.has(topEmotion?.label) &&
      (topEmotion?.confidence ?? 0) > HIGH_URGENCY_THRESHOLD;

    return { isNegative, isUrgent };
  } catch {
    return { isNegative: false, isUrgent: false };
  }
}

export const AIVoiceChat: React.FC = () => {
  const [callStatus, setCallStatus] = useState<CallStatus>({
    isActive: false,
    isConnecting: false,
  });
  const [isMuted, setIsMuted] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const negativeStreakRef = useRef(0);

  useEffect(() => {
    const vapi = vapiService.getVapi();

    vapi.on('call-start', () => {
      negativeStreakRef.current = 0;
      setEscalated(false);
      setCallStatus({ isActive: true, isConnecting: false });
    });

    vapi.on('call-end', () => {
      setCallStatus({ isActive: false, isConnecting: false });
    });

    vapi.on('message', async (message: any) => {
      if (
        message?.type === 'transcript' &&
        message?.role === 'user' &&
        message?.transcriptType === 'final' &&
        typeof message?.transcript === 'string' &&
        message.transcript.trim().length > 0
      ) {
        const result = await detectNegative(message.transcript.trim());

        if (result.isNegative) {
          negativeStreakRef.current += 1;
        } else {
          negativeStreakRef.current = 0;
        }

        if (result.isUrgent || negativeStreakRef.current >= STREAK_LIMIT) {
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
  }, []);

  const handleStartCall = async () => {
    try {
      negativeStreakRef.current = 0;
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
            {!callStatus.isActive && !callStatus.isConnecting && 'Ready to talk'}
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
