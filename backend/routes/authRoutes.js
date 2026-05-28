import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import OrgAdmin from '../models/OrgAdmin.js';
import Staff from '../models/Staff.js';
import Organization from '../models/Organization.js';
import UserOrg from '../models/UserOrg.js';

const router = express.Router();

// ─── POST /api/auth/register ───────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, orgId, orgName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'User already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // ── ADMIN ──
    if (role === 'admin') {
      // Only allow if no admin exists yet (first admin only)
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount >= 2) {
        return res.status(403).json({ message: 'Maximum admin accounts reached' });
      }
      const user = new User({ name, email, password: hashed, role: 'admin' });
      await user.save();
      return res.status(201).json({ message: 'Admin registered successfully', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    }

    // ── ORGANIZATION ADMIN ──
    if (role === 'organization_admin') {
      if (!orgName) return res.status(400).json({ message: 'Organization name is required for org admin' });

      // Create organization
      const org = new Organization({ name: orgName, adminName: name, adminEmail: email });
      const savedOrg = await org.save();

      // Create user
      const user = new User({ name, email, password: hashed, role: 'organization_admin', orgId: savedOrg._id });
      await user.save();

      // Create OrgAdmin record
      const orgAdmin = new OrgAdmin({ adminName: name, email, orgId: savedOrg._id });
      await orgAdmin.save();

      return res.status(201).json({
        message: 'Organization admin registered successfully',
        user: { id: user._id, name: user.name, email: user.email, role: user.role, orgId: savedOrg._id },
        organization: { id: savedOrg._id, name: savedOrg.name }
      });
    }

    // ── ORGANIZATION STAFF ──
    if (role === 'organization_staff') {
      if (!orgId) return res.status(400).json({ message: 'Organization ID is required for staff' });
      if (!mongoose.Types.ObjectId.isValid(orgId)) return res.status(400).json({ message: 'Invalid organization ID' });

      const org = await Organization.findById(orgId);
      if (!org) return res.status(400).json({ message: 'Organization not found' });

      const user = new User({ name, email, password: hashed, role: 'organization_staff', orgId: org._id });
      await user.save();

      const staff = new Staff({ orgId: org._id, email, name });
      await staff.save();

      return res.status(201).json({
        message: 'Staff registered successfully',
        user: { id: user._id, name: user.name, email: user.email, role: user.role, orgId: org._id }
      });
    }

    // ── USER (default) ──
    const user = new User({ name, email, password: hashed, role: 'user' });
    await user.save();

    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Determine redirect path based on role
    let redirectPath = '/';
    let orgs = [];

    if (user.role === 'admin') {
      redirectPath = '/admin';
    } else if (user.role === 'organization_admin') {
      redirectPath = '/org-admin';
    } else if (user.role === 'organization_staff') {
      redirectPath = '/staff';
    } else if (user.role === 'user') {
      // Get user's organizations
      const memberships = await UserOrg.find({ userId: user._id }).populate('orgId', 'name');
      orgs = memberships.map(m => ({ id: m.orgId._id, name: m.orgId.name }));

      if (orgs.length === 0) {
        redirectPath = '/org-picker';
      } else if (orgs.length === 1) {
        redirectPath = '/';
      } else {
        redirectPath = '/org-picker';
      }
    }

    // Create JWT
    const payload = { id: user._id, role: user.role, email: user.email, name: user.name };
    if (user.orgId) payload.orgId = user.orgId;
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, orgId: user.orgId },
      orgs,
      redirectPath
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST /api/auth/select-org ─────────────────────────────────────────────
// For users: select an org to work with (adds to UserOrg if not already joined)
router.post('/select-org', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'user') return res.status(403).json({ message: 'Only users can select organizations' });

    const { orgId } = req.body;
    if (!orgId || !mongoose.Types.ObjectId.isValid(orgId)) return res.status(400).json({ message: 'Valid organization ID is required' });

    const org = await Organization.findById(orgId);
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    // Add to UserOrg if not already a member
    await UserOrg.findOneAndUpdate(
      { userId: user._id, orgId: org._id },
      { userId: user._id, orgId: org._id },
      { upsert: true, new: true }
    );

    // Issue new token with orgId
    const payload = { id: user._id, role: user.role, email: user.email, name: user.name, orgId: org._id };
    const newToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token: newToken,
      organization: { id: org._id, name: org.name },
      redirectPath: '/'
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/auth/organizations ───────────────────────────────────────────
// Get all organizations (for org picker)
router.get('/organizations', async (req, res) => {
  try {
    const orgs = await Organization.find({}).select('name adminName createdAt');
    return res.json({ organizations: orgs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/auth/session ─────────────────────────────────────────────────
router.get('/session', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'Invalid token' });

    // For users, include org list
    let orgs = [];
    if (user.role === 'user') {
      const memberships = await UserOrg.find({ userId: user._id }).populate('orgId', 'name');
      orgs = memberships.map(m => ({ id: m.orgId._id, name: m.orgId.name }));
    }

    return res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, orgId: decoded.orgId || user.orgId },
      orgs
    });

  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// ─── POST /api/auth/logout ─────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  return res.json({ message: 'Logged out' });
});

export default router;
