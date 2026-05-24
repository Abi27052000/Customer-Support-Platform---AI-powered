const AI_BACKEND_BASE =
  import.meta.env.VITE_AI_BACKEND_URL?.replace(/\/$/, '') || 'http://localhost:8000';

const EMOTION_SENSE_BASE = `${AI_BACKEND_BASE}/api/emotion-sense`;

export interface EmotionEntry {
  label: string;
  confidence: number;
}

export interface SentimentEntry {
  label: string;
  confidence: number;
}

export interface EmotionSenseUtterance {
  emotions: EmotionEntry[];
  sentiments: SentimentEntry[];
  text?: string;
  start_time?: number;
  end_time?: number;
}

export interface EmotionSenseResponse {
  utterances: EmotionSenseUtterance[];
  total_segments?: number;
  failed_segments?: number;
  mode?: string;
}

export const emotionSenseApi = {
  async analyzeText(text: string): Promise<EmotionSenseResponse> {
    const res = await fetch(`${EMOTION_SENSE_BASE}/analyze/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      throw new Error(`EmotionSense text API failed: ${res.status} ${res.statusText}`);
    }

    return res.json();
  },

  async analyzeVideoClip(videoBlob: Blob): Promise<EmotionSenseResponse> {
    const formData = new FormData();
    formData.append('file', videoBlob, `voice-camera-${Date.now()}.webm`);
    formData.append('fast_mode', 'true');

    const res = await fetch(`${EMOTION_SENSE_BASE}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`EmotionSense video API failed: ${res.status} ${res.statusText}`);
    }

    return res.json();
  },
};
