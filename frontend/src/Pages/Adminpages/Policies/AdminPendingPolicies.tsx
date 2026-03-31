import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, AlertCircle, Sparkles, ExternalLink, FileText, CheckCircle, XCircle } from 'lucide-react';

interface PolicyDocument {
  _id: string;
  title: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  fileUrl: string;
  createdAt: string;
  organization: { name: string, _id: string };
  uploadedBy: { name: string, email: string };
  category?: string;
  nlpScore?: number;
  qualityScore?: number;
  isEmbeddable?: boolean;
  detectedAmbiguities?: { original: string, suggestion: string, issue: string, severity: string }[];
}

const AdminPendingPolicies: React.FC = () => {
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/admin/policy/pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Error fetching policies', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleApprove = async (docId: string) => {
    setActionLoading(docId);
    setMessage(null);
    
    try {
      const response = await fetch(`/api/admin/policy/${docId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage({type: 'success', text: `Policy approved and embedded successfully!`});
        fetchDocuments();
      } else {
        setMessage({type: 'error', text: data.message || 'Approval failed'});
      }
    } catch (error) {
      setMessage({type: 'error', text: 'An error occurred during approval.'});
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (docId: string) => {
    setActionLoading(docId + '_reject');
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/policy/${docId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setMessage({type: 'success', text: 'Policy rejected.'});
        fetchDocuments();
      } else {
        setMessage({type: 'error', text: 'Rejection failed'});
      }
    } catch (error) {
      setMessage({type: 'error', text: 'An error occurred during rejection.'});
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <FileText className="w-6 h-6 text-indigo-600" />
        Pending Policy Approvals
      </h2>
      
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 border ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500 font-medium">No pending policies to review.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {documents.map(doc => (
            <div key={doc._id} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{doc.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                        <span className="font-semibold text-slate-700">Org:</span> {doc.organization?.name}
                    </p>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                        <span className="font-semibold text-slate-700">By:</span> {doc.uploadedBy?.name}
                    </p>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                        <span className="font-semibold text-slate-700">Date:</span> {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a 
                    href={`http://localhost:3000${doc.fileUrl}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 font-medium text-sm transition-colors flex items-center gap-2"
                  >
                    View Original PDF
                  </a>
                  <Link
                    to={`/admin/policy/${doc._id}/review`}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-sm transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Zap className="w-4 h-4 fill-white" />
                    Open Review Studio
                  </Link>
                </div>
              </div>

              {/* Quality Analysis Summary */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <h4 className="font-bold text-slate-800">AI Quality Analysis</h4>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded text-[10px] font-black uppercase tracking-wider">
                      {doc.category || 'Unknown'}
                    </span>
                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                      (doc.qualityScore || 0) >= 80 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      Quality: {doc.qualityScore || 0}%
                    </span>
                  </div>
                </div>

                {!doc.isEmbeddable ? (
                    <div className="bg-red-100/50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-red-800 uppercase tracking-tight mb-1">NEEDS REFINEMENT</p>
                            <p className="text-sm text-red-700/80 leading-relaxed">
                                This document contains critical ambiguities or vague phrasing that prevents it from being approved. 
                                <Link to={`/admin/policy/${doc._id}/review`} className="ml-1 font-bold underline hover:text-red-900 text-red-800 transition-colors">
                                    Click here to fix these issues in the Review Studio.
                                </Link>
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-green-100/50 border border-green-200 p-4 rounded-lg flex items-start gap-3">
                         <div className="w-2 h-2 bg-green-500 rounded-full mt-2 shrink-0 animate-pulse"></div>
                         <div>
                            <p className="text-xs font-bold text-green-800 uppercase tracking-tight mb-1">READY FOR AI</p>
                            <p className="text-sm text-green-700/80 leading-relaxed">
                                High-quality policy detected. All critical ambiguities have been resolved or were not present.
                            </p>
                         </div>
                    </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button
                  onClick={() => handleReject(doc._id)}
                  disabled={actionLoading !== null}
                  className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all font-bold text-sm disabled:opacity-50 flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  {actionLoading === doc._id + '_reject' ? 'Rejecting...' : 'Reject Policy'}
                </button>
                <button
                  onClick={() => handleApprove(doc._id)}
                  disabled={actionLoading !== null || !doc.isEmbeddable}
                  className={`px-8 py-2.5 rounded-lg transition-all font-bold text-sm flex items-center gap-2 shadow-sm ${
                    !doc.isEmbeddable 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none' 
                    : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg active:scale-95'
                  }`}
                >
                  {actionLoading === doc._id ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : <ExternalLink className="w-4 h-4" />}
                  Approve & Embed for AI
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPendingPolicies;
