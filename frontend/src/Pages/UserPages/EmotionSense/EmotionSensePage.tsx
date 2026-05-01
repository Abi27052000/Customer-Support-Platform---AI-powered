import React, { useState, useRef, useCallback } from 'react';
import './EmotionSense.css';

const API_BASE = 'http://localhost:8000/api/emotion-sense';

const EMOTION_COLORS: Record<string, string> = {
  anger:    '#ef4444',
  disgust:  '#84cc16',
  fear:     '#a855f7',
  joy:      '#f59e0b',
  neutral:  '#6b7280',
  sadness:  '#3b82f6',
  surprise: '#f97316',
};

const SENTIMENT_COLORS: Record<string, string> = {
  positive: '#22c55e',
  neutral:  '#6b7280',
  negative: '#ef4444',
};

interface EmotionEntry   { label: string; confidence: number }
interface SentimentEntry { label: string; confidence: number }

interface Utterance {
  start_time: number;
  end_time:   number;
  text:       string;
  emotions:   EmotionEntry[];
  sentiments: SentimentEntry[];
}

interface AnalysisResult {
  utterances:      Utterance[];
  total_segments:  number;
  failed_segments: number;
  mode?:           string;
}

const TABS = [
  {
    id: 'video', label: 'Video',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="4" />
        <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'audio', label: 'Audio',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
  },
  {
    id: 'text', label: 'Text',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 6h16M4 10h16M4 14h10" />
      </svg>
    ),
  },
];

function formatTime(seconds: number): string | null {
  if (seconds === 0) return null;
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toFixed(1).padStart(4, '0');
  return `${m}:${s}`;
}

function EmotionBar({ label, confidence }: EmotionEntry) {
  return (
    <div className="es-emotion-row">
      <span className="es-emotion-label" style={{ color: EMOTION_COLORS[label] ?? '#aaa' }}>
        {label}
      </span>
      <div className="es-emotion-track">
        <div
          className="es-emotion-fill"
          style={{ width: `${(confidence * 100).toFixed(1)}%`, background: EMOTION_COLORS[label] ?? '#aaa' }}
        />
      </div>
      <span className="es-emotion-pct">{(confidence * 100).toFixed(1)}%</span>
    </div>
  );
}

function SentimentPill({ label, confidence }: SentimentEntry) {
  const color = SENTIMENT_COLORS[label] ?? '#aaa';
  return (
    <span
      className="es-sentiment-pill"
      style={{
        background:   color + '22',
        color,
        borderColor:  color + '66',
      }}
    >
      {label} · {(confidence * 100).toFixed(0)}%
    </span>
  );
}

function ModeBadge({ mode }: { mode?: string }) {
  if (!mode || mode === 'video') return null;
  const labels: Record<string, string> = {
    audio: 'Audio-only (no video frames)',
    text:  'Text-only (no video or audio)',
  };
  return <span className="es-mode-badge">{labels[mode] ?? mode}</span>;
}

function UtteranceCard({ utterance, index }: { utterance: Utterance; index: number }) {
  const showTime =
    utterance.start_time !== undefined &&
    utterance.end_time   !== undefined &&
    !(utterance.start_time === 0 && utterance.end_time === 0);

  return (
    <div className="es-utterance-card">
      <div className="es-utterance-header">
        <span className="es-utterance-index">#{index + 1}</span>
        {showTime && (
          <span className="es-utterance-time">
            {formatTime(utterance.start_time)} → {formatTime(utterance.end_time)}
          </span>
        )}
        <div className="es-utterance-sentiments">
          <SentimentPill
            label={utterance.sentiments[0].label}
            confidence={utterance.sentiments[0].confidence}
          />
        </div>
      </div>
      <p className="es-utterance-text">"{utterance.text}"</p>
      <div className="es-utterance-emotions">
        {utterance.emotions.map((e) => (
          <EmotionBar key={e.label} label={e.label} confidence={e.confidence} />
        ))}
      </div>
    </div>
  );
}

