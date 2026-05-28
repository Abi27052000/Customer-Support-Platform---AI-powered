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
    premiumServices: {
      callTranscription: { type: Boolean, default: false },
      callSummarization: { type: Boolean, default: false },
    },
    subscriptionStatus: { 
      type: String, 
      enum: ['none', 'pending_payment', 'active', 'past_due', 'canceled'], 
      default: 'none' 
    },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Organization', OrganizationSchema);
