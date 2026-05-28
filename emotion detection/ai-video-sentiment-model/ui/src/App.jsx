import { useState, useRef, useCallback } from 'react'
import './App.css'

const API_BASE = 'http://localhost:8000'

const EMOTION_COLORS = {
  anger:    '#ef4444',
  disgust:  '#84cc16',
  fear:     '#a855f7',
  joy:      '#f59e0b',
  neutral:  '#6b7280',
  sadness:  '#3b82f6',
  surprise: '#f97316',
}

const SENTIMENT_COLORS = {
  positive: '#22c55e',
  neutral:  '#6b7280',
  negative: '#ef4444',
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
]

function formatTime(seconds) {
  if (seconds === 0) return null
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toFixed(1).padStart(4, '0')
  return `${m}:${s}`
}

function EmotionBar({ label, confidence }) {
  return (
    <div className="emotion-bar-row">
      <span className="emotion-label" style={{ color: EMOTION_COLORS[label] }}>
        {label}
      </span>
      <div className="emotion-bar-track">
        <div
          className="emotion-bar-fill"
          style={{ width: `${(confidence * 100).toFixed(1)}%`, background: EMOTION_COLORS[label] }}
        />
      </div>
      <span className="emotion-pct">{(confidence * 100).toFixed(1)}%</span>
    </div>
  )
}

function SentimentPill({ label, confidence }) {
  return (
    <span
      className="sentiment-pill"
      style={{
        background: SENTIMENT_COLORS[label] + '22',
        color: SENTIMENT_COLORS[label],
        borderColor: SENTIMENT_COLORS[label] + '66',
      }}
    >
      {label} &middot; {(confidence * 100).toFixed(0)}%
    </span>
  )
}

function ModeBadge({ mode }) {
  if (!mode || mode === 'video') return null
  const labels = { audio: 'Audio-only (no video frames)', text: 'Text-only (no video or audio)' }
  return <span className="mode-badge">{labels[mode]}</span>
}

function UtteranceCard({ utterance, index, mode }) {
  const time = utterance.start_time !== undefined && utterance.end_time !== undefined
    && !(utterance.start_time === 0 && utterance.end_time === 0)

  return (
    <div className="utterance-card">
      <div className="utterance-header">
        <span className="utterance-index">#{index + 1}</span>
        {time && (
          <span className="utterance-time">
            {formatTime(utterance.start_time)} &rarr; {formatTime(utterance.end_time)}
          </span>
        )}
        <div className="utterance-sentiments">
          <SentimentPill
            label={utterance.sentiments[0].label}
            confidence={utterance.sentiments[0].confidence}
          />
        </div>
      </div>
      <p className="utterance-text">&ldquo;{utterance.text}&rdquo;</p>
      <div className="utterance-emotions">
        {utterance.emotions.map((e) => (
          <EmotionBar key={e.label} label={e.label} confidence={e.confidence} />
        ))}
      </div>
    </div>
  )
}

function SummaryStats({ utterances }) {
  const emotionCounts = {}
  const sentimentCounts = {}
  utterances.forEach((u) => {
    const top = u.emotions[0].label
    emotionCounts[top] = (emotionCounts[top] || 0) + 1
    const sen = u.sentiments[0].label
    sentimentCounts[sen] = (sentimentCounts[sen] || 0) + 1
  })
  const [domEmotion]   = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])
  const [domSentiment] = Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])

  return (
    <div className="summary-stats">
      <div className="stat-card">
        <span className="stat-value">{utterances.length}</span>
        <span className="stat-label">Utterances</span>
      </div>
      <div className="stat-card">
        <span className="stat-value" style={{ color: EMOTION_COLORS[domEmotion[0]] }}>
          {domEmotion[0]}
        </span>
        <span className="stat-label">Dominant Emotion</span>
      </div>
      <div className="stat-card">
        <span className="stat-value" style={{ color: SENTIMENT_COLORS[domSentiment[0]] }}>
          {domSentiment[0]}
        </span>
        <span className="stat-label">Overall Sentiment</span>
      </div>
    </div>
  )
}

