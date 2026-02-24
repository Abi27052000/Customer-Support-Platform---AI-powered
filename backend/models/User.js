import mongoose from 'mongoose';

const allowedRoles = ['user', 'organization_staff', 'organization_admin', 'admin'];

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: allowedRoles, default: 'user' },
    // Optional organization linkage / admin name for organization-related users
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: false },
    adminName: { type: String, required: false, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
