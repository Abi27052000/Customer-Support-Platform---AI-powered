export interface RagPdfUploadResult {
  status: string;
  message: string;
  pdf_filename: string;
  organization_id: string;
  chunks_processed: number;
  vectors_stored: number;
  namespace: string;
}

const RAG_API_BASE_URL = 'http://localhost:8000/api';

export const ragPdfApi = {
  async uploadPdf(file: File, organizationId: string): Promise<RagPdfUploadResult> {
    const formData = new FormData();
    formData.append('pdf_file', file);
    formData.append('organization_id', organizationId);

    const response = await fetch(`${RAG_API_BASE_URL}/pdf/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to upload PDF' }));
      throw new Error(error.detail || error.message || 'Failed to upload PDF');
    }

    return response.json();
  },
};
