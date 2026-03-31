import mongoose from 'mongoose';

const policyDocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // or OrgAdmin depending on how users are structured
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  analysisStatus: {
    type: String,
    enum: ['PENDING_ANALYSIS', 'AWAITING_REVIEW', 'COMPLETED'],
    default: 'PENDING_ANALYSIS'
  },
  extractedText: {
    type: String
  },
  aiSuggestions: {
    type: mongoose.Schema.Types.Mixed
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // For Platform Admin
  },
  pineconeNamespace: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model('PolicyDocument', policyDocumentSchema);
