import express from 'express';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', requireAuth, allowRoles(['organization_staff']), (req, res) => {
  res.json({ message: 'Welcome to staff dashboard', user: req.user });
});

export default router;

