import mongoose from 'mongoose';

const StaffSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    name: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Staff', StaffSchema);
