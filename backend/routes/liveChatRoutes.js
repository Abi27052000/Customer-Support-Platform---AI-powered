import express from 'express';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import ChatSession from '../models/ChatSession.js';

const router = express.Router();

// Returns the customer's most recent open live chat session for their org,
// or null when they have none (the frontend then starts a fresh room).
router.get('/session', requireAuth, allowRoles(['user']), async (req, res) => {
  try {
    if (!req.user.orgId) return res.status(400).json({ message: 'Organization not selected' });

    const session = await ChatSession.findOne({
      customerId: req.user._id,
      orgId: req.user.orgId,
      status: 'Open',
    })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .lean();

    return res.json({ session: session || null });
  } catch (err) {
    console.error('Failed to load live chat session:', err);
    return res.status(500).json({ message: 'Failed to load live chat session' });
  }
});

export default router;
