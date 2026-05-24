import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import { vapiService } from '../../../services/vapiService';
import { type CallStatus } from '../../../types/vapi.types';
import VoiceControls from '../../../Components/AIVoiceComponents/VoiceControls';
import EscalationView from '../../../Components/AIChatComponents/EscalationView';
import { conversationSummaryApi, type ConversationEndedReason } from '../../../services/conversationSummaryApi';
import { useAuth } from '../../../Context/AuthContext';
import { emotionSenseApi, type EmotionSenseResponse } from '../../../services/emotionSenseApi';

const NEGATIVE_EMOTIONS = new Set(['anger', 'angry', 'disgust', 'fear', 'sadness']);
const HIGH_URGENCY_EMOTIONS = new Set(['anger', 'angry', 'disgust', 'fear']);
const HIGH_URGENCY_THRESHOLD = 0.55;
const STREAK_LIMIT = 2;
const VIDEO_CLIP_MS = 4000;
const VIDEO_ANALYSIS_INTERVAL_MS = 14000;

interface VoiceTranscriptLine {
  role: 'user' | 'assistant';
  content: string;
}

type EmotionSignalSource = 'Text' | 'Video';

function getEmotionSignal(data: EmotionSenseResponse, source: EmotionSignalSource) {
  const utterance = data.utterances?.[0];
  if (!utterance) {
    console.warn(`[EmotionSense ${source}] No utterance in response`);
    return { isNegative: false, isUrgent: false };
  }

  const topEmotion = utterance.emotions[0];
  const topSentiment = utterance.sentiments[0];
  const emotionLabel = topEmotion?.label?.toLowerCase();
  const sentimentLabel = topSentiment?.label?.toLowerCase();

  console.log(`[EmotionSense ${source}] Top Emotion: ${topEmotion?.label} (${((topEmotion?.confidence ?? 0) * 100).toFixed(1)}%)`);
  console.log(`[EmotionSense ${source}] All Emotions:`, utterance.emotions.map((e) => `${e.label}=${(e.confidence * 100).toFixed(1)}%`).join(', '));
  console.log(`[EmotionSense ${source}] Top Sentiment: ${topSentiment?.label} (${((topSentiment?.confidence ?? 0) * 100).toFixed(1)}%)`);

  const isNegative =
    (emotionLabel ? NEGATIVE_EMOTIONS.has(emotionLabel) : false) ||
    sentimentLabel === 'negative';

  const isUrgent =
    (emotionLabel ? HIGH_URGENCY_EMOTIONS.has(emotionLabel) : false) &&
    (topEmotion?.confidence ?? 0) > HIGH_URGENCY_THRESHOLD;

  console.log(`[EmotionSense ${source}] isNegative=${isNegative}, isUrgent=${isUrgent}`);

  return { isNegative, isUrgent, details: { topEmotion, topSentiment } };
}

