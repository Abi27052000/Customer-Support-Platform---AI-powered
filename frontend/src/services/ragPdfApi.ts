export interface RagDocument {
  id: string;
  orgId: string;
  uploadedBy: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  documentId: string;
  namespace: string;
  vectorIds: string[];
  chunksProcessed: number;
  vectorsStored: number;
  status: 'ready' | 'failed';
  lastIndexedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const buildPdfFormData = (file: File) => {
  const formData = new FormData();
  formData.append('pdf_file', file);
  return formData;
};

const parseError = async (response: Response, fallback: string) => {
  const error = await response.json().catch(() => ({ message: fallback }));
  return error.message || error.detail || fallback;
};

export const ragPdfApi = {
  async listDocuments(): Promise<RagDocument[]> {
    const response = await fetch('/api/org-admin/rag-documents', {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to load RAG documents'));
    }

    const data = await response.json();
    return data.documents;
  },

  async uploadPdf(file: File): Promise<RagDocument> {
    const response = await fetch('/api/org-admin/rag-documents', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: buildPdfFormData(file),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to upload PDF'));
    }

    const data = await response.json();
    return data.document;
  },

  async deleteDocument(documentId: string): Promise<void> {
    const response = await fetch(`/api/org-admin/rag-documents/${documentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to delete PDF'));
    }
  },

  async reindexDocument(documentId: string, file: File): Promise<RagDocument> {
    const response = await fetch(`/api/org-admin/rag-documents/${documentId}/reindex`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: buildPdfFormData(file),
    });

    if (!response.ok) {
      throw new Error(await parseError(response, 'Failed to re-index PDF'));
    }

    const data = await response.json();
    return data.document;
  },
};
