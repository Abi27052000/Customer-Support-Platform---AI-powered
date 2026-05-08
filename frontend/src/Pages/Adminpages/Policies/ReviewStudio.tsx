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
  FileText,
  Activity,
  Award,
  Flag,
  Eye,
  Edit3
} from 'lucide-react';

interface Ambiguity {
  original: string;
  suggestion: string;
  explanation?: string;
  context: string;
  issue: string;
  severity: string;
  isFixed?: boolean;
}

interface HeatmapChunk {
  text: string;
  risk_level: 'Low' | 'Medium' | 'High' | 'None' | 'Fixed';
}

interface PolicyDocument {
  _id: string;
  title: string;
  fixedTextContent: string;
  detectedAmbiguities: Ambiguity[];
  qualityScore: number;
  isEmbeddable: boolean;
  organization: { name: string };
  reviewStudioData?: {
    red_flags: Array<{ phrase: string; risk: string; severity: string }>;
    heatmap: HeatmapChunk[];
  };
}

const ReviewStudio: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doc, setDoc] = useState<PolicyDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showRawText, setShowRawText] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const isOrgAdmin = window.location.pathname.startsWith('/org-admin');
  const apiBasePath = isOrgAdmin ? '/api/org-admin/policy' : '/api/admin/policy';
  const listPath = isOrgAdmin ? '/org-admin/policies' : '/admin/policies';

  const fetchPolicy = useCallback(async () => {
    try {
      const endpoint = `${apiBasePath}/${id}`;
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDoc(data.document);
      } else {
        setMessage({ type: 'error', text: 'Policy not found' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error fetching policy' });
    } finally {
      setLoading(false);
    }
  }, [id, apiBasePath]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  const handleAutofix = (index: number) => {
    if (!doc) return;
    const newAmbiguities = [...doc.detectedAmbiguities];
    const amb = newAmbiguities[index];
    if (amb.isFixed) return;

    try {
        const escapedOriginal = amb.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedOriginal, 'gi');
        
        // 1. Update the text content
        const newText = doc.fixedTextContent.replace(regex, amb.suggestion);
        
        // 2. Mark as fixed
        amb.isFixed = true;
        
        // 3. Update Heatmap to show GREEN for fixed parts
        const newHeatmap = [...(doc.reviewStudioData?.heatmap || [])];
        const heatmapIndex = newHeatmap.findIndex(chunk => 
          chunk.text.toLowerCase() === amb.original.toLowerCase() && 
          (chunk.risk_level === 'Medium' || chunk.risk_level === 'High')
        );
        
        if (heatmapIndex !== -1) {
          newHeatmap[heatmapIndex] = {
            ...newHeatmap[heatmapIndex],
            text: amb.suggestion,
            risk_level: 'Fixed'
          };
        }

        setDoc({ 
          ...doc, 
          fixedTextContent: newText, 
          detectedAmbiguities: newAmbiguities,
          reviewStudioData: {
            ...doc.reviewStudioData!,
            heatmap: newHeatmap
          }
        });
        
        // Keep heatmap view or switch to text as needed
        // setShowRawText(true); 
    } catch (e) {
        console.error("Autofix failed", e);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!doc) return;
    setDoc({ ...doc, fixedTextContent: e.target.value });
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
        setMessage({ type: 'success', text: 'Policy refined and saved successfully!' });
        setTimeout(() => navigate(listPath), 1500);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Error saving fixes' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
          <Activity className="absolute inset-0 m-auto w-6 h-6 text-indigo-400 animate-pulse" />
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Initializing Review Studio...</p>
      </div>
    );
  }

  if (!doc) return <div className="p-8 text-center text-red-600">Policy not found.</div>;

  const criticalPending = doc.detectedAmbiguities.filter(a => a.severity === 'High' && !a.isFixed).length;
  const heatmap = doc.reviewStudioData?.heatmap || [];
  const redFlags = doc.reviewStudioData?.red_flags || [];

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate(listPath)} className="p-3 hover:bg-slate-100 rounded-2xl transition-all border border-slate-200 shadow-sm">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                  <Zap className="w-3 h-3 fill-white" />
                  Review Studio
                </div>
                <span className="text-slate-300 text-xs">/</span>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-tighter">{doc.organization?.name}</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{doc.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 border-r border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Health Score</p>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-black ${doc.qualityScore >= 80 ? 'text-green-600' : doc.qualityScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {doc.qualityScore}%
              </span>
              <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${doc.qualityScore >= 80 ? 'bg-green-500' : doc.qualityScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${doc.qualityScore}%` }}
                ></div>
              </div>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || criticalPending > 0}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${
              criticalPending > 0 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
            }`}
          >
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ShieldCheck className="w-5 h-5" />}
            Save & Publish Policy
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-8 p-4 rounded-2xl flex items-center gap-4 border-2 animate-in slide-in-from-top duration-300 ${
          message.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
        }`}>
          <div className={`p-2 rounded-xl ${message.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <span className="font-bold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* LEFT: Policy Viewer */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden flex flex-col min-h-[750px]">
            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                  {showRawText ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                  {showRawText ? 'Document Editor (Live)' : 'Policy Heatmap'}
                </h3>
              </div>
              <div className="flex gap-4">
                 <button 
                  onClick={() => setShowRawText(!showRawText)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border ${
                    showRawText ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                 >
                   {showRawText ? 'View Heatmap' : 'View Text'}
                 </button>
              </div>
            </div>

            <div className="flex-1 p-10 flex flex-col min-h-0 overflow-hidden">
               {!showRawText && heatmap.length > 0 ? (
                 <div className="flex-1 leading-relaxed font-serif text-lg text-slate-700 whitespace-pre-wrap overflow-y-auto pr-2 custom-scrollbar">
                    {heatmap.map((chunk, i) => (
                      <span 
                        key={i} 
                        className={`transition-all duration-500 inline px-1 py-0.5 rounded-md ${
                          chunk.risk_level === 'High' ? 'bg-red-100 text-red-900 font-bold border-b-2 border-red-400' :
                          chunk.risk_level === 'Medium' ? 'bg-amber-100 text-amber-900 font-bold border-b-2 border-amber-400' :
                          chunk.risk_level === 'Fixed' ? 'bg-green-100 text-green-900 font-bold border-b-2 border-green-400' :
                          'hover:bg-slate-50'
                        }`}
                      >
                        {chunk.text}
                      </span>
                    ))}
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col min-h-0">
                    <textarea
                      value={doc.fixedTextContent}
                      onChange={handleTextChange}
                      className="flex-1 w-full p-0 border-none focus:ring-0 resize-none font-serif text-lg leading-relaxed text-slate-700 bg-transparent custom-scrollbar animate-in fade-in duration-300"
                      placeholder="Start refining your policy content here..."
                      spellCheck="false"
                    />
                    
                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Words</span>
                          <span className="text-sm font-bold text-slate-600">{doc.fixedTextContent.split(/\s+/).filter(Boolean).length}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Characters</span>
                          <span className="text-sm font-bold text-slate-600">{doc.fixedTextContent.length}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-tight">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        Live Editor Active
                      </div>
                    </div>
                 </div>
               )}
            </div>
            
            {showRawText && (
              <div className="px-8 py-4 bg-indigo-50/50 border-t border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <p className="text-xs text-indigo-700 font-medium italic">
                    Changes made here are saved directly to the refined version of the policy.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] font-bold text-indigo-400 uppercase">Auto-sync Enabled</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Analysis Studio */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600"><Zap className="w-5 h-5 fill-indigo-200" /></div>
                  <h3 className="font-black text-slate-800 uppercase tracking-wide">Analysis Studio</h3>
               </div>
               <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black">
                 {doc.detectedAmbiguities.filter(a => !a.isFixed).length} RISKS REMAINING
               </span>
            </div>

            <div className="space-y-5 max-h-[600px] overflow-y-auto pr-3 custom-scrollbar">
              {doc.detectedAmbiguities.length === 0 ? (
                <div className="text-center py-16 px-6 bg-green-50/50 rounded-3xl border-2 border-dashed border-green-100">
                    <Award className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-xl font-black text-slate-800">Quality Verified</p>
                    <p className="text-sm text-slate-500 mt-2">No structural ambiguities detected in this version.</p>
                </div>
              ) : (
                doc.detectedAmbiguities.map((amb, idx) => (
                    <div key={idx} className={`p-6 rounded-2xl border-2 transition-all ${amb.isFixed ? 'bg-green-50 border-green-200 opacity-60' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${amb.severity === 'High' ? 'bg-red-600 text-white' : 'bg-amber-400 text-slate-900'}`}>{amb.severity} RISK</span>
                        {amb.isFixed && <div className="p-1 bg-green-500 rounded-full"><CheckCircle className="w-3 h-3 text-white" /></div>}
                      </div>
                      
                      <div className="space-y-4">
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Detected Issue</p>
                            <p className={`text-sm font-bold text-slate-800 italic ${amb.isFixed ? '' : 'line-through decoration-red-400/50 opacity-50'}`}>"{amb.original}"</p>
                         </div>
                         {!amb.isFixed && (
                           <>
                             <div className="flex justify-center"><ChevronRight className="w-4 h-4 text-slate-200 rotate-90" /></div>
                             <div>
                                <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">Action: Auto-Fix Suggestion</p>
                                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm font-bold text-indigo-700 mb-2">
                                  "{amb.suggestion}"
                                </div>
                                {amb.explanation && (
                                  <p className="text-[10px] text-slate-500 italic px-1">{amb.explanation}</p>
                                )}
                             </div>
                           </>
                         )}
                      </div>

                      {!amb.isFixed && (
                        <button onClick={() => handleAutofix(idx)} className="w-full mt-5 py-3 bg-slate-900 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all active:scale-[0.98]">
                          <Zap className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
                          APPLY AUTO-FIX
                        </button>
                      )}
                    </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReviewStudio;
