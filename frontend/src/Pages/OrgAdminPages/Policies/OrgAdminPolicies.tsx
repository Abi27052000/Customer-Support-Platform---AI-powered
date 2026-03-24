import React, { useState, useEffect } from 'react';

interface PolicyDocument {
  _id: string;
  title: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  fileUrl: string;
  createdAt: string;
}

const OrgAdminPolicies: React.FC = () => {
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/org-admin/policy', {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setUploading(true);
    setMessage('');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('pdf_file', file);

    try {
      const response = await fetch('/api/org-admin/policy/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage('Policy uploaded successfully!');
        setTitle('');
        setFile(null);
        fetchDocuments();
      } else {
        setMessage(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file', error);
      setMessage('An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h2 className="text-2xl font-semibold mb-6">AI Policies</h2>
      
      <div className="mb-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="text-lg font-medium mb-4">Upload New Policy</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Policy Title</label>
            <input 
              type="text" 
              required
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className="w-full px-4 py-2 border rounded-md focus:ring-slate-500 focus:border-slate-500"
              placeholder="e.g. Employee Handbook 2026"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">PDF Document</label>
            <input 
              type="file" 
              required
              accept="application/pdf"
              onChange={handleFileChange} 
              className="w-full px-4 py-2 border rounded-md focus:ring-slate-500 focus:border-slate-500 bg-white"
            />
          </div>
          <button 
            type="submit" 
            disabled={uploading || !file || !title}
            className={`px-4 py-2 text-white bg-slate-800 rounded-md hover:bg-slate-700 disabled:opacity-50`}
          >
            {uploading ? 'Uploading...' : 'Upload Policy'}
          </button>
          {message && <p className="text-sm mt-2 font-medium bg-green-50 text-green-700 p-2 rounded">{message}</p>}
        </form>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Uploaded Policies</h3>
        {loading ? (
          <p>Loading...</p>
        ) : documents.length === 0 ? (
          <p className="text-slate-500">No policies uploaded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="p-3 font-medium text-slate-600">Title</th>
                  <th className="p-3 font-medium text-slate-600">Status</th>
                  <th className="p-3 font-medium text-slate-600">Date</th>
                  <th className="p-3 font-medium text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc._id} className="border-b hover:bg-slate-50">
                    <td className="p-3">{doc.title}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        doc.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-3">{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td className="p-3">
                      <a href={`http://localhost:3000${doc.fileUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm">
                        View File
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgAdminPolicies;
