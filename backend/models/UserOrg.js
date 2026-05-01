import mongoose from 'mongoose';

const UserOrgSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    },
    { timestamps: true }
);

// Ensure a user can only join an org once
UserOrgSchema.index({ userId: 1, orgId: 1 }, { unique: true });

export default mongoose.model('UserOrg', UserOrgSchema);
