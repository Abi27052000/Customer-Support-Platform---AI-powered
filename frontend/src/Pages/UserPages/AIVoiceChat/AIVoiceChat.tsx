import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Camera, CameraOff, Mic, Radio, ShieldCheck, Sparkles, Video } from 'lucide-react';
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
      <div className="flex h-[calc(100vh-136px)] min-h-[640px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-white p-4">
          <h1 className="text-xl font-bold text-slate-900">Support Escalation</h1>
          <p className="text-sm text-slate-500">Your call has ended. A staff member will follow up.</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          <EscalationView onGoBack={handleReturnToCall} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-136px)] min-h-[640px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2D2A8C] text-white">
                <Mic size={21} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-950">AI Voice Agent</h1>
                <p className="text-sm text-slate-500">Speak with your organization support assistant.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                <ShieldCheck size={14} />
                Org selected
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                <Radio size={14} />
                {callStatus.isConnecting && 'Connecting'}
                {callStatus.isActive && 'Live'}
                {!callStatus.isActive && !callStatus.isConnecting && 'Ready'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 bg-slate-50 lg:grid-cols-[1fr_360px]">
          <main className="flex min-h-0 items-center justify-center p-6">
            <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="relative mx-auto h-36 w-36">
                {callStatus.isActive && (
                  <div className="absolute inset-0 animate-pulse rounded-full bg-[#2D2A8C]/20 blur-xl" />
                )}
                <div
                  className={`relative flex h-36 w-36 items-center justify-center rounded-full text-white shadow-xl transition-all duration-300 ${
                    callStatus.isActive
                      ? 'bg-[#2D2A8C] shadow-indigo-300'
                      : callStatus.isConnecting
                        ? 'bg-indigo-500 shadow-indigo-200'
                        : 'bg-slate-700 shadow-slate-200'
                  }`}
                >
                  {callStatus.isConnecting ? (
                    <span className="text-xl font-bold">...</span>
                  ) : (
                    <Bot size={54} />
                  )}
                </div>
              </div>

              <h2 className="mt-8 text-2xl font-bold text-slate-950">
                {callStatus.isConnecting && 'Connecting your voice call'}
                {callStatus.isActive && 'Listening now'}
                {!callStatus.isActive && !callStatus.isConnecting && !savingSummary && !summarySaved && 'Ready when you are'}
                {savingSummary && 'Saving conversation summary'}
                {summarySaved && 'Summary saved'}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {callStatus.isActive
                  ? 'Talk naturally. The assistant can search your organization knowledge base while you speak.'
                  : 'Start a call to speak with the AI assistant using your selected organization context.'}
              </p>

              <div className="mt-8">
                <VoiceControls
                  callStatus={callStatus}
                  isMuted={isMuted}
                  onStartCall={handleStartCall}
                  onEndCall={handleEndCall}
                  onToggleMute={handleToggleMute}
                />
              </div>

              {summarySaved && (
                <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  The AI voice conversation summary was saved for staff review.
                </div>
              )}
            </div>
          </main>

          <aside className="min-h-0 border-t border-slate-200 bg-white p-5 lg:border-l lg:border-t-0">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Video size={17} />
                    Video emotion detection
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {isVideoEnabled
                      ? 'Camera checks run in the background during active calls.'
                      : 'Optional camera checks can also trigger escalation.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleVideo}
                  disabled={isVideoStarting}
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm transition ${
                    isVideoEnabled
                      ? 'bg-[#2D2A8C] hover:bg-[#242170]'
                      : 'bg-slate-700 hover:bg-slate-800'
                  } ${isVideoStarting ? 'cursor-not-allowed opacity-60' : ''}`}
                  title={isVideoEnabled ? 'Turn off video emotion detection' : 'Turn on video emotion detection'}
                >
                  {isVideoEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
                </button>
              </div>

              {isVideoEnabled && (
                <div className="mt-4 overflow-hidden rounded-lg bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-44 w-full object-cover"
                  />
                </div>
              )}

              <div className="mt-3 min-h-5 text-xs text-slate-600">
                {isVideoStarting && 'Starting camera...'}
                {!isVideoStarting && isVideoEnabled && latestVideoEmotion && `Latest video signal: ${latestVideoEmotion}`}
                {!isVideoStarting && isVideoEnabled && !latestVideoEmotion && 'Waiting for the first video signal...'}
                {!isVideoStarting && videoError && <span className="text-red-600">{videoError}</span>}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Sparkles size={17} />
                How it works
              </p>
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                <p>Ask support questions by voice and the assistant can search uploaded organization documents.</p>
                <p>Final transcripts are saved as summaries when the call ends.</p>
                <p>Text and optional video emotion signals can escalate difficult conversations.</p>
              </div>
            </div>

            {callStatus.error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {callStatus.error}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};
