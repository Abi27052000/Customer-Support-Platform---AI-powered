import mongoose from 'mongoose';

const OrgAdminSchema = new mongoose.Schema(
  {
    adminName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  },
  { timestamps: true }
);

export default mongoose.model('OrgAdmin', OrgAdminSchema);
