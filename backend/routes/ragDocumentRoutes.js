import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import RagDocument from '../models/RagDocument.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:8000';

const requireOrgId = (req, res) => {
  if (!req.user?.orgId) {
    res.status(400).json({ message: 'Admin organization not found' });
    return null;
  }

  return req.user.orgId;
};

const validatePdf = (file) => {
  if (!file) return 'PDF file is required';
  const isPdf =
    file.mimetype === 'application/pdf' ||
    file.originalname.toLowerCase().endsWith('.pdf');
  return isPdf ? null : 'Only PDF files are allowed';
};

const toDocumentResponse = (doc) => ({
  id: doc._id,
  orgId: doc.orgId,
  uploadedBy: doc.uploadedBy,
  originalName: doc.originalName,
  filename: doc.filename,
  mimeType: doc.mimeType,
  size: doc.size,
  documentId: doc.documentId,
  namespace: doc.namespace,
  vectorIds: doc.vectorIds,
  chunksProcessed: doc.chunksProcessed,
  vectorsStored: doc.vectorsStored,
  status: doc.status,
  lastIndexedAt: doc.lastIndexedAt,
  errorMessage: doc.errorMessage,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const uploadToAiBackend = async ({ file, organizationId, documentId }) => {
  const formData = new FormData();
  const blob = new Blob([file.buffer], { type: file.mimetype || 'application/pdf' });

  formData.append('pdf_file', blob, file.originalname);
  formData.append('organization_id', String(organizationId));
  formData.append('document_id', documentId);

  const response = await fetch(`${AI_BACKEND_URL}/api/pdf/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to process PDF' }));
    throw new Error(error.detail || error.message || 'Failed to process PDF');
  }

  return response.json();
};

const deleteFromAiBackend = async ({ organizationId, vectorIds }) => {
  if (!vectorIds?.length) return;

  const response = await fetch(`${AI_BACKEND_URL}/api/pdf/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organization_id: String(organizationId),
      vector_ids: vectorIds,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to delete PDF vectors' }));
    throw new Error(error.detail || error.message || 'Failed to delete PDF vectors');
  }
};

router.get('/', requireAuth, allowRoles(['organization_admin']), async (req, res) => {
  try {
    const orgId = requireOrgId(req, res);
    if (!orgId) return;

    const documents = await RagDocument.find({ orgId }).sort({ createdAt: -1 }).lean();
    return res.json({ documents: documents.map(toDocumentResponse) });
  } catch (err) {
    console.error('Failed to list RAG documents:', err);
    return res.status(500).json({ message: 'Failed to list RAG documents' });
  }
});

router.post('/', requireAuth, allowRoles(['organization_admin']), upload.single('pdf_file'), async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const validationError = validatePdf(req.file);
  if (validationError) return res.status(400).json({ message: validationError });

  const document = new RagDocument({
    orgId,
    uploadedBy: req.user._id,
    originalName: req.file.originalname,
    filename: req.file.originalname,
    mimeType: req.file.mimetype || 'application/pdf',
    size: req.file.size,
    documentId: crypto.randomUUID(),
    namespace: `org_${orgId}`,
    status: 'failed',
  });

  try {
    const result = await uploadToAiBackend({
      file: req.file,
      organizationId: orgId,
      documentId: document.documentId,
    });

    document.namespace = result.namespace;
    document.vectorIds = result.vector_ids || [];
    document.chunksProcessed = result.chunks_processed || 0;
    document.vectorsStored = result.vectors_stored || 0;
    document.status = 'ready';
    document.lastIndexedAt = new Date();
    document.errorMessage = undefined;
    await document.save();

    return res.status(201).json({ document: toDocumentResponse(document) });
  } catch (err) {
    document.errorMessage = err instanceof Error ? err.message : 'Failed to process PDF';
    await document.save();

    console.error('Failed to upload RAG document:', err);
    return res.status(500).json({
      message: document.errorMessage,
      document: toDocumentResponse(document),
    });
  }
});

router.delete('/:id', requireAuth, allowRoles(['organization_admin']), async (req, res) => {
  try {
    const orgId = requireOrgId(req, res);
    if (!orgId) return;

    const document = await RagDocument.findOne({ _id: req.params.id, orgId });
    if (!document) return res.status(404).json({ message: 'Document not found' });

    await deleteFromAiBackend({ organizationId: orgId, vectorIds: document.vectorIds });
    await document.deleteOne();

    return res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Failed to delete RAG document:', err);
    return res.status(500).json({ message: err instanceof Error ? err.message : 'Failed to delete document' });
  }
});

router.post('/:id/reindex', requireAuth, allowRoles(['organization_admin']), upload.single('pdf_file'), async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const validationError = validatePdf(req.file);
  if (validationError) return res.status(400).json({ message: validationError });

  const document = await RagDocument.findOne({ _id: req.params.id, orgId });
  if (!document) return res.status(404).json({ message: 'Document not found' });

  try {
    await deleteFromAiBackend({ organizationId: orgId, vectorIds: document.vectorIds });

    const result = await uploadToAiBackend({
      file: req.file,
      organizationId: orgId,
      documentId: document.documentId,
    });

    document.originalName = req.file.originalname;
    document.filename = req.file.originalname;
    document.mimeType = req.file.mimetype || 'application/pdf';
    document.size = req.file.size;
    document.namespace = result.namespace;
    document.vectorIds = result.vector_ids || [];
    document.chunksProcessed = result.chunks_processed || 0;
    document.vectorsStored = result.vectors_stored || 0;
    document.status = 'ready';
    document.lastIndexedAt = new Date();
    document.errorMessage = undefined;
    await document.save();

    return res.json({ document: toDocumentResponse(document) });
  } catch (err) {
    document.status = 'failed';
    document.errorMessage = err instanceof Error ? err.message : 'Failed to re-index PDF';
    await document.save();

    console.error('Failed to re-index RAG document:', err);
    return res.status(500).json({
      message: document.errorMessage,
      document: toDocumentResponse(document),
    });
  }
});

export default router;