async function detectNegative(text: string) {
  try {
    console.log(`[EmotionSense Text] Analyzing text: "${text}"`);
    const data = await emotionSenseApi.analyzeText(text);
    return getEmotionSignal(data, 'Text');
  } catch (err) {
    console.error('[EmotionSense Text] Detection failed:', err);
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
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isVideoStarting, setIsVideoStarting] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [latestVideoEmotion, setLatestVideoEmotion] = useState<string | null>(null);

  const sessionIdRef = useRef(`voice_${Date.now()}`);
  const negativeStreakRef = useRef(0);
  const transcriptsRef = useRef<VoiceTranscriptLine[]>([]);
  const endedReasonRef = useRef<ConversationEndedReason>('ended');
  const saveRequestedRef = useRef(false);
  const escalatedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoAnalysisTimerRef = useRef<number | null>(null);
  const videoAnalysisInFlightRef = useRef(false);

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

  const stopVideoCapture = useCallback(() => {
    if (videoAnalysisTimerRef.current !== null) {
      window.clearInterval(videoAnalysisTimerRef.current);
      videoAnalysisTimerRef.current = null;
    }

    if (videoRecorderRef.current?.state === 'recording') {
      videoRecorderRef.current.stop();
    }
    videoRecorderRef.current = null;
    videoAnalysisInFlightRef.current = false;

    videoStreamRef.current?.getTracks().forEach((track) => track.stop());
    videoStreamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsVideoEnabled(false);
    setLatestVideoEmotion(null);
  }, []);

  const triggerEscalation = useCallback(
    (source: EmotionSignalSource, reason: string) => {
      if (escalatedRef.current) return;

      console.log(`[EmotionSense ${source}] Escalating voice call: ${reason}`);
      escalatedRef.current = true;
      endedReasonRef.current = 'escalated';
      stopVideoCapture();
      vapiService.stopCall();
      setEscalated(true);
    },
    [stopVideoCapture]
  );

  const applyEmotionSignal = useCallback(
    (source: EmotionSignalSource, result: { isNegative: boolean; isUrgent: boolean }) => {
      if (escalatedRef.current) return;

      if (result.isNegative) {
        negativeStreakRef.current += 1;
        console.log(`[EmotionSense ${source}] Negative streak: ${negativeStreakRef.current}/${STREAK_LIMIT}`);
      } else if (source === 'Text') {
        console.log('[EmotionSense Text] Negative streak reset to 0');
        negativeStreakRef.current = 0;
      }

      if (result.isUrgent) {
        triggerEscalation(source, 'high-confidence negative emotion detected');
      } else if (negativeStreakRef.current >= STREAK_LIMIT) {
        triggerEscalation(source, `negative emotions for ${STREAK_LIMIT} consecutive signals`);
      }
    },
    [triggerEscalation]
  );

  const startVideoCapture = useCallback(async () => {
    if (videoStreamRef.current) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setVideoError('Camera is not supported in this browser.');
      return;
    }

    try {
      setIsVideoStarting(true);
      setVideoError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: 8, max: 10 },
        },
        audio: false,
      });

      videoStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsVideoEnabled(true);
      console.log('[VideoEmotion] Camera enabled for background emotion checks');
    } catch (error) {
      console.error('[VideoEmotion] Camera permission/start failed:', error);
      setVideoError(error instanceof Error ? error.message : 'Unable to start camera.');
      setIsVideoEnabled(false);
      stopVideoCapture();
    } finally {
      setIsVideoStarting(false);
    }
  }, [stopVideoCapture]);

  const captureVideoClip = useCallback(
    () =>
      new Promise<Blob | null>((resolve) => {
        const stream = videoStreamRef.current;
        if (!stream || typeof MediaRecorder === 'undefined') {
          resolve(null);
          return;
        }

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : '';

        const chunks: BlobPart[] = [];
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        videoRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };
        recorder.onerror = () => resolve(null);
        recorder.onstop = () => {
          const type = mimeType || 'video/webm';
          resolve(chunks.length ? new Blob(chunks, { type }) : null);
        };

        recorder.start();
        window.setTimeout(() => {
          if (recorder.state === 'recording') recorder.stop();
        }, VIDEO_CLIP_MS);
      }),
    []
  );

  const analyzeVideoClip = useCallback(async () => {
    if (!callStatus.isActive || !isVideoEnabled || escalatedRef.current) return;
    if (videoAnalysisInFlightRef.current) {
      console.log('[VideoEmotion] Skipping clip because previous analysis is still running');
      return;
    }

    try {
      videoAnalysisInFlightRef.current = true;
      setVideoError(null);
      console.log('[VideoEmotion] Capturing short camera clip for background analysis');
      const clip = await captureVideoClip();
      if (!clip || clip.size === 0) {
        console.warn('[VideoEmotion] Empty camera clip; skipping analysis');
        return;
      }
      if (escalatedRef.current) return;

      console.log(`[VideoEmotion] Sending clip to backend (${Math.round(clip.size / 1024)} KB)`);
      const data = await emotionSenseApi.analyzeVideoClip(clip);
      const result = getEmotionSignal(data, 'Video');
      const topEmotion = result.details?.topEmotion;
      if (topEmotion) {
        setLatestVideoEmotion(`${topEmotion.label} (${Math.round(topEmotion.confidence * 100)}%)`);
      }
      applyEmotionSignal('Video', result);
    } catch (error) {
      console.error('[VideoEmotion] Background video analysis failed:', error);
      setVideoError(error instanceof Error ? error.message : 'Video emotion analysis failed.');
    } finally {
      videoAnalysisInFlightRef.current = false;
    }
  }, [applyEmotionSignal, callStatus.isActive, captureVideoClip, isVideoEnabled]);

  const handleToggleVideo = async () => {
    if (isVideoEnabled || videoStreamRef.current) {
      console.log('[VideoEmotion] Camera disabled');
      stopVideoCapture();
      return;
    }

    await startVideoCapture();
  };

  useEffect(() => {
    if (!callStatus.isActive || !isVideoEnabled || !videoStreamRef.current) {
      if (videoAnalysisTimerRef.current !== null) {
        window.clearInterval(videoAnalysisTimerRef.current);
        videoAnalysisTimerRef.current = null;
      }
      return;
    }

    analyzeVideoClip();
    videoAnalysisTimerRef.current = window.setInterval(analyzeVideoClip, VIDEO_ANALYSIS_INTERVAL_MS);

    return () => {
      if (videoAnalysisTimerRef.current !== null) {
        window.clearInterval(videoAnalysisTimerRef.current);
        videoAnalysisTimerRef.current = null;
      }
    };
  }, [analyzeVideoClip, callStatus.isActive, isVideoEnabled]);

  useEffect(() => {
    return () => stopVideoCapture();
  }, [stopVideoCapture]);

  useEffect(() => {
    if (videoRef.current && videoStreamRef.current) {
      videoRef.current.srcObject = videoStreamRef.current;
    }
  }, [isVideoEnabled]);

  useEffect(() => {
    const vapi = vapiService.getVapi();

    vapi.on('call-start', () => {
      sessionIdRef.current = `voice_${Date.now()}`;
      transcriptsRef.current = [];
      endedReasonRef.current = 'ended';
      saveRequestedRef.current = false;
      negativeStreakRef.current = 0;
      escalatedRef.current = false;
      setEscalated(false);
      setSummarySaved(false);
      setCallStatus({ isActive: true, isConnecting: false });
    });

    vapi.on('call-end', async () => {
      setCallStatus({ isActive: false, isConnecting: false });
      stopVideoCapture();
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
        applyEmotionSignal('Text', result);
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
  }, [applyEmotionSignal, saveVoiceSummary, stopVideoCapture]);

  const handleStartCall = async () => {
    try {
      if (!user?.orgId) {
        setCallStatus({
          isActive: false,
          isConnecting: false,
          error: 'Unable to start call because no organization is selected.',
        });
        return;
      }

      sessionIdRef.current = `voice_${Date.now()}`;
      transcriptsRef.current = [];
      endedReasonRef.current = 'ended';
      saveRequestedRef.current = false;
      negativeStreakRef.current = 0;
      escalatedRef.current = false;
      setSummarySaved(false);
      setCallStatus({ isActive: false, isConnecting: true, error: undefined });
      await vapiService.startCall(user.orgId);
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
    stopVideoCapture();
    vapiService.stopCall();
  };

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    vapiService.setMuted(newMutedState);
    setIsMuted(newMutedState);
  };

  const handleReturnToCall = () => {
    negativeStreakRef.current = 0;
    escalatedRef.current = false;
    setEscalated(false);
  };

  if (escalated) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-indigo-700 text-white p-4 shadow-md">
          <h1 className="text-xl font-bold">Support Escalation</h1>
          <p className="text-sm opacity-80">Your call has been ended - a staff member will follow up</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <EscalationView onGoBack={handleReturnToCall} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-linear-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center">
      <div className="flex w-full max-w-xl flex-col items-center space-y-8 px-4">
        <div className="relative">
          {callStatus.isActive && (
            <div className="absolute inset-0 bg-blue-400 rounded-full blur-xl opacity-75 animate-pulse"></div>
          )}
          <div
            className={`
              relative w-32 h-32 rounded-full flex items-center justify-center text-white text-5xl
              transition-all duration-300 shadow-2xl
              ${
                callStatus.isActive
                  ? 'bg-blue-600 shadow-blue-500/50 animate-pulse'
                  : 'bg-gray-600 shadow-gray-500/50'
              }
            `}
          >
            {callStatus.isConnecting ? '...' : 'AI'}
          </div>
        </div>

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

        <div className="w-full rounded-lg border border-white/70 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Video emotion detection</p>
              <p className="text-xs text-gray-500">
                {isVideoEnabled
                  ? 'Camera checks run in the background during active calls.'
                  : 'Optional camera checks can also trigger escalation.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleVideo}
              disabled={isVideoStarting}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition ${
                isVideoEnabled
                  ? 'bg-indigo-700 hover:bg-indigo-800'
                  : 'bg-gray-700 hover:bg-gray-800'
              } ${isVideoStarting ? 'cursor-not-allowed opacity-60' : ''}`}
              title={isVideoEnabled ? 'Turn off video emotion detection' : 'Turn on video emotion detection'}
            >
              {isVideoEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
            </button>
          </div>

          {isVideoEnabled && (
            <div className="mt-3 overflow-hidden rounded-md bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-40 w-full object-cover"
              />
            </div>
          )}

          <div className="mt-3 min-h-5 text-xs text-gray-600">
            {isVideoStarting && 'Starting camera...'}
            {!isVideoStarting && isVideoEnabled && latestVideoEmotion && `Latest video signal: ${latestVideoEmotion}`}
            {!isVideoStarting && isVideoEnabled && !latestVideoEmotion && 'Waiting for the first video signal...'}
            {!isVideoStarting && videoError && <span className="text-red-600">{videoError}</span>}
          </div>
        </div>

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
