import express from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import OrgAdmin from '../models/OrgAdmin.js';
import PolicyDocument from '../models/PolicyDocument.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for optional corrected PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-corrected-' + file.originalname);
  }
});
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// ─── POST /api/admin/register-org ──────────────────────────────────────────
// Accessible only to platform main admin
router.post('/register-org', requireAuth, allowRoles(['admin']), async (req, res) => {
  try {
    const { orgName, addressLine1, adminUsername, adminPassword, services } = req.body;

    if (!orgName || !adminUsername || !adminPassword) {
      return res.status(400).json({ message: 'Organization name, admin email, and password are required' });
    }

    // Check if admin user already exists
    const existingUser = await User.findOne({ email: adminUsername });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this admin email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(adminPassword, salt);

    // 1. Create Organization
    const organization = new Organization({
      name: orgName,
      adminName: orgName + " Admin",
      adminEmail: adminUsername,
      services: {
        aiChat: services?.aiChat || false,
        aiVoice: services?.aiVoice || false,
        aiInsights: services?.aiInsights || false,
      }
    });
    const savedOrg = await organization.save();

    // 2. Create User (organization_admin)
    const user = new User({
      name: orgName + " Admin",
      email: adminUsername,
      password: hashed,
      role: 'organization_admin',
      orgId: savedOrg._id
    });
    await user.save();

    // 3. Create OrgAdmin record
    const orgAdmin = new OrgAdmin({
      adminName: orgName + " Admin",
      email: adminUsername,
      orgId: savedOrg._id
    });
    await orgAdmin.save();

    res.status(201).json({
      message: 'Organization registered successfully',
      organization: { id: savedOrg._id, name: savedOrg.name },
      admin: { id: user._id, email: user.email }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during organization registration' });
  }
});

// All routes under /api/admin are accessible only to admin role
router.get('/dashboard', requireAuth, allowRoles(['admin']), (req, res) => {
  res.json({ message: 'Welcome to admin dashboard', user: req.user });
});

// GET /api/admin/organizations - Fetch real organizations for Admin Panel
router.get('/organizations', requireAuth, allowRoles(['admin']), async (req, res) => {
  try {
    const orgs = await Organization.find().sort({ createdAt: -1 });
    res.json({ organizations: orgs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching organizations' });
  }
});

// PATCH /api/admin/organizations/:id - Update an organization
router.patch('/organizations/:id', requireAuth, allowRoles(['admin']), async (req, res) => {
  const { name, adminEmail, services } = req.body;
  try {
    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      { name, adminEmail, services },
      { new: true }
    );
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    res.json({ message: 'Organization updated successfully', organization: org });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating organization' });
  }
});

// DELETE /api/admin/organizations/:id - Delete an organization
router.delete('/organizations/:id', requireAuth, allowRoles(['admin']), async (req, res) => {
  try {
    const org = await Organization.findByIdAndDelete(req.params.id);
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    // Optional: Clean up related users if needed
    // await User.deleteMany({ orgId: req.params.id });

    res.json({ message: 'Organization deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting organization' });
  }
});

// --- POLICY VERIFICATION MANAGEMENT ---

// GET /api/admin/policy/pending - Get all pending policies
router.get('/policy/pending', requireAuth, allowRoles(['admin']), async (req, res) => {
  try {
    const documents = await PolicyDocument.find({ status: 'PENDING' })
      .populate('organization', 'name')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: 1 });
    res.json({ documents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching pending policies' });
  }
});

// Policy verification management handles the approval and rejection of submitted documents.
// Update policy with manual fixes (Review Studio)
router.patch('/policy/:id/fix', requireAuth, allowRoles(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { fixedTextContent, ambiguities } = req.body;

    const doc = await PolicyDocument.findById(id);
    if (!doc) return res.status(404).json({ message: 'Policy not found' });

    doc.fixedTextContent = fixedTextContent;
    doc.detectedAmbiguities = ambiguities;
    
    // Recalculate quality - if no high-severity ambiguities left, it's embeddable
    const criticalLeft = ambiguities.filter(a => a.severity === 'High').length;
    doc.isEmbeddable = criticalLeft === 0;
    
    await doc.save();
    res.json({ message: 'Policy fixes saved successfully', document: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error saving fixes' });
  }
});

// Approve policy - This triggers analysis and embedding
router.post('/policy/:id/approve', requireAuth, allowRoles(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await PolicyDocument.findById(id).populate('organization');
    if (!doc) return res.status(404).json({ message: 'Policy not found' });

    if (!doc.isEmbeddable) {
       return res.status(400).json({ message: 'Document still contains critical ambiguities. Please fix them in the Review Studio before approving.' });
    }

    const aiBackendUrl = process.env.AI_BACKEND_URL || 'http://127.0.0.1:8000';
    
    // Use the fixed text for embedding if available
    const formData = new FormData();
    formData.append('text', doc.fixedTextContent || "");
    formData.append('organization_id', doc.organization._id.toString());
    formData.append('filename', doc.fileUrl.split('/').pop());

    const response = await fetch(`${aiBackendUrl}/api/pdf/analysis/process-fixed`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ message: errorData.detail || 'AI Backend processing failed' });
    }

    const result = await response.json();

    doc.status = 'APPROVED';
    doc.verifiedBy = req.user._id;
    doc.pineconeNamespace = result.namespace || `org_${doc.organization._id.toString()}`;
    await doc.save();

    res.json({ message: 'Policy document approved and securely embedded by AI Backend', document: doc, aiResult: result });
  } catch (err) {
    console.error(err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: err.message || 'Server error approving policy' });
  }
});

// POST /api/admin/policy/:id/reject - Reject a policy document
router.post('/policy/:id/reject', requireAuth, allowRoles(['admin']), async (req, res) => {
  try {
    const doc = await PolicyDocument.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Policy document not found' });

    if (doc.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only PENDING documents can be rejected' });
    }

    doc.status = 'REJECTED';
    doc.verifiedBy = req.user._id;
    await doc.save();

    res.json({ message: 'Policy document rejected', document: doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error rejecting policy' });
  }
});

export default router;

