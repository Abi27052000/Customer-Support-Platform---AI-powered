import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:8000/api';

const EMOTION_COLORS: Record<string, string> = {
  admiration:    'bg-yellow-100 text-yellow-800 border-yellow-300',
  amusement:     'bg-orange-100 text-orange-800 border-orange-300',
  anger:         'bg-red-100 text-red-800 border-red-300',
  annoyance:     'bg-red-50 text-red-700 border-red-200',
  approval:      'bg-green-100 text-green-800 border-green-300',
  caring:        'bg-pink-100 text-pink-800 border-pink-300',
  confusion:     'bg-purple-100 text-purple-800 border-purple-300',
  curiosity:     'bg-blue-100 text-blue-800 border-blue-300',
  desire:        'bg-rose-100 text-rose-800 border-rose-300',
  disappointment:'bg-gray-100 text-gray-700 border-gray-300',
  disapproval:   'bg-red-100 text-red-700 border-red-200',
  disgust:       'bg-lime-100 text-lime-800 border-lime-300',
  embarrassment: 'bg-pink-50 text-pink-700 border-pink-200',
  excitement:    'bg-amber-100 text-amber-800 border-amber-300',
  fear:          'bg-violet-100 text-violet-800 border-violet-300',
  gratitude:     'bg-teal-100 text-teal-800 border-teal-300',
  grief:         'bg-slate-100 text-slate-700 border-slate-300',
  joy:           'bg-yellow-100 text-yellow-700 border-yellow-300',
  love:          'bg-rose-100 text-rose-700 border-rose-300',
  nervousness:   'bg-orange-100 text-orange-700 border-orange-300',
  optimism:      'bg-green-100 text-green-700 border-green-300',
  pride:         'bg-indigo-100 text-indigo-800 border-indigo-300',
  realization:   'bg-cyan-100 text-cyan-800 border-cyan-300',
  relief:        'bg-emerald-100 text-emerald-800 border-emerald-300',
  remorse:       'bg-slate-100 text-slate-600 border-slate-300',
  sadness:       'bg-blue-100 text-blue-700 border-blue-300',
  surprise:      'bg-violet-100 text-violet-700 border-violet-300',
  neutral:       'bg-gray-100 text-gray-600 border-gray-300',
};

const EMOTION_ICONS: Record<string, string> = {
  admiration: '🌟', amusement: '😄', anger: '😠', annoyance: '😤',
  approval: '👍', caring: '🤗', confusion: '😕', curiosity: '🤔',
  desire: '💫', disappointment: '😞', disapproval: '👎', disgust: '🤢',
  embarrassment: '😳', excitement: '🤩', fear: '😨', gratitude: '🙏',
  grief: '😢', joy: '😊', love: '❤️', nervousness: '😰',
  optimism: '🌈', pride: '😌', realization: '💡', relief: '😅',
  remorse: '😔', sadness: '😢', surprise: '😲', neutral: '😐',
};

export const TextEmotionPage: React.FC = () => {
  const [text, setText] = useState('');
  const [emotions, setEmotions] = useState<string[]>([]);
  const [allProbabilities, setAllProbabilities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzed, setAnalyzed] = useState(false);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setAnalyzed(false);

    try {
      const response = await fetch(`${API_BASE_URL}/emotion-detection/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to analyze emotions');
      }

      const data = await response.json();
      setEmotions(data.emotions);
      setAllProbabilities(data.all_probabilities ?? {});
      setAnalyzed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText('');
    setEmotions([]);
    setAllProbabilities({});
    setAnalyzed(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAnalyze();
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Text Emotion Detection</h1>
          <p className="text-gray-500 text-sm mt-1">
            Analyze the emotional tone of any text using our AI model. Press{' '}
            <kbd className="px-1.5 py-0.5 text-xs bg-gray-200 rounded border border-gray-300 font-mono">Ctrl+Enter</kbd>{' '}
            to analyze.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter text to analyze
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type or paste any text here... e.g. 'I am so excited about this new project!'"
            rows={5}
            className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-400">{text.length} characters</span>
            <div className="flex gap-2">
              {(text || analyzed) && (
                <button
                  onClick={handleClear}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleAnalyze}
                disabled={!text.trim() || loading}
                className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block"></span>
                    Analyzing...
                  </span>
                ) : (
                  'Analyze Emotions'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <p className="font-semibold mb-0.5">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {analyzed && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              Detected Emotions
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({emotions.length} emotion{emotions.length !== 1 ? 's' : ''} detected)
              </span>
            </h2>

            {emotions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">🤷</p>
                <p className="text-gray-500 text-sm">No specific emotions detected in this text.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {emotions.map((emotion) => (
                  <span
                    key={emotion}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border capitalize ${
                      EMOTION_COLORS[emotion] ?? 'bg-gray-100 text-gray-700 border-gray-300'
                    }`}
                  >
                    <span>{EMOTION_ICONS[emotion] ?? '💬'}</span>
                    {emotion}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Probability Breakdown */}
        {analyzed && Object.keys(allProbabilities).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Probability Breakdown</h2>
            <div className="space-y-2.5">
              {Object.entries(allProbabilities).map(([emotion, prob]) => {
                const pct = Math.round(prob * 100);
                const isDetected = emotions.includes(emotion);
                return (
                  <div key={emotion} className="flex items-center gap-3">
                    <span className="w-5 text-base shrink-0">{EMOTION_ICONS[emotion] ?? '💬'}</span>
                    <span className={`w-28 text-xs capitalize shrink-0 ${isDetected ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                      {emotion}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${isDetected ? 'bg-blue-500' : 'bg-gray-300'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`w-10 text-xs text-right shrink-0 ${isDetected ? 'font-semibold text-blue-600' : 'text-gray-400'}`}>
                      {(prob * 100).toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
