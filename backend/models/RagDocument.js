import mongoose from 'mongoose';

const allowedStatuses = ['ready', 'failed'];

const RagDocumentSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalName: { type: String, required: true, trim: true },
    filename: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    size: { type: Number, required: true, min: 0 },
    documentId: { type: String, required: true, trim: true, unique: true },
    namespace: { type: String, required: true, trim: true },
    vectorIds: [{ type: String, trim: true }],
    chunksProcessed: { type: Number, default: 0, min: 0 },
    vectorsStored: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: allowedStatuses, default: 'ready' },
    lastIndexedAt: { type: Date },
    errorMessage: { type: String, trim: true },
  },
  { timestamps: true }
);

RagDocumentSchema.index({ orgId: 1, createdAt: -1 });

export default mongoose.model('RagDocument', RagDocumentSchema);
