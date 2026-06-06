import express from 'express';
import mongoose from 'mongoose';
import { requireAuth, allowRoles } from '../middleware/auth.js';
import Staff from '../models/Staff.js';
import EscalationRequest from '../models/EscalationRequest.js';
import ChatSession from '../models/ChatSession.js';
import StaffRating from '../models/StaffRating.js';

const router = express.Router();
const AI_BACKEND_URL = process.env.AI_BACKEND_URL || 'http://localhost:8000';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));

const parseDate = (value, fallback) => {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const formatMinutes = (minutes) => {
  if (!Number.isFinite(minutes) || minutes <= 0) return 'N/A';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
};

const getResolvedAt = (request) => {
  const terminal = [...(request.statusHistory || [])]
    .reverse()
    .find((item) => ['Closed', 'Resolved'].includes(item.status));
  return terminal?.changedAt || request.updatedAt;
};

const summarizeTranscript = (chat) => {
  const messages = chat.messages || [];
  if (!messages.length) return '';

  return messages
    .slice(-8)
    .map((msg) => `${msg.role || 'unknown'}: ${msg.message}`)
    .join('\n')
    .slice(0, 1600);
};

const computeFallbackEvaluation = (metrics) => {
  const resolutionRate = metrics.tickets.assignedCount
    ? metrics.tickets.resolvedCount / metrics.tickets.assignedCount
    : 0;
  const ratingScore = metrics.ratings.averageRating
    ? (metrics.ratings.averageRating / 5) * 100
    : 70;
  const speedPenalty = metrics.tickets.averageResolutionMinutes
    ? Math.min(metrics.tickets.averageResolutionMinutes / 60, 35)
    : 10;
  const qualityScore = clamp(55 + resolutionRate * 35 + metrics.chats.attributedCount * 2);
  const speedScore = clamp(90 - speedPenalty);
  const reliabilityScore = clamp(45 + resolutionRate * 45 - metrics.tickets.reopenedCount * 8);
  const customerSatisfactionScore = clamp(ratingScore);
  const overallScore = clamp(
    qualityScore * 0.3 +
    speedScore * 0.2 +
    reliabilityScore * 0.25 +
    customerSatisfactionScore * 0.25
  );

  return {
    overallScore,
    qualityScore,
    speedScore,
    reliabilityScore,
    customerSatisfactionScore,
    strengths: resolutionRate >= 0.7 ? ['Strong ticket follow-through'] : ['Maintains assigned support workload'],
    coachingTips: metrics.ratings.averageRating && metrics.ratings.averageRating < 3.5
      ? ['Review recent customer comments and improve expectation-setting']
      : ['Keep resolution notes clear so future handoffs are easier'],
    riskFlags: metrics.tickets.unresolvedCount > metrics.tickets.resolvedCount
      ? ['More unresolved than resolved assigned tickets']
      : [],
    summary: 'Evaluation generated from ticket, chat, and rating metrics.',
  };
};

const normalizeEvaluation = (value, fallback) => ({
  overallScore: clamp(value?.overallScore ?? fallback.overallScore),
  qualityScore: clamp(value?.qualityScore ?? fallback.qualityScore),
  speedScore: clamp(value?.speedScore ?? fallback.speedScore),
  reliabilityScore: clamp(value?.reliabilityScore ?? fallback.reliabilityScore),
  customerSatisfactionScore: clamp(value?.customerSatisfactionScore ?? fallback.customerSatisfactionScore),
  strengths: Array.isArray(value?.strengths) && value.strengths.length ? value.strengths.slice(0, 4) : fallback.strengths,
  coachingTips: Array.isArray(value?.coachingTips) && value.coachingTips.length ? value.coachingTips.slice(0, 4) : fallback.coachingTips,
  riskFlags: Array.isArray(value?.riskFlags) ? value.riskFlags.slice(0, 4) : fallback.riskFlags,
  summary: String(value?.summary || fallback.summary).slice(0, 700),
});

const evaluateWithAi = async (staffMetrics) => {
  const fallbacks = staffMetrics.map(computeFallbackEvaluation);

  try {
    const response = await fetch(`${AI_BACKEND_URL}/api/staff-performance/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staff: staffMetrics }),
    });

    if (!response.ok) throw new Error(`AI evaluation failed: ${response.status}`);
    const data = await response.json();
    const evaluations = Array.isArray(data?.evaluations) ? data.evaluations : [];

    return staffMetrics.map((staff, index) => {
      const match = evaluations.find((item) => String(item.staffId) === String(staff.staffId));
      return normalizeEvaluation(match, fallbacks[index]);
    });
  } catch (err) {
    console.warn('Using fallback staff performance evaluation:', err.message);
    return fallbacks;
  }
};

router.get('/', requireAuth, allowRoles(['organization_admin']), async (req, res) => {
  try {
    const orgId = req.user.orgId;
    if (!orgId) return res.status(400).json({ message: 'Admin organization not found' });

    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    const from = parseDate(req.query.from, defaultFrom);
    const to = parseDate(req.query.to, new Date());
    to.setHours(23, 59, 59, 999);

    const dateQuery = { createdAt: { $gte: from, $lte: to } };
    const staff = await Staff.find({ orgId }).sort({ name: 1 }).lean();
    const staffIds = staff.map((item) => item._id);

    const [requests, chats, ratings] = await Promise.all([
      EscalationRequest.find({ orgId, assignedTo: { $in: staffIds }, ...dateQuery }).lean(),
      ChatSession.find({ orgId, staffId: { $in: staffIds }, ...dateQuery }).lean(),
      StaffRating.find({ orgId, staffId: { $in: staffIds }, ...dateQuery }).lean(),
    ]);

    const metrics = staff.map((member) => {
      const memberRequests = requests.filter((item) => String(item.assignedTo) === String(member._id));
      const memberChats = chats.filter((item) => String(item.staffId) === String(member._id));
      const memberRatings = ratings.filter((item) => String(item.staffId) === String(member._id));
      const resolvedRequests = memberRequests.filter((item) => ['Closed', 'Resolved'].includes(item.status));
      const resolutionMinutes = resolvedRequests
        .map((item) => (new Date(getResolvedAt(item)).getTime() - new Date(item.createdAt).getTime()) / 60000)
        .filter((value) => Number.isFinite(value) && value >= 0);
      const averageResolutionMinutes = resolutionMinutes.length
        ? resolutionMinutes.reduce((sum, value) => sum + value, 0) / resolutionMinutes.length
        : null;
      const reopenedCount = memberRequests.reduce(
        (count, item) => count + (item.statusHistory || []).filter((history) => history.status === 'Open').length,
        0
      );
      const averageRating = memberRatings.length
        ? memberRatings.reduce((sum, item) => sum + item.rating, 0) / memberRatings.length
        : null;

      return {
        staffId: String(member._id),
        name: member.name || member.email,
        email: member.email,
        tickets: {
          assignedCount: memberRequests.length,
          resolvedCount: resolvedRequests.length,
          unresolvedCount: memberRequests.length - resolvedRequests.length,
          reopenedCount,
          averageResolutionMinutes,
          averageResolutionLabel: formatMinutes(averageResolutionMinutes),
        },
        chats: {
          attributedCount: memberChats.length,
          resolvedCount: memberChats.filter((chat) => ['Closed', 'Resolved'].includes(chat.status)).length,
          unresolvedCount: memberChats.filter((chat) => chat.status === 'Open').length,
          transcriptSummaries: memberChats.slice(0, 5).map(summarizeTranscript).filter(Boolean),
        },
        ratings: {
          averageRating: averageRating ? Number(averageRating.toFixed(2)) : null,
          count: memberRatings.length,
          recentComments: memberRatings
            .filter((rating) => rating.comment)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map((rating) => rating.comment),
        },
      };
    });

    const evaluations = await evaluateWithAi(metrics);
    const staffPerformance = metrics
      .map((item, index) => ({ ...item, evaluation: evaluations[index] }))
      .sort((a, b) => b.evaluation.overallScore - a.evaluation.overallScore);

    const aggregate = staffPerformance.reduce(
      (acc, item) => {
        acc.totalStaff += 1;
        acc.totalTickets += item.tickets.assignedCount;
        acc.resolvedTickets += item.tickets.resolvedCount;
        acc.totalRatings += item.ratings.count;
        if (item.ratings.averageRating) {
          acc.ratingSum += item.ratings.averageRating * item.ratings.count;
        }
        acc.scoreSum += item.evaluation.overallScore;
        return acc;
      },
      { totalStaff: 0, totalTickets: 0, resolvedTickets: 0, totalRatings: 0, ratingSum: 0, scoreSum: 0 }
    );

    return res.json({
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      summary: {
        totalStaff: aggregate.totalStaff,
        totalTickets: aggregate.totalTickets,
        resolvedTickets: aggregate.resolvedTickets,
        resolutionRate: aggregate.totalTickets ? Math.round((aggregate.resolvedTickets / aggregate.totalTickets) * 100) : 0,
        averageRating: aggregate.totalRatings ? Number((aggregate.ratingSum / aggregate.totalRatings).toFixed(2)) : null,
        averageScore: aggregate.totalStaff ? Math.round(aggregate.scoreSum / aggregate.totalStaff) : 0,
      },
      staffPerformance,
    });
  } catch (err) {
    console.error('Failed to build staff performance report:', err);
    return res.status(500).json({ message: 'Failed to build staff performance report' });
  }
});

export default router;
