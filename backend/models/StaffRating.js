import mongoose from 'mongoose';

const sourceTypes = ['ticket', 'chat'];

const StaffRatingSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    sourceType: { type: String, enum: sourceTypes, required: true },
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'EscalationRequest' },
    chatSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

StaffRatingSchema.index({ orgId: 1, staffId: 1, createdAt: -1 });
StaffRatingSchema.index(
  { customerId: 1, requestId: 1 },
  { unique: true, partialFilterExpression: { requestId: { $exists: true } } }
);
StaffRatingSchema.index(
  { customerId: 1, chatSessionId: 1 },
  { unique: true, partialFilterExpression: { chatSessionId: { $exists: true } } }
);

export default mongoose.model('StaffRating', StaffRatingSchema);
