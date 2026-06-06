import mongoose from 'mongoose';

const allowedStatuses = ['Open', 'Closed', 'Resolved'];
const allowedMessageRoles = ['customer', 'staff', 'system', 'unknown'];

const ChatMessageSchema = new mongoose.Schema(
  {
    author: { type: String, trim: true },
    role: { type: String, enum: allowedMessageRoles, default: 'unknown' },
    message: { type: String, required: true, trim: true },
    sentAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ChatSessionSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, trim: true, unique: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    status: { type: String, enum: allowedStatuses, default: 'Open' },
    messages: [ChatMessageSchema],
    lastMessageAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

ChatSessionSchema.index({ orgId: 1, staffId: 1, createdAt: -1 });
ChatSessionSchema.index({ staffId: 1, status: 1 });

export default mongoose.model('ChatSession', ChatSessionSchema);