function SummaryStats({ utterances }: { utterances: Utterance[] }) {
  const emotionCounts:   Record<string, number> = {};
  const sentimentCounts: Record<string, number> = {};

  utterances.forEach((u) => {
    const topE = u.emotions[0].label;
    emotionCounts[topE] = (emotionCounts[topE] || 0) + 1;
    const topS = u.sentiments[0].label;
    sentimentCounts[topS] = (sentimentCounts[topS] || 0) + 1;
  });

  const [domEmotion]   = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
  const [domSentiment] = Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="es-summary-stats">
      <div className="es-stat-card">
        <span className="es-stat-value">{utterances.length}</span>
        <span className="es-stat-label">Utterances</span>
      </div>
      <div className="es-stat-card">
        <span className="es-stat-value" style={{ color: EMOTION_COLORS[domEmotion[0]] }}>
          {domEmotion[0]}
        </span>
        <span className="es-stat-label">Dominant Emotion</span>
      </div>
      <div className="es-stat-card">
        <span className="es-stat-value" style={{ color: SENTIMENT_COLORS[domSentiment[0]] }}>
          {domSentiment[0]}
        </span>
        <span className="es-stat-label">Overall Sentiment</span>
      </div>
    </div>
  );
}

function StatusBanner({ sub }: { sub: string }) {
  return (
    <div className="es-status-banner">
      <div className="es-status-spinner" />
      <div>
        <p className="es-status-title">Analyzing…</p>
        <p className="es-status-sub">{sub}</p>
      </div>
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="es-error-banner">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="13" />
        <circle cx="12" cy="16.5" r="0.8" fill="currentColor" />
      </svg>
      <span>{msg}</span>
    </div>
  );
}

// ── Video tab ─────────────────────────────────────────────────────────────────
function VideoTab({ onResult }: { onResult: (r: AnalysisResult | null) => void }) {
  const [file, setFile]     = useState<File | null>(null);
  const [videoUrl, setUrl]  = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [error, setError]   = useState<string | null>(null);
  const [dragging, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setUrl(URL.createObjectURL(f));
    setError(null);
    setStatus('idle');
    onResult(null);
  }, [onResult]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('video/')) handleFile(f);
  }, [handleFile]);

  const analyze = async () => {
    if (!file) return;
    setStatus('analyzing');
    setError(null);
    onResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE}/analyze`, { method: 'POST', body: fd });
      if (!res.ok) {
        const e = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(e.detail || res.statusText);
      }
      onResult(await res.json());
      setStatus('done');
    } catch (e) {
      setError((e as Error).message);
      setStatus('error');
    }
  };

  if (!file) return (
    <div
      className={`es-drop-zone${dragging ? ' es-drop-zone--active' : ''}`}
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <svg className="es-drop-icon" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
      </svg>
      <p className="es-drop-title">Drop a video file here</p>
      <p className="es-drop-sub">or <span className="es-drop-link">click to browse</span></p>
      <p className="es-drop-formats">MP4 · MOV · AVI · MKV</p>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );

  return (
    <>
      <div className="es-preview-section">
        <div className="es-video-wrapper">
          <video src={videoUrl ?? undefined} controls className="es-video-player" />
        </div>
        <div className="es-preview-meta">
          <div className="es-file-info">
            <span className="es-file-name">{file.name}</span>
            <span className="es-file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
          </div>
          <div className="es-preview-actions">
            <button
              className="es-btn es-btn--secondary"
              onClick={() => { setFile(null); setUrl(null); setStatus('idle'); onResult(null); }}
            >
              Change
            </button>
            <button className="es-btn es-btn--primary" onClick={analyze} disabled={status === 'analyzing'}>
              {status === 'analyzing'
                ? <><span className="es-btn-spinner" /> Analyzing…</>
                : 'Analyze Emotions'}
            </button>
          </div>
        </div>
      </div>
      {status === 'analyzing' && <StatusBanner sub="Transcribing · Extracting frames · Running model" />}
      {status === 'error'     && <ErrorBanner msg={error!} />}
    </>
  );
}

// ── Audio tab ─────────────────────────────────────────────────────────────────
function AudioTab({ onResult }: { onResult: (r: AnalysisResult | null) => void }) {
  const [file, setFile]     = useState<File | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [error, setError]   = useState<string | null>(null);
  const [dragging, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setError(null);
    setStatus('idle');
    onResult(null);
  }, [onResult]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('audio/')) handleFile(f);
  }, [handleFile]);

  const analyze = async () => {
    if (!file) return;
    setStatus('analyzing');
    setError(null);
    onResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE}/analyze/audio`, { method: 'POST', body: fd });
      if (!res.ok) {
        const e = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(e.detail || res.statusText);
      }
      onResult(await res.json());
      setStatus('done');
    } catch (e) {
      setError((e as Error).message);
      setStatus('error');
    }
  };

  if (!file) return (
    <div
      className={`es-drop-zone${dragging ? ' es-drop-zone--active' : ''}`}
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <svg className="es-drop-icon" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
      <p className="es-drop-title">Drop an audio file here</p>
      <p className="es-drop-sub">or <span className="es-drop-link">click to browse</span></p>
      <p className="es-drop-formats">MP3 · WAV · M4A · OGG · FLAC</p>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );

  return (
    <>
      <div className="es-audio-preview">
        <div className="es-audio-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <div className="es-audio-info">
          <span className="es-file-name">{file.name}</span>
          <span className="es-file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
        <div className="es-preview-actions">
          <button
            className="es-btn es-btn--secondary"
            onClick={() => { setFile(null); setStatus('idle'); onResult(null); }}
          >
            Change
          </button>
          <button className="es-btn es-btn--primary" onClick={analyze} disabled={status === 'analyzing'}>
            {status === 'analyzing'
              ? <><span className="es-btn-spinner" /> Analyzing…</>
              : 'Analyze Emotions'}
          </button>
        </div>
      </div>
      {status === 'analyzing' && <StatusBanner sub="Transcribing audio · Extracting mel features · Running model" />}
      {status === 'error'     && <ErrorBanner msg={error!} />}
    </>
  );
}

