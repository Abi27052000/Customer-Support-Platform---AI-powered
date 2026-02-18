import express from 'express';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = express.Router();

// All routes under /api/admin are accessible only to admin role
router.get('/dashboard', requireAuth, allowRoles(['admin']), (req, res) => {
  res.json({ message: 'Welcome to admin dashboard', user: req.user });
});

export default router;

