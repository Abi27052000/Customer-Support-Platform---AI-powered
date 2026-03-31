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
  nlpScore: {
    type: Number,
    default: 0
  },
  qualityScore: {
    type: Number,
    default: 100
  },
  isEmbeddable: {
    type: Boolean,
    default: false
  },
  category: {
    type: String
  },
  detectedAmbiguities: [{
    original: String,
    suggestion: String,
    context: String,
    issue: String,
    severity: String
  }],
  fixedTextContent: {
    type: String
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
