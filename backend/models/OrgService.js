import mongoose from 'mongoose';

const OrgServiceSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    service: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('OrgService', OrgServiceSchema);

