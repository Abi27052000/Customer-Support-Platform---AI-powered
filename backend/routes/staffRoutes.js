import express from 'express';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import Staff from '../models/Staff.js';
import ChatSession from '../models/ChatSession.js';

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

router.get('/chat-sessions', requireAuth, allowRoles(['organization_staff']), async (req, res) => {
  try {
    if (!req.user.orgId) return res.status(400).json({ message: 'Staff organization not found' });

    const sessions = await ChatSession.find({ orgId: req.user.orgId })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .limit(50)
      .populate('customerId', 'name email')
      .populate('staffId', 'name email')
      .lean();

    return res.json({ sessions });
  } catch (err) {
    console.error('Failed to load chat sessions:', err);
    return res.status(500).json({ message: 'Failed to load chat sessions' });
  }
});

router.put('/chat-sessions/:roomId/close', requireAuth, allowRoles(['organization_staff']), async (req, res) => {
  try {
    const session = await ChatSession.findOneAndUpdate(
      { roomId: req.params.roomId, orgId: req.user.orgId },
      { status: 'Closed', closedAt: new Date() },
      { new: true }
    )
      .populate('customerId', 'name email')
      .populate('staffId', 'name email');

    if (!session) return res.status(404).json({ message: 'Chat session not found' });
    return res.json({ session });
  } catch (err) {
    console.error('Failed to close chat session:', err);
    return res.status(500).json({ message: 'Failed to close chat session' });
  }
});

export default router;

