import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  Zap, 
  Save, 
  Info,
  ChevronRight,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface Ambiguity {
  original: string;
  suggestion: string;
  context: string;
  issue: string;
  severity: string;
  isFixed?: boolean;
}

interface PolicyDocument {
  _id: string;
  title: string;
  fixedTextContent: string;
  detectedAmbiguities: Ambiguity[];
  qualityScore: number;
  isEmbeddable: boolean;
  organization: { name: string };
}

const ReviewStudio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<PolicyDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Determine if we are in Org Admin or Platform Admin context based on URL
  const isOrgAdmin = window.location.pathname.startsWith('/org-admin');
  const apiBasePath = isOrgAdmin ? '/api/org-admin/policy' : '/api/admin/policy';
  const listPath = isOrgAdmin ? '/org-admin/policies' : '/admin/policies';

  const fetchPolicy = useCallback(async () => {
    try {
      const endpoint = isOrgAdmin ? `${apiBasePath}/${id}` : `${apiBasePath}/pending`;
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        // If org admin, data.document is returned. If platform admin, we find in data.documents
        const found = isOrgAdmin ? data.document : data.documents.find((d: any) => d._id === id);
        if (found) {
          setDoc(found);
        } else {
          setMessage({ type: 'error', text: 'Policy not found' });
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error fetching policy' });
    } finally {
      setLoading(false);
    }
  }, [id, isOrgAdmin, apiBasePath]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  const handleAutofix = (index: number) => {
    if (!doc) return;

    const newAmbiguities = [...doc.detectedAmbiguities];
    const amb = newAmbiguities[index];
    
    if (amb.isFixed) return;

    // Apply the fix to the text content
    // We use a regex for safe case-insensitive replacement of the specific phrase
    try {
        const escapedOriginal = amb.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedOriginal}\\b`, 'gi');
        const newText = doc.fixedTextContent.replace(regex, amb.suggestion);
        
        amb.isFixed = true;
        
        setDoc({
            ...doc,
            fixedTextContent: newText,
            detectedAmbiguities: newAmbiguities
        });
    } catch (e) {
        console.error("Autofix failed", e);
    }
  };

  const handleSave = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      const response = await fetch(`${apiBasePath}/${id}/fix`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fixedTextContent: doc.fixedTextContent,
          ambiguities: doc.detectedAmbiguities
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Policy refined successfully!' });
        setTimeout(() => navigate(listPath), 1500);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Error saving fixes' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!doc) return <div className="p-8 text-center text-red-600">Policy not found.</div>;

  const criticalPending = doc.detectedAmbiguities.filter(a => a.severity === 'High' && !a.isFixed).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(listPath)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase tracking-wider">Review Studio v1.0</span>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-slate-500 text-xs font-medium">{doc.organization?.name}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{doc.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right mr-4 hidden sm:block">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Quality Score</p>
            <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-500 ${doc.qualityScore >= 80 ? 'bg-green-500' : doc.qualityScore >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${doc.qualityScore}%` }}
                    ></div>
                </div>
                <span className="text-sm font-bold text-slate-700">{doc.qualityScore}%</span>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all ${
              criticalPending > 0 
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-95'
            }`}
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
            Save & Finalize
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Panel: The Document Text */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[700px]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <h3 className="font-bold text-slate-700 text-sm">Processed Policy Text</h3>
              </div>
              <div className="flex gap-4">
                 <div className="flex items-center gap-1.5 grayscale opacity-60">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">AI Insights Active</span>
                 </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 leading-relaxed text-slate-700 font-serif whitespace-pre-wrap selection:bg-indigo-100">
               {doc.fixedTextContent}
            </div>
            <div className="p-4 bg-indigo-50 border-t border-indigo-100 flex items-center justify-center gap-4">
                <p className="text-[11px] text-indigo-700 font-medium flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    This is the finalized text that will be used for AI Embeddings and Chat interactions.
                </p>
            </div>
          </div>
        </div>

        {/* Right Panel: Ambiguity Studio */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500" />
                Ambiguity Studio
              </h3>
              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">
                {doc.detectedAmbiguities.length} Found
              </span>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {doc.detectedAmbiguities.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="font-bold text-slate-700">Perfect Quality</p>
                    <p className="text-xs text-slate-500 mt-1">No ambiguities detected in this policy.</p>
                </div>
              ) : (
                doc.detectedAmbiguities.map((amb, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        amb.isFixed 
                        ? 'bg-green-50 border-green-200 opacity-80' 
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-tighter ${
                             amb.severity === 'High' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            {amb.severity}
                          </span>
                          <span className="text-slate-400 text-xs font-medium">Issue #{idx + 1}</span>
                        </div>
                        {amb.isFixed && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ambiguous Phrase</p>
                        <div className="p-2 bg-slate-50 rounded bg-indigo-50/30 border border-indigo-100/50">
                            <span className="text-sm font-medium text-slate-700 line-through decoration-red-400/50 decoration-2">"{amb.original}"</span>
                        </div>
                      </div>

                      <div className="mb-4 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-slate-300 rotate-90" />
                      </div>

                      <div className="mb-5">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Suggested Fix</p>
                        <div className="p-2 bg-indigo-600 rounded shadow-sm">
                            <span className="text-sm font-bold text-white tracking-tight">"{amb.suggestion}"</span>
                        </div>
                      </div>

                      {!amb.isFixed && (
                        <button
                          onClick={() => handleAutofix(idx)}
                          className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98]"
                        >
                          <Zap className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                          Apply Autofix
                        </button>
                      )}
                    </div>
                  ))
              )}
            </div>

            {criticalPending > 0 && (
                <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    <div>
                        <p className="text-[11px] font-bold text-red-700 uppercase tracking-tight mb-1">Action Required</p>
                        <p className="text-xs text-red-600/80 leading-relaxed">
                            You must resolve all <strong>{criticalPending} critical</strong> ambiguities before this policy can be approved for AI Chat.
                        </p>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStudio;