// ── Text tab ──────────────────────────────────────────────────────────────────
function TextTab({ onResult }: { onResult: (r: AnalysisResult | null) => void }) {
  const [text, setText]     = useState('');
  const [status, setStatus] = useState<string>('idle');
  const [error, setError]   = useState<string | null>(null);

  const analyze = async () => {
    if (!text.trim()) return;
    setStatus('analyzing');
    setError(null);
    onResult(null);
    try {
      const res = await fetch(`${API_BASE}/analyze/text`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: text.trim() }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({})) as { detail?: string };
        throw new Error(e.detail || res.statusText);
      }
      onResult(await res.json());
      setStatus('done');
    } catch (e) {
      setError((e as Error).message);
      setStatus('error');
    }
  };

  return (
    <div className="es-text-section">
      <textarea
        className="es-textarea"
        placeholder={`Type or paste text here — e.g. "I can't believe you did that, I'm so angry!"`}
        value={text}
        onChange={(e) => { setText(e.target.value); onResult(null); setStatus('idle'); }}
        rows={5}
      />
      <div className="es-text-actions">
        <span className="es-char-count">{text.length} chars</span>
        <button
          className="es-btn es-btn--primary"
          onClick={analyze}
          disabled={!text.trim() || status === 'analyzing'}
        >
          {status === 'analyzing'
            ? <><span className="es-btn-spinner" /> Analyzing…</>
            : 'Analyze Emotions'}
        </button>
      </div>
      {status === 'analyzing' && <StatusBanner sub="Running BERT encoder · Classifying emotions" />}
      {status === 'error'     && <ErrorBanner msg={error!} />}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export const EmotionSensePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('video');
  const [results, setResults]     = useState<AnalysisResult | null>(null);

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setResults(null);
  };

  return (
    <div className="es-root">
      {/* Page heading */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
          Emotion Sense
        </h1>
        <p style={{ fontSize: 13, color: '#888', margin: 0 }}>
          Multimodal emotion &amp; sentiment detection — Video, Audio, or Text
        </p>
      </div>

      {/* Mode tabs */}
      <div className="es-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`es-tab-btn${activeTab === t.id ? ' es-tab-btn--active' : ''}`}
            onClick={() => handleTabChange(t.id)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'video' && <VideoTab onResult={setResults} />}
      {activeTab === 'audio' && <AudioTab onResult={setResults} />}
      {activeTab === 'text'  && <TextTab  onResult={setResults} />}

      {/* Results */}
      {results && results.utterances.length > 0 && (
        <div className="es-results-section">
          <div className="es-results-header">
            <h2 className="es-results-title">Results</h2>
            <ModeBadge mode={results.mode} />
            {results.failed_segments > 0 && (
              <span className="es-failed-note">{results.failed_segments} segment(s) failed</span>
            )}
          </div>
          <SummaryStats utterances={results.utterances} />
          <div className="es-utterances-list">
            {results.utterances.map((u, i) => (
              <UtteranceCard key={i} utterance={u} index={i} />
            ))}
          </div>
        </div>
      )}

      {results && results.utterances.length === 0 && (
        <div className="es-empty">No utterances detected.</div>
      )}
    </div>
  );
};
