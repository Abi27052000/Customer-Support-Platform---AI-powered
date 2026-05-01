import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    adminName: { type: String, required: true, trim: true },
    adminEmail: { type: String, required: true, lowercase: true, trim: true },
    services: {
      aiChat: { type: Boolean, default: false },
      aiVoice: { type: Boolean, default: false },
      aiInsights: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Organization', OrganizationSchema);
