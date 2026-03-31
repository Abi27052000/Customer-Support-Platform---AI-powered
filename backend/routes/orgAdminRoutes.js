import express from 'express';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import User from '../models/User.js';
import UserOrg from '../models/UserOrg.js';
import Staff from '../models/Staff.js';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import PolicyDocument from '../models/PolicyDocument.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { analyzePolicyText, verifyDocumentRelevance } from '../services/geminiService.js';
import { generateStandardPdf } from '../utils/pdfGenerator.js';
const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
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

router.get('/dashboard', requireAuth, allowRoles(['organization_admin']), (req, res) => {
  res.json({ message: 'Welcome to organization admin dashboard', user: req.user });
});

// GET /api/org-admin/users - Fetch only service users (role: 'user') for this org
router.get('/users', requireAuth, allowRoles(['organization_admin']), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    if (!orgId) return res.status(400).json({ message: 'Admin organization not found' });

    // Fetch memberships for this org and populate the user details
    const memberships = await UserOrg.find({ orgId }).populate({
      path: 'userId',
      match: { role: 'user' },
      select: '-password'
    });

    // Extract only those where the user actually has role 'user'
    const users = memberships
      .map(m => m.userId)
      .filter(u => u !== null);

    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

// PATCH /api/org-admin/users/:id - Update name of a service user
router.patch('/users/:id', requireAuth, allowRoles(['organization_admin']), async (req, res) => {
  const { name } = req.body;
  try {
    const orgId = req.user.orgId;
    const userId = req.params.id;

    // Security check: is this user in the admin's org?
    const isMember = await UserOrg.findOne({ userId, orgId });
    if (!isMember) return res.status(403).json({ message: 'User not found in your organization' });

    const user = await User.findById(userId);
    if (!user || user.role !== 'user') {
      return res.status(403).json({ message: 'Only service users can be managed here' });
    }

    user.name = name || user.name;
    await user.save();

    res.json({ message: 'User updated successfully', user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

// DELETE /api/org-admin/users/:id - Remove user from this organization
router.delete('/users/:id', requireAuth, allowRoles(['organization_admin']), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const userId = req.params.id;

    // Security check
    const isMember = await UserOrg.findOne({ userId, orgId });
    if (!isMember) return res.status(403).json({ message: 'User not found in your organization' });

    const user = await User.findById(userId);
    if (!user || user.role !== 'user') {
      return res.status(403).json({ message: 'Only service users can be removed from here' });
    }

    // Remove membership
    await UserOrg.deleteOne({ userId, orgId });

    res.json({ message: 'User removed from organization' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error removing user' });
  }
});

// --- STAFF MANAGEMENT ---

// GET /api/org-admin/staff - Fetch all staff in the admin's organization
router.get('/staff', requireAuth, allowRoles(['organization_admin']), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    if (!orgId) return res.status(400).json({ message: 'Admin organization not found' });

    const staff = await User.find({ orgId, role: 'organization_staff' }).select('-password');
    res.json({ staff });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching staff' });
  }
});

// POST /api/org-admin/staff - Create a new staff member
router.post('/staff', requireAuth, allowRoles(['organization_admin']), async (req, res) => {
  const { name, email, password, role } = req.body; // role can be customized if needed, defaults to organization_staff
  try {
    const orgId = req.user.orgId;
    if (!orgId) return res.status(400).json({ message: 'Admin organization not found' });

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'organization_staff',
      orgId
    });
    await user.save();

    // Also create Staff record for consistency with current architecture
    const staff = new Staff({
      orgId,
      email,
      name
    });
    await staff.save();

    res.status(201).json({ message: 'Staff created successfully', staff: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating staff' });
  }
});

// PATCH /api/org-admin/staff/:id - Update staff details
router.patch('/staff/:id', requireAuth, allowRoles(['organization_admin']), async (req, res) => {
  const { name, email } = req.body;
  try {
    const orgId = req.user.orgId;
    const staffId = req.params.id;

    const user = await User.findOne({ _id: staffId, orgId, role: 'organization_staff' });
    if (!user) return res.status(404).json({ message: 'Staff member not found' });

    const oldEmail = user.email;

    user.name = name || user.name;
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email already in use' });
      user.email = email;
    }
    await user.save();

    // Update Staff record too
    await Staff.findOneAndUpdate({ orgId, email: oldEmail }, { name: user.name, email: user.email });

    res.json({ message: 'Staff updated successfully', staff: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating staff' });
  }
});

// DELETE /api/org-admin/staff/:id - Remove staff member
router.delete('/staff/:id', requireAuth, allowRoles(['organization_admin']), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const staffId = req.params.id;

    const user = await User.findOne({ _id: staffId, orgId, role: 'organization_staff' });
    if (!user) return res.status(404).json({ message: 'Staff member not found' });

    const email = user.email;

    await User.deleteOne({ _id: staffId });
    await Staff.deleteOne({ orgId, email });

    res.json({ message: 'Staff member removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error removing staff' });
  }
});

// --- POLICY MANAGEMENT ---

// POST /api/org-admin/policy/upload - Upload a new policy document
router.post('/policy/upload', requireAuth, allowRoles(['organization_admin']), upload.single('pdf_file'), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    if (!orgId) return res.status(400).json({ message: 'Admin organization not found' });
    
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    const { title } = req.body;
    if (!title) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Document title is required' });
    }

    // Extract text from the uploaded PDF
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    const extractedText = pdfData.text;

    // Verify Relevance
    const relevance = await verifyDocumentRelevance(extractedText);
    if (!relevance.isRelevant) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ message: `Document rejected: ${relevance.reason}` });
    }

    // Send to Gemini for analysis
    const aiSuggestions = await analyzePolicyText(extractedText);

    const doc = new PolicyDocument({
      title,
      organization: orgId,
      uploadedBy: req.user._id,
      fileUrl: `/uploads/${req.file.filename}`,
      status: 'PENDING',
      analysisStatus: 'AWAITING_REVIEW',
      extractedText,
      aiSuggestions
    });
    await doc.save();

    res.status(201).json({ message: 'Policy document uploaded and analyzed successfully', document: doc });
  } catch (err) {
    console.error(err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    let errorMessage = err.message || 'Server error uploading policy';
    if (errorMessage.includes('bad XRef entry') || errorMessage.includes('InvalidPDFException')) {
      errorMessage = "The uploaded PDF has a non-standard or corrupted structure. Please open the file, 'Print to PDF' to create a clean copy, and try uploading again.";
    }
    
    res.status(500).json({ message: errorMessage });
  }
});

