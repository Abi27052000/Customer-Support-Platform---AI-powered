import express from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import OrgAdmin from '../models/OrgAdmin.js';

const router = express.Router();

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

export default router;

