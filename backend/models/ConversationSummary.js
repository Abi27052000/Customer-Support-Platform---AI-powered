import mongoose from 'mongoose';

const allowedChannels = ['ai_chat', 'ai_voice'];
const allowedStatuses = ['Closed'];
const allowedEndedReasons = ['ended', 'escalated', 'cleared'];

const ConversationSummarySchema = new mongoose.Schema(
  {
    channel: { type: String, enum: allowedChannels, required: true },
    sessionId: { type: String, required: true, trim: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    status: { type: String, enum: allowedStatuses, default: 'Closed' },
    endedReason: { type: String, enum: allowedEndedReasons, required: true },
  },
  { timestamps: true }
);

ConversationSummarySchema.index({ orgId: 1, createdAt: -1 });
ConversationSummarySchema.index({ userId: 1, createdAt: -1 });
ConversationSummarySchema.index({ sessionId: 1, channel: 1 });

export default mongoose.model('ConversationSummary', ConversationSummarySchema);