// ── Video tab ─────────────────────────────────────────────────────────────────
function VideoTab({ onResult }) {
  const [file, setFile]     = useState(null)
  const [videoUrl, setUrl]  = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError]   = useState(null)
  const [dragging, setDrag] = useState(false)
  const inputRef = useRef(null)

  const handleFile = useCallback((f) => {
    if (!f) return
    setFile(f); setUrl(URL.createObjectURL(f))
    setError(null); setStatus('idle'); onResult(null)
  }, [onResult])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('video/')) handleFile(f)
  }, [handleFile])

  const analyze = async () => {
    setStatus('analyzing'); setError(null); onResult(null)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch(`${API_BASE}/analyze`, { method: 'POST', body: fd })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || res.statusText) }
      onResult(await res.json()); setStatus('done')
    } catch (e) { setError(e.message); setStatus('error') }
  }

  if (!file) return (
    <div
      className={`drop-zone ${dragging ? 'drop-zone--active' : ''}`}
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onClick={() => inputRef.current?.click()}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <svg className="drop-icon" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
      </svg>
      <p className="drop-title">Drop a video file here</p>
      <p className="drop-sub">or <span className="drop-link">click to browse</span></p>
      <p className="drop-formats">MP4 &middot; MOV &middot; AVI &middot; MKV</p>
      <input ref={inputRef} type="file" accept="video/*" style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])} />
    </div>
  )

  return (
    <>
      <div className="preview-section">
        <div className="video-wrapper"><video src={videoUrl} controls className="video-player" /></div>
        <div className="preview-meta">
          <div className="file-info">
            <span className="file-name">{file.name}</span>
            <span className="file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
          </div>
          <div className="preview-actions">
            <button className="btn btn--secondary"
              onClick={() => { setFile(null); setUrl(null); setStatus('idle'); onResult(null) }}>
              Change
            </button>
            <button className="btn btn--primary" onClick={analyze} disabled={status === 'analyzing'}>
              {status === 'analyzing' ? <><span className="btn-spinner" /> Analyzing&hellip;</> : 'Analyze Emotions'}
            </button>
          </div>
        </div>
      </div>
      {status === 'analyzing' && <StatusBanner sub="Transcribing · Extracting frames · Running model" />}
      {status === 'error'     && <ErrorBanner msg={error} />}
    </>
  )
}

// ── Audio tab ─────────────────────────────────────────────────────────────────
function AudioTab({ onResult }) {
  const [file, setFile]     = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError]   = useState(null)
  const [dragging, setDrag] = useState(false)
  const inputRef = useRef(null)

  const handleFile = useCallback((f) => {
    if (!f) return
    setFile(f); setError(null); setStatus('idle'); onResult(null)
  }, [onResult])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('audio/')) handleFile(f)
  }, [handleFile])

  const analyze = async () => {
    setStatus('analyzing'); setError(null); onResult(null)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch(`${API_BASE}/analyze/audio`, { method: 'POST', body: fd })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || res.statusText) }
      onResult(await res.json()); setStatus('done')
    } catch (e) { setError(e.message); setStatus('error') }
  }

  if (!file) return (
    <div
      className={`drop-zone ${dragging ? 'drop-zone--active' : ''}`}
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onClick={() => inputRef.current?.click()}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
    >
      <svg className="drop-icon" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
      </svg>
      <p className="drop-title">Drop an audio file here</p>
      <p className="drop-sub">or <span className="drop-link">click to browse</span></p>
      <p className="drop-formats">MP3 &middot; WAV &middot; M4A &middot; OGG &middot; FLAC</p>
      <input ref={inputRef} type="file" accept="audio/*" style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])} />
    </div>
  )

  return (
    <>
      <div className="audio-preview">
        <div className="audio-preview-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </div>
        <div className="audio-preview-info">
          <span className="file-name">{file.name}</span>
          <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>
        <div className="preview-actions">
          <button className="btn btn--secondary"
            onClick={() => { setFile(null); setStatus('idle'); onResult(null) }}>
            Change
          </button>
          <button className="btn btn--primary" onClick={analyze} disabled={status === 'analyzing'}>
            {status === 'analyzing' ? <><span className="btn-spinner" /> Analyzing&hellip;</> : 'Analyze Emotions'}
          </button>
        </div>
      </div>
      {status === 'analyzing' && <StatusBanner sub="Transcribing audio · Extracting mel features · Running model" />}
      {status === 'error'     && <ErrorBanner msg={error} />}
    </>
  )
}

