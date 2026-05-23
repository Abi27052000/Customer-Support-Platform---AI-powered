import mongoose from 'mongoose';

const StaffWorkloadSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', unique: true, required: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    activeRequests: { type: Number, default: 0 },
    closedToday: { type: Number, default: 0 },
    lastAssignedAt: { type: Date }
  },
  { timestamps: true }
);

StaffWorkloadSchema.index({ orgId: 1, activeRequests: 1, lastAssignedAt: 1 });

export default mongoose.model('StaffWorkload', StaffWorkloadSchema);
