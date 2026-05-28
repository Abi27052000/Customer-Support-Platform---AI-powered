import React, { useEffect, useRef, useState } from 'react';
import { FiCheckCircle, FiFileText, FiRefreshCw, FiTrash2, FiUploadCloud, FiXCircle } from 'react-icons/fi';
import { useAuth } from '../../../Context/AuthContext';
import { ragPdfApi, type RagDocument } from '../../../services/ragPdfApi';

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (value?: string) => {
  if (!value) return 'Not indexed';
  return new Date(value).toLocaleString();
};

const isPdfFile = (file: File) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const RagDocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reindexInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reindexTargetId, setReindexTargetId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const orgId = user?.orgId || '';

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const loadedDocuments = await ragPdfApi.listDocuments();
      setDocuments(loadedDocuments);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  const selectFile = (file: File | undefined) => {
    setSuccess(null);

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
    setSuccess(null);

    try {
      const document = await ragPdfApi.uploadPdf(selectedFile);
      setDocuments((prev) => [document, ...prev]);
      setSuccess(`${document.originalName} was uploaded and indexed successfully.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload PDF.');
      await loadDocuments();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (document: RagDocument) => {
    if (!window.confirm(`Delete ${document.originalName} from the knowledge base?`)) return;

    setBusyDocumentId(document.id);
    setError(null);
    setSuccess(null);

    try {
      await ragPdfApi.deleteDocument(document.id);
      setDocuments((prev) => prev.filter((item) => item.id !== document.id));
      setSuccess(`${document.originalName} was deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete PDF.');
    } finally {
      setBusyDocumentId(null);
    }
  };

  const openReindexPicker = (documentId: string) => {
    setReindexTargetId(documentId);
    reindexInputRef.current?.click();
  };

  const handleReindexFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const targetId = reindexTargetId;
    event.target.value = '';

    if (!targetId || !file) return;

    if (!isPdfFile(file)) {
      setError('Only PDF files can be used for re-indexing.');
      setReindexTargetId(null);
      return;
    }

    setBusyDocumentId(targetId);
    setError(null);
    setSuccess(null);

    try {
      const updatedDocument = await ragPdfApi.reindexDocument(targetId, file);
      setDocuments((prev) =>
        prev.map((item) => (item.id === targetId ? updatedDocument : item))
      );
      setSuccess(`${updatedDocument.originalName} was re-indexed successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to re-index PDF.');
      await loadDocuments();
    } finally {
      setBusyDocumentId(null);
      setReindexTargetId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Knowledge Base</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload and manage organization PDFs for the RAG AI chat and voice assistants.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
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

          {success && (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
              <FiCheckCircle className="mt-0.5 shrink-0" size={18} />
              <p className="text-sm">{success}</p>
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

        <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 min-w-0">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Uploaded PDFs</h2>
              <p className="text-sm text-slate-500">Documents indexed for this organization.</p>
            </div>
            <button
              type="button"
              onClick={() => void loadDocuments()}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:text-slate-300"
            >
              Refresh
            </button>
          </div>

          <input
            ref={reindexInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleReindexFileChange}
            className="hidden"
          />

          {loading ? (
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
              No PDFs uploaded through this page yet.
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((document) => (
                <div key={document.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FiFileText className="text-slate-500 shrink-0" size={20} />
                        <h3 className="font-semibold text-slate-800 truncate">{document.originalName}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          document.status === 'ready'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {document.status}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-slate-400">Uploaded</p>
                          <p className="text-slate-700">{formatDate(document.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Last indexed</p>
                          <p className="text-slate-700">{formatDate(document.lastIndexedAt)}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Chunks / vectors</p>
                          <p className="text-slate-700">{document.chunksProcessed} / {document.vectorsStored}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Size</p>
                          <p className="text-slate-700">{formatFileSize(document.size)}</p>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-slate-500">
                        <span className="font-semibold">Namespace:</span>{' '}
                        <span className="font-mono">{document.namespace}</span>
                      </div>
                      {document.errorMessage && (
                        <p className="mt-2 text-sm text-red-600">{document.errorMessage}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openReindexPicker(document.id)}
                        disabled={busyDocumentId === document.id}
                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:text-slate-300"
                        title="Re-index"
                      >
                        <FiRefreshCw size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(document)}
                        disabled={busyDocumentId === document.id}
                        className="p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 disabled:text-slate-300"
                        title="Delete"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default RagDocumentsPage;
