import express from 'express';
import mongoose from 'mongoose';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import EscalationRequest from '../models/EscalationRequest.js';
import ChatSession from '../models/ChatSession.js';
import StaffRating from '../models/StaffRating.js';

const router = express.Router();

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const toRatingResponse = (rating) => ({
  id: rating._id,
  orgId: rating.orgId,
  staffId: rating.staffId,
  sourceType: rating.sourceType,
  requestId: rating.requestId,
  chatSessionId: rating.chatSessionId,
  rating: rating.rating,
  comment: rating.comment,
  createdAt: rating.createdAt,
});

router.get('/rateable', requireAuth, allowRoles(['user']), async (req, res) => {
  try {
    const ratedTickets = await StaffRating.find({
      customerId: req.user._id,
      requestId: { $exists: true },
    }).distinct('requestId');

    const ratedChats = await StaffRating.find({
      customerId: req.user._id,
      chatSessionId: { $exists: true },
    }).distinct('chatSessionId');

    const tickets = await EscalationRequest.find({
      userId: req.user._id,
      status: { $in: ['Closed', 'Resolved'] },
      assignedTo: { $exists: true },
      _id: { $nin: ratedTickets },
    })
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate('assignedTo', 'name email')
      .lean();

    const chats = await ChatSession.find({
      customerId: req.user._id,
      status: { $in: ['Closed', 'Resolved'] },
      staffId: { $exists: true },
      _id: { $nin: ratedChats },
    })
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate('staffId', 'name email')
      .lean();

    return res.json({
      items: [
        ...tickets.map((ticket) => ({
          sourceType: 'ticket',
          sourceId: ticket._id,
          title: ticket.title,
          staff: ticket.assignedTo,
          resolvedAt: ticket.updatedAt,
        })),
        ...chats.map((chat) => ({
          sourceType: 'chat',
          sourceId: chat._id,
          title: `Live chat ${chat.roomId}`,
          staff: chat.staffId,
          resolvedAt: chat.closedAt || chat.updatedAt,
        })),
      ],
    });
  } catch (err) {
    console.error('Failed to load rateable staff interactions:', err);
    return res.status(500).json({ message: 'Failed to load rateable interactions' });
  }
});

router.post('/', requireAuth, allowRoles(['user']), async (req, res) => {
  try {
    const { sourceType, sourceId, rating, comment } = req.body;
    const numericRating = Number(rating);

    if (!['ticket', 'chat'].includes(sourceType)) {
      return res.status(400).json({ message: 'Invalid rating source type' });
    }
    if (!isObjectId(sourceId)) {
      return res.status(400).json({ message: 'Valid source ID is required' });
    }
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: 'Rating must be a whole number from 1 to 5' });
    }

    let source;
    const ratingData = {
      customerId: req.user._id,
      sourceType,
      rating: numericRating,
      comment: String(comment || '').trim(),
    };

    if (sourceType === 'ticket') {
      source = await EscalationRequest.findOne({
        _id: sourceId,
        userId: req.user._id,
        status: { $in: ['Closed', 'Resolved'] },
        assignedTo: { $exists: true },
      });
      if (!source) return res.status(404).json({ message: 'Resolved ticket not found' });

      Object.assign(ratingData, {
        orgId: source.orgId,
        staffId: source.assignedTo,
        requestId: source._id,
      });
    } else {
      source = await ChatSession.findOne({
        _id: sourceId,
        customerId: req.user._id,
        status: { $in: ['Closed', 'Resolved'] },
        staffId: { $exists: true },
      });
      if (!source) return res.status(404).json({ message: 'Resolved chat not found' });

      Object.assign(ratingData, {
        orgId: source.orgId,
        staffId: source.staffId,
        chatSessionId: source._id,
      });
    }

    const saved = await StaffRating.create(ratingData);
    return res.status(201).json({ rating: toRatingResponse(saved) });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'You already rated this interaction' });
    }

    console.error('Failed to submit staff rating:', err);
    return res.status(500).json({ message: 'Failed to submit rating' });
  }
});

export default router;
