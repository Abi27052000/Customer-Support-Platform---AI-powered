import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import OrgAdmin from '../models/OrgAdmin.js';
import Staff from '../models/Staff.js';
import Organization from '../models/Organization.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, orgId, orgName, adminName } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    // If an orgId is provided, validate its format and existence
    let finalOrgId = orgId;
    if (orgId) {
      if (!mongoose.Types.ObjectId.isValid(orgId)) return res.status(400).json({ message: 'Invalid orgId format' });
      const existingOrg = await Organization.findById(orgId);
      if (!existingOrg) return res.status(400).json({ message: 'Organization not found for provided orgId' });
      finalOrgId = existingOrg._id;
    }

    // Role-specific validation
    if (role === 'organization_admin') {
      if (!adminName) return res.status(400).json({ message: 'adminName is required for organization_admin' });
      if (!finalOrgId && !orgName) return res.status(400).json({ message: 'Either orgId or orgName is required for organization_admin' });
    }
    if (role === 'organization_staff') {
      if (!finalOrgId) return res.status(400).json({ message: 'orgId is required for organization_staff and must be a valid existing organization id' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // If orgName provided for organization_admin, create Organization first
    let createdOrganization = null;
    if (role === 'organization_admin' && orgName && !finalOrgId) {
      try {
        const org = new Organization({ name: orgName, adminName, adminEmail: email, adminPassword: hashed });
        createdOrganization = await org.save();
        finalOrgId = createdOrganization._id;
      } catch (err) {
        console.error('Failed to create Organization:', err);
        return res.status(500).json({ message: 'Failed to create organization' });
      }
    }

    const userData = { email, password: hashed, role };
    if (finalOrgId) userData.orgId = finalOrgId;
    if (adminName) userData.adminName = adminName;

    const user = new User(userData);
    await user.save();

    // Create role-specific documents in their collections
    let roleRecord = null;
    if (role === 'organization_admin') {
      // Create OrgAdmin document
      try {
        const orgAdmin = new OrgAdmin({ adminName, email, orgId: finalOrgId, password: hashed });
        await orgAdmin.save();
        roleRecord = { type: 'OrgAdmin', id: orgAdmin._id, adminName: orgAdmin.adminName, email: orgAdmin.email, orgId: orgAdmin.orgId };
      } catch (err) {
        // If OrgAdmin creation fails, remove the previously created User (and Organization if created) to keep DB consistent
        console.error('Failed to create OrgAdmin record, rolling back user creation', err);
        await User.findByIdAndDelete(user._id).catch(() => {});
        if (createdOrganization) await Organization.findByIdAndDelete(createdOrganization._id).catch(() => {});
        return res.status(500).json({ message: 'Failed to create organization admin record' });
      }
    } else if (role === 'organization_staff') {
      try {
        const staff = new Staff({ orgId: finalOrgId, email, password: hashed });
        await staff.save();
        roleRecord = { type: 'Staff', id: staff._id, email: staff.email, orgId: staff.orgId };
      } catch (err) {
        console.error('Failed to create Staff record, rolling back user creation', err);
        await User.findByIdAndDelete(user._id).catch(() => {});
        return res.status(500).json({ message: 'Failed to create staff record' });
      }
    }

    const userResponse = { id: user._id, email: user.email, role: user.role, orgId: user.orgId, adminName: user.adminName };

    return res.status(201).json({ message: 'User registered successfully', user: userResponse, roleRecord });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = { id: user._id, role: user.role, email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({ token, user: { email: user.email, role: user.role, orgId: user.orgId, adminName: user.adminName } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  // With stateless JWT we can't invalidate token server-side easily without a store.
  // Client should delete token. Return success for UI convenience.
  return res.json({ message: 'Logged out' });
});

// GET /api/auth/session
router.get('/session', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Invalid token' });

    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

export default router;
