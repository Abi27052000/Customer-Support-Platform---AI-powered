import React, { useRef, useState } from 'react';
import { FiCheckCircle, FiFileText, FiUploadCloud, FiXCircle } from 'react-icons/fi';
import { useAuth } from '../../../Context/AuthContext';
import { ragPdfApi, type RagPdfUploadResult } from '../../../services/ragPdfApi';

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isPdfFile = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const RagDocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RagPdfUploadResult | null>(null);

  const orgId = user?.orgId || '';

  const selectFile = (file: File | undefined) => {
    setResult(null);

    if (!file) return;

    if (!isPdfFile(file)) {
      setSelectedFile(null);
      setError('Only PDF files can be uploaded to the knowledge base.');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  const handleUpload = async () => {
    if (!orgId) {
      setError('Your organization ID was not found. Please sign in again as an organization admin.');
      return;
    }

    if (!selectedFile) {
      setError('Select a PDF file before uploading.');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const uploadResult = await ragPdfApi.uploadPdf(selectedFile, orgId);
      setResult(uploadResult);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload PDF.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Knowledge Base</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload organization PDFs for the RAG AI chat assistant.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <div className="mb-5">
            <label htmlFor="orgId" className="block text-sm font-semibold text-slate-700 mb-2">
              Organization ID
            </label>
            <input
              id="orgId"
              value={orgId || 'Not available'}
              readOnly
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
            />
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50'
            }`}
          >
            <div className="mx-auto w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FiUploadCloud size={28} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-800">Drop a PDF here</h2>
            <p className="mt-1 text-sm text-slate-500">or choose one from your computer</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-5 px-5 py-2.5 rounded-lg bg-[#2D2A8C] text-white text-sm font-semibold hover:bg-[#242170] disabled:bg-slate-300 transition-colors"
            >
              Choose PDF
            </button>
          </div>

          {selectedFile && (
            <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                  <FiFileText size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={uploading}
                className="text-sm text-slate-500 hover:text-red-600 disabled:text-slate-300"
              >
                Remove
              </button>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <FiXCircle className="mt-0.5 shrink-0" size={18} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !orgId}
              className="px-6 py-3 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Uploading PDF...' : 'Upload PDF'}
            </button>
          </div>
        </section>

        <aside className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800">Upload Result</h2>
          <p className="mt-1 text-sm text-slate-500">
            Successful uploads are embedded and stored in Pinecone for this organization.
          </p>

          {result ? (
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <FiCheckCircle size={20} />
                <span className="text-sm font-semibold">{result.message}</span>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-400">PDF</p>
                  <p className="font-medium text-slate-700 break-words">{result.pdf_filename}</p>
                </div>
                <div>
                  <p className="text-slate-400">Namespace</p>
                  <p className="font-mono text-slate-700">{result.namespace}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-slate-400">Chunks</p>
                    <p className="text-xl font-bold text-slate-800">{result.chunks_processed}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-slate-400">Vectors</p>
                    <p className="text-xl font-bold text-slate-800">{result.vectors_stored}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
              No PDF uploaded in this session yet.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default RagDocumentsPage;