// POST /api/org-admin/policy/:id/finalize - Finalize a policy and send to AI Backend
router.post('/policy/:id/finalize', requireAuth, allowRoles(['organization_admin']), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const doc = await PolicyDocument.findOne({ _id: req.params.id, organization: orgId });
    if (!doc) return res.status(404).json({ message: 'Policy document not found' });

    if (doc.analysisStatus !== 'AWAITING_REVIEW') {
      return res.status(400).json({ message: 'Document is not awaiting review' });
    }

    const { finalizedText } = req.body;
    if (!finalizedText) {
      return res.status(400).json({ message: 'Finalized text is required' });
    }

    // Generate new PDF
    const newFilename = Date.now() + '-finalized-' + doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
    const uploadDir = path.join(process.cwd(), 'uploads');
    const newFilePath = path.join(uploadDir, newFilename);
    await generateStandardPdf(finalizedText, doc.title, newFilePath);

    const oldFileUrl = doc.fileUrl;
    doc.fileUrl = `/uploads/${newFilename}`;
    doc.extractedText = finalizedText;
    doc.analysisStatus = 'COMPLETED';
    
    // Auto-approve and send to AI backend, bypassing Platform Admin
    const fileBuffer = fs.readFileSync(newFilePath);
    const pdfBlob = new Blob([fileBuffer], { type: 'application/pdf' });
    
    const formData = new FormData();
    formData.append('pdf_file', pdfBlob, newFilename);
    formData.append('organization_id', doc.organization.toString());

    const aiBackendUrl = process.env.AI_BACKEND_URL || 'http://127.0.0.1:8000';
    
    const response = await fetch(`${aiBackendUrl}/api/pdf/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Backend Error:', errorText);
      return res.status(500).json({ message: 'AI Backend failed to process the document', error: errorText });
    }

    const result = await response.json();

    doc.status = 'APPROVED';
    doc.pineconeNamespace = result.namespace || `org_${doc.organization.toString()}`;
    await doc.save();

    // Now securely remove the original un-analyzed PDF after DB safely updates
    if (oldFileUrl && fs.existsSync(path.join(process.cwd(), oldFileUrl))) {
       fs.unlinkSync(path.join(process.cwd(), oldFileUrl)); 
    }

    res.json({ message: 'Policy document finalized and securely embedded by AI Backend', document: doc, aiResult: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error finalizing policy' });
  }
});

// GET /api/org-admin/policy - Get org's policy documents
router.get('/policy', requireAuth, allowRoles(['organization_admin']), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    if (!orgId) return res.status(400).json({ message: 'Admin organization not found' });

    const documents = await PolicyDocument.find({ organization: orgId }).sort({ createdAt: -1 });
    res.json({ documents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching policy documents' });
  }
});

// DELETE /api/org-admin/policy/:id - Delete a policy document
router.delete('/policy/:id', requireAuth, allowRoles(['organization_admin']), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const doc = await PolicyDocument.findOneAndDelete({ _id: req.params.id, organization: orgId });
    if (!doc) {
      return res.status(404).json({ message: 'Policy document not found' });
    }
    
    // Optional: Also delete the file from the uploads folder
    if (doc.fileUrl && fs.existsSync(path.join(process.cwd(), doc.fileUrl))) {
       fs.unlinkSync(path.join(process.cwd(), doc.fileUrl));
    }

    res.json({ message: 'Policy deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting policy' });
  }
});

export default router;

