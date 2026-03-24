import React, { useState, useEffect } from 'react';

interface PolicyDocument {
  _id: string;
  title: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  fileUrl: string;
  createdAt: string;
  organization: { name: string };
  uploadedBy: { name: string, email: string };
}

const AdminPendingPolicies: React.FC = () => {
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [correctionFiles, setCorrectionFiles] = useState<{ [key: string]: File }>({});
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
    
    const formData = new FormData();
    if (correctionFiles[docId]) {
      formData.append('pdf_file', correctionFiles[docId]);
    }

    try {
      const response = await fetch(`/api/admin/policy/${docId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage({type: 'success', text: `Policy approved. AI Backend stored vectors in ${data.aiResult?.namespace}`});
        fetchDocuments();
        const updatedFiles = {...correctionFiles};
        delete updatedFiles[docId];
        setCorrectionFiles(updatedFiles);
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

  const handleFileChange = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCorrectionFiles({
        ...correctionFiles,
        [docId]: e.target.files[0]
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-2xl font-semibold mb-6">Pending Policy Approvals</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : documents.length === 0 ? (
        <p className="text-slate-500">No pending policies to review.</p>
      ) : (
        <div className="space-y-6">
          {documents.map(doc => (
            <div key={doc._id} className="border border-slate-200 rounded-lg p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium">{doc.title}</h3>
                  <p className="text-sm text-slate-500">Organization: {doc.organization?.name}</p>
                  <p className="text-sm text-slate-500">Uploaded by: {doc.uploadedBy?.name} ({doc.uploadedBy?.email})</p>
                  <p className="text-sm text-slate-500">Date: {new Date(doc.createdAt).toLocaleDateString()}</p>
                </div>
                <a 
                  href={`http://localhost:3000${doc.fileUrl}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 font-medium text-sm transition-colors"
                >
                  View Original PDF
                </a>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">Upload Corrected PDF (Optional)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={(e) => handleFileChange(doc._id, e)} 
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button 
                  onClick={() => handleApprove(doc._id)}
                  disabled={actionLoading !== null}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium text-sm transition-colors shadow-sm"
                >
                  {actionLoading === doc._id ? 'Approving & Embedding...' : (correctionFiles[doc._id] ? 'Approve with Correction' : 'Approve Original')}
                </button>
                <button 
                  onClick={() => handleReject(doc._id)}
                  disabled={actionLoading !== null}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 disabled:opacity-50 font-medium text-sm transition-colors"
                >
                  {actionLoading === doc._id + '_reject' ? 'Rejecting...' : 'Reject'}
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
