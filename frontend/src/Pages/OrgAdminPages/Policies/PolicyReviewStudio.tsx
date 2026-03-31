import React, { useState } from 'react';

interface AiSuggestion {
  original_phrase: string;
  reason_for_ambiguity: string;
  suggested_correction: string;
}

interface PolicyReviewStudioProps {
  documentId: string;
  title: string;
  initialText: string;
  aiSuggestions: AiSuggestion[];
  onCancel: () => void;
  onSuccess: () => void;
}

const generateFuzzyRegex = (phrase: string): RegExp | null => {
  if (!phrase) return null;
  let cleanWords = phrase.trim().split(/\s+/).map(w => {
     const core = w.replace(/^[^a-z0-9]+/i, '').replace(/[^a-z0-9]+$/i, '');
     return core ? core.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
  }).filter(Boolean);
  
  if (cleanWords.length === 0) return null;

  cleanWords = cleanWords.flatMap(w => {
    if (w.length > 15) {
      return w.match(/.{1,4}/g) || [w];
    }
    return [w];
  });

  return new RegExp(`(${cleanWords.join('[^a-zA-Z0-9]*')})`, 'i');
};

const PolicyReviewStudio: React.FC<PolicyReviewStudioProps> = ({ documentId, title, initialText, aiSuggestions, onCancel, onSuccess }) => {
  const [text, setText] = useState(initialText || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [resolvedIndices, setResolvedIndices] = useState<Set<number>>(new Set());
  const [fixedPhrases, setFixedPhrases] = useState<string[]>([]);
  const [actionErrors, setActionErrors] = useState<{ [key: number]: string }>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fixHistory, setFixHistory] = useState<{ [idx: number]: { original: string, correction: string } }>({});

  const applySuggestion = (original: string, correction: string, idx: number) => {
    const exactWords = original.trim().split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const exactRegex = new RegExp(`(${exactWords.join('\\s+')})`, 'i');
    const fuzzyRegex = generateFuzzyRegex(original);
    
    let regex = exactRegex;
    if (!exactRegex.test(text) && fuzzyRegex && fuzzyRegex.test(text)) {
      regex = fuzzyRegex;
    }

    if (regex.test(text)) {
      setText(text.replace(regex, correction));
      setResolvedIndices(new Set(resolvedIndices).add(idx));
      setFixedPhrases([...fixedPhrases, correction]);
      setFixHistory({ ...fixHistory, [idx]: { original, correction } });
      
      const newErrors = { ...actionErrors };
      delete newErrors[idx];
      setActionErrors(newErrors);
    } else {
      setActionErrors({
        ...actionErrors,
        [idx]: `⚠️ Auto-Fix Failed: The AI paraphrased the quote slightly, or there's a typo in the original PDF. Please use the Copy button above and manually replace it in the text on the left.`
      });
    }
  };

  const undoSuggestion = (idx: number) => {
    const history = fixHistory[idx];
    if (!history) return;

    if (text.includes(history.correction)) {
      setText(text.replace(history.correction, history.original));
      
      const newResolved = new Set(resolvedIndices);
      newResolved.delete(idx);
      setResolvedIndices(newResolved);
      
      const newFixed = fixedPhrases.filter(p => p !== history.correction);
      setFixedPhrases(newFixed);
      
      const newHistory = { ...fixHistory };
      delete newHistory[idx];
      setFixHistory(newHistory);
    } else {
      setActionErrors({ ...actionErrors, [idx]: "Cannot undo because the text was modified manually since the auto-fix." });
    }
  };

  const splitByPhrase = (chunks: {text: string, type: string}[], phrase: string, newType: string, isFixed = false) => {
    if (!phrase) return chunks;
    const result: {text: string, type: string}[] = [];
    
    const exactWords = phrase.trim().split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const exactRegex = new RegExp(`(${exactWords.join('\\s+')})`, 'i');
    
    chunks.forEach(chunk => {
      if (chunk.type !== 'normal') {
        result.push(chunk);
        return;
      }
      
      let chunkRegex = exactRegex;
      if (!isFixed && !chunkRegex.test(chunk.text)) {
         const fuzzyRegex = generateFuzzyRegex(phrase);
         if (fuzzyRegex && fuzzyRegex.test(chunk.text)) {
            chunkRegex = fuzzyRegex;
         }
      }

      const parts = chunk.text.split(chunkRegex);
      parts.forEach((part, i) => {
        if (!part) return;
        // The split array has the captured matches perfectly positioned on odd numbered indices!
        if (i % 2 === 1) {
           result.push({ text: part, type: newType });
        } else {
           result.push({ text: part, type: 'normal' });
        }
      });
    });
    return result;
  };

  const renderHighlights = () => {
    let chunks = [{ text, type: 'normal' }];
    
    // Highlight resolved (fixed) phrases in green
    fixedPhrases.forEach(phrase => {
      chunks = splitByPhrase(chunks, phrase, 'fixed', true);
    });

    // Highlight unresolved (ambiguous) phrases in red/yellow
    aiSuggestions.forEach((sugg, idx) => {
      if (!resolvedIndices.has(idx)) {
        chunks = splitByPhrase(chunks, sugg.original_phrase, `ambiguous-${idx}`, false);
      }
    });

    return chunks.map((chunk, i) => {
      if (chunk.type.startsWith('ambiguous')) {
        const id = chunk.type.split('-')[1];
        return <mark key={i} id={`mark-${id}`} className="bg-red-200 text-transparent rounded px-1">{chunk.text}</mark>;
      }
      if (chunk.type === 'fixed') return <mark key={i} className="bg-green-200 text-transparent rounded px-1">{chunk.text}</mark>;
      return <span key={i} className="text-transparent">{chunk.text}</span>;
    });
  };

  const scrollToIndex = (idx: number) => {
    const mark = document.getElementById(`mark-${idx}`);
    const textarea = document.getElementById('policy-editor-textarea');
    if (mark && textarea) {
       textarea.scrollTo({ top: mark.offsetTop - 100, behavior: 'smooth' });
    }
  };

  const syncScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const backdrop = document.getElementById('highlight-backdrop');
    if (backdrop) {
      backdrop.scrollTop = e.currentTarget.scrollTop;
      backdrop.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleFinalize = async () => {
    setSubmitting(true);
    setError('');
    
    try {
      const response = await fetch(`/api/org-admin/policy/${documentId}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ finalizedText: text })
      });
      
      const data = await response.json();
      if (response.ok) {
        onSuccess();
      } else {
        setError(data.message || 'Failed to finalize policy');
      }
    } catch (err) {
      setError('An error occurred during finalization.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={isFullscreen 
      ? "fixed inset-0 z-50 bg-slate-50 p-6 md:p-12 overflow-hidden flex flex-col" 
      : "bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col h-full"
    }>
      <div className="flex flex-col mb-6 gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Review Policy Phase: {title}</h2>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsFullscreen(!isFullscreen)} className="text-slate-600 hover:text-slate-900 border border-slate-300 px-3 py-1.5 bg-white rounded flex items-center gap-2 shadow-sm font-medium">
              {isFullscreen ? '↙️ Exit Fullscreen' : '↗️ Fullscreen'}
            </button>
            <button onClick={onCancel} className="text-slate-500 hover:text-slate-700 px-3 py-1.5 font-medium">Cancel</button>
          </div>
        </div>

        {/* Progress bar */}
        {aiSuggestions && aiSuggestions.length > 0 && (
          <div className="w-full">
            <div className="flex justify-between text-sm font-medium text-slate-600 mb-1">
              <span>{resolvedIndices.size} of {aiSuggestions.length} Ambiguities Resolved</span>
              <span>{Math.round((resolvedIndices.size / aiSuggestions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div 
                 className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
                 style={{ width: `${Math.round((resolvedIndices.size / aiSuggestions.length) * 100)}%` }} 
              />
            </div>
          </div>
        )}
      </div>

      <div className={`flex flex-col md:flex-row gap-6 ${isFullscreen ? 'flex-1 min-h-0' : ''}`}>
        <div className="w-full md:w-2/3 flex flex-col">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Policy Text (Ambiguous: <span className="bg-red-200 px-1 rounded">Red</span> | Fixed: <span className="bg-green-200 px-1 rounded">Green</span>)
          </label>
          
          <div className={`relative border border-slate-300 rounded-md bg-white overflow-hidden focus-within:ring-2 focus-within:ring-slate-500 focus-within:border-slate-500 font-sans text-base leading-relaxed overflow-y-auto ${isFullscreen ? 'flex-1 max-h-full' : 'h-[32rem]'}`}>
            
            <div 
              id="highlight-backdrop"
              className="absolute inset-0 pointer-events-none p-4 whitespace-pre-wrap break-words z-0 w-full overflow-hidden"
              aria-hidden="true"
            >
              {renderHighlights()}
            </div>
            
            <textarea 
              id="policy-editor-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onScroll={syncScroll}
              className="absolute inset-0 w-full h-full p-4 bg-transparent resize-none outline-none text-slate-900 whitespace-pre-wrap break-words m-0 border-none z-10"
              spellCheck="false"
            />
          </div>
        </div>
        
        <div className={`w-full md:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 ${isFullscreen ? 'flex-1 max-h-full' : 'max-h-[400px]'}`}>
          <h3 className="text-lg font-medium">AI Suggestions</h3>
          {(!aiSuggestions || aiSuggestions.length === 0) ? (
            <p className="text-green-600 bg-green-50 p-3 rounded border border-green-200">
              No ambiguities detected! This policy looks solid.
            </p>
          ) : (
            aiSuggestions.map((sugg, idx) => (
              <div key={idx} className="bg-amber-50 border border-amber-200 p-4 rounded-md text-sm">
                <p className="font-semibold text-amber-800 mb-1">Ambiguous Phrase:</p>
                <p className="italic text-slate-700 mb-3 bg-white p-2 rounded">"{sugg.original_phrase}"</p>
                
                <p className="font-semibold text-amber-800 mb-1">Reason:</p>
                <p className="text-slate-700 mb-3">{sugg.reason_for_ambiguity}</p>
                
                <p className="font-semibold text-green-700 mb-1">Suggested Correction:</p>
                <div className="flex items-center gap-2 mb-2">
                  <p className="bg-green-50 p-2 rounded border border-green-200 flex-1 break-words">"{sugg.suggested_correction}"</p>
                  
                  {resolvedIndices.has(idx) ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-green-600 bg-green-100 px-3 py-2 rounded border border-green-200 shrink-0 shadow-sm">
                        ✓ Fixed
                      </span>
                      <button 
                        onClick={() => undoSuggestion(idx)}
                        className="px-2 py-1 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Undo this auto-fix"
                      >
                        Undo
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => scrollToIndex(idx)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 transition-colors flex items-center justify-center shrink-0"
                        title="Locate phrase in text"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(sugg.suggested_correction);
                          setCopiedIndex(idx);
                          setTimeout(() => setCopiedIndex(null), 2000);
                        }}
                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 border border-slate-300 transition-colors flex items-center justify-center shrink-0"
                        title="Copy suggestion"
                      >
                        {copiedIndex === idx ? (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        )}
                      </button>
                      <button 
                        onClick={() => applySuggestion(sugg.original_phrase, sugg.suggested_correction, idx)}
                        className="p-2 px-3 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition-colors shrink-0 shadow-sm"
                        title="Instantly swap the text"
                      >
                        Auto-Fix
                      </button>
                    </>
                  )}
                </div>
                
                {actionErrors[idx] && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded shadow-sm">
                    {actionErrors[idx]}
                  </div>
                )}

                {!resolvedIndices.has(idx) && !actionErrors[idx] && (
                  <p className="text-xs text-slate-500 mt-2">Click Auto-Fix to swap it in the editor, or Copy to do it manually.</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      <div className="mt-6 flex justify-end">
        <button 
          onClick={handleFinalize}
          disabled={submitting || !text}
          className="px-6 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? 'Finalizing...' : 'Save & Submit to AI Backend'}
        </button>
      </div>
    </div>
  );
};

export default PolicyReviewStudio;