// ── Text tab ──────────────────────────────────────────────────────────────────
function TextTab({ onResult }) {
  const [text, setText]     = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError]   = useState(null)

  const analyze = async () => {
    if (!text.trim()) return
    setStatus('analyzing'); setError(null); onResult(null)
    try {
      const res = await fetch(`${API_BASE}/analyze/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || res.statusText) }
      onResult(await res.json()); setStatus('done')
    } catch (e) { setError(e.message); setStatus('error') }
  }

  return (
    <div className="text-input-section">
      <textarea
        className="text-input"
        placeholder="Type or paste text here — e.g. &quot;I can't believe you did that, I'm so angry!&quot;"
        value={text}
        onChange={(e) => { setText(e.target.value); onResult(null); setStatus('idle') }}
        rows={5}
      />
      <div className="text-actions">
        <span className="char-count">{text.length} chars</span>
        <button
          className="btn btn--primary"
          onClick={analyze}
          disabled={!text.trim() || status === 'analyzing'}
        >
          {status === 'analyzing' ? <><span className="btn-spinner" /> Analyzing&hellip;</> : 'Analyze Emotions'}
        </button>
      </div>
      {status === 'analyzing' && <StatusBanner sub="Running BERT encoder · Classifying emotions" />}
      {status === 'error'     && <ErrorBanner msg={error} />}
    </div>
  )
}

// ── Shared UI pieces ──────────────────────────────────────────────────────────
function StatusBanner({ sub }) {
  return (
    <div className="status-banner">
      <div className="status-spinner" />
      <div>
        <p className="status-title">Analyzing&hellip;</p>
        <p className="status-sub">{sub}</p>
      </div>
    </div>
  )
}

function ErrorBanner({ msg }) {
  return (
    <div className="error-banner">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="13" />
        <circle cx="12" cy="16.5" r="0.8" fill="currentColor" />
      </svg>
      <span>{msg}</span>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('video')
  const [results, setResults]     = useState(null)

  const handleTabChange = (id) => {
    setActiveTab(id); setResults(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <circle cx="9" cy="9" r="1" fill="currentColor" />
              <circle cx="15" cy="9" r="1" fill="currentColor" />
            </svg>
            <span className="header-title">EmotionSense</span>
          </div>
          <span className="header-sub">Multimodal Emotion &amp; Sentiment Detection</span>
        </div>
      </header>

      <main className="app-main">
        {/* Mode tabs */}
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab-btn ${activeTab === t.id ? 'tab-btn--active' : ''}`}
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

        {/* Results (shared across all tabs) */}
        {results && results.utterances.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h2 className="results-title">Results</h2>
              <ModeBadge mode={results.mode} />
              {results.failed_segments > 0 && (
                <span className="failed-note">
                  {results.failed_segments} segment(s) failed
                </span>
              )}
            </div>
            <SummaryStats utterances={results.utterances} />
            <div className="utterances-list">
              {results.utterances.map((u, i) => (
                <UtteranceCard key={i} utterance={u} index={i} mode={results.mode} />
              ))}
            </div>
          </div>
        )}

        {results && results.utterances.length === 0 && (
          <div className="empty-results">No utterances detected.</div>
        )}
      </main>

      <footer className="app-footer">
        Powered by BERT &middot; R3D-18 Video &middot; OpenAI Whisper &middot; Trained on MELD Dataset
      </footer>
    </div>
  )
}

