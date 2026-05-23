import mongoose from 'mongoose';

const allowedStatuses = ['Open', 'Closed', 'Resolved'];

const EscalationRequestSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    status: { type: String, enum: allowedStatuses, default: 'Open' },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },

    // short text about the conversation / escalation
    conversationSummary: { type: String, trim: true },

    // who changed status and when
    statusHistory: [
      {
        status: { type: String },
        changedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'statusHistory.changedByModel' },
        changedByModel: { type: String, enum: ['Staff', 'User'] },
        note: { type: String },
        changedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

EscalationRequestSchema.index({ orgId: 1, createdAt: -1 });
EscalationRequestSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.model('EscalationRequest', EscalationRequestSchema);
