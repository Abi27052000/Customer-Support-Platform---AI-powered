import express from 'express';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import Staff from '../models/Staff.js';

const router = express.Router();

router.get('/dashboard', requireAuth, allowRoles(['organization_staff']), (req, res) => {
  res.json({ message: 'Welcome to staff dashboard', user: req.user });
});

router.get('/me', requireAuth, allowRoles(['organization_staff']), async (req, res) => {
  try {
    const staff = await Staff.findOne({ orgId: req.user.orgId, email: req.user.email }).lean();
    if (!staff) return res.status(404).json({ message: 'Staff profile not found' });

    return res.json({
      staff: {
        id: staff._id,
        orgId: staff.orgId,
        name: staff.name,
        email: staff.email,
      },
    });
  } catch (err) {
    console.error('Failed to load staff profile:', err);
    return res.status(500).json({ message: 'Failed to load staff profile' });
  }
});

export default router;

