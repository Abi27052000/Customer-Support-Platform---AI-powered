import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    adminName: { type: String, required: true, trim: true },
    adminEmail: { type: String, required: true, lowercase: true, trim: true },
    adminPassword: { type: String, required: true }, // hashed password
  },
  { timestamps: true }
);

export default mongoose.model('Organization', OrganizationSchema);

