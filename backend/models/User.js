import mongoose from 'mongoose';

const allowedRoles = ['user', 'organization_staff', 'organization_admin', 'admin'];

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: allowedRoles, default: 'user' },
    // orgId is used for staff and org_admin (single org). Users use UserOrg junction.
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: false },
  },
  { timestamps: true }
);

export default mongoose.model('User', UserSchema);
