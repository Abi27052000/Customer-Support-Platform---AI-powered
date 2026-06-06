import express from 'express';
import mongoose from 'mongoose';
import ConversationSummary from '../models/ConversationSummary.js';
import UserOrg from '../models/UserOrg.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = express.Router();

const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:8000';

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const normalizeTitle = (title) => {
  const cleaned = String(title || '').trim();
  return cleaned || 'AI conversation summary';
};

const normalizeSummary = (summary) => {
  const cleaned = String(summary || '').trim();
  return cleaned || 'No useful summary could be generated for this conversation.';
};

const stripJsonFence = (value) =>
  String(value || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

const parseSummaryPayload = (payload) => {
  let title = payload?.title;
  let summary = payload?.summary;

  const maybeJson = stripJsonFence(summary);
  if (maybeJson.startsWith('{') && maybeJson.endsWith('}')) {
    try {
      const parsed = JSON.parse(maybeJson);
      title = parsed.title || title;
      summary = parsed.summary || summary;
    } catch {
      summary = maybeJson;
    }
  }

  return {
    title: normalizeTitle(title),
    summary: normalizeSummary(summary),
  };
};

const canUserSaveForOrg = async (user, orgId) => {
  if (user.role !== 'user') return false;
  if (String(user.orgId || '') === String(orgId)) return true;

  const membership = await UserOrg.findOne({ userId: user._id, orgId });
  return Boolean(membership);
};

const summarizeConversation = async ({ channel, conversationText }) => {
  const response = await fetch(`${AI_BACKEND_URL}/api/chat/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, conversation_text: conversationText }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI summary failed: ${errorText || response.statusText}`);
  }

  return response.json();
};

router.post('/', requireAuth, allowRoles(['user']), async (req, res) => {
  try {
    const { channel, sessionId, orgId, endedReason, conversationText } = req.body;

    if (!['ai_chat', 'ai_voice'].includes(channel)) {
      return res.status(400).json({ message: 'Invalid conversation channel' });
    }

    if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    if (!orgId || !isValidObjectId(orgId)) {
      return res.status(400).json({ message: 'Valid organization ID is required' });
    }

    if (!['ended', 'escalated', 'cleared'].includes(endedReason)) {
      return res.status(400).json({ message: 'Invalid ended reason' });
    }

    if (!conversationText || typeof conversationText !== 'string' || !conversationText.trim()) {
      return res.status(400).json({ message: 'Conversation text is required for summarization' });
    }

    const allowed = await canUserSaveForOrg(req.user, orgId);
    if (!allowed) {
      return res.status(403).json({ message: 'You are not allowed to save conversations for this organization' });
    }

    const aiSummary = await summarizeConversation({
      channel,
      conversationText: conversationText.trim(),
    });

    const parsedSummary = parseSummaryPayload(aiSummary);

    const saved = await ConversationSummary.create({
      channel,
      sessionId: sessionId.trim(),
      orgId,
      userId: req.user._id,
      title: parsedSummary.title,
      summary: parsedSummary.summary,
      endedReason,
    });

    console.log('Conversation summary saved:');
    console.log(JSON.stringify(saved.toObject(), null, 2));

    return res.status(201).json({ conversationSummary: saved });
  } catch (err) {
    console.error('Failed to save conversation summary:', err);
    return res.status(500).json({ message: 'Failed to save conversation summary' });
  }
});

router.get('/', requireAuth, allowRoles(['user', 'organization_staff', 'organization_admin']), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    if (!orgId) {
      return res.status(400).json({ message: 'Authenticated user is not assigned to an organization' });
    }

    const query = { orgId };
    if (req.user.role === 'user') {
      query.userId = req.user._id;
    }

    if (['ai_chat', 'ai_voice'].includes(req.query.channel)) {
      query.channel = req.query.channel;
    }

    if (['ended', 'escalated', 'cleared'].includes(req.query.endedReason)) {
      query.endedReason = req.query.endedReason;
    }

    const createdAt = {};
    if (req.query.from) {
      const from = new Date(req.query.from);
      if (!Number.isNaN(from.getTime())) createdAt.$gte = from;
    }
    if (req.query.to) {
      const to = new Date(req.query.to);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        createdAt.$lte = to;
      }
    }
    if (Object.keys(createdAt).length > 0) query.createdAt = createdAt;

    const summaries = await ConversationSummary.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'name email')
      .lean();

    const conversationSummaries = summaries.map((item) => ({
      id: item._id,
      channel: item.channel,
      sessionId: item.sessionId,
      title: item.title,
      summary: item.summary,
      status: item.status,
      endedReason: item.endedReason,
      createdAt: item.createdAt,
      customer: item.userId
        ? {
            id: item.userId._id,
            name: item.userId.name,
            email: item.userId.email,
          }
        : null,
    }));

    return res.json({ conversationSummaries });
  } catch (err) {
    console.error('Failed to list conversation summaries:', err);
    return res.status(500).json({ message: 'Failed to list conversation summaries' });
  }
});

export default router;
