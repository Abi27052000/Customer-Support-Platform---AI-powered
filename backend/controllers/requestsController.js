import EscalationRequest from '../models/EscalationRequest.js';
import Staff from '../models/Staff.js';
import StaffWorkload from '../models/StaffWorkload.js';
import UserOrg from '../models/UserOrg.js';

// Helper: get least loaded staffId for an org using StaffWorkload
// const getLeastLoadedStaff = async (orgId) => {
//   const workloads = await StaffWorkload.find({ orgId }).sort({ activeRequests: 1, lastAssignedAt: 1 }).limit(1);
//   if (!workloads || workloads.length === 0) return null;
//   return workloads[0];
// }

// export const createRequest = async (req, res) => {
//   try {
//     const { orgId, userId, title, description } = req.body;
//     if (!orgId || !userId || !title) return res.status(400).json({ message: 'orgId, userId and title are required' });

//     // find least loaded staff workload for org
//     const workload = await getLeastLoadedStaff(orgId);
//     const assigneeId = workload ? workload.staffId : null;

//     // create request with assignedTo if found
//     const r = new EscalationRequest({ orgId, userId, title, description, assignedTo: assigneeId || undefined, statusHistory: [{ status: 'Open', changedBy: userId, changedByModel: 'User', note: 'Created' }] });
//     await r.save();

//     // update workload counter
//     if (assigneeId) {
//       await StaffWorkload.findOneAndUpdate(
//         { staffId: assigneeId },
//         { $inc: { activeRequests: 1 }, $set: { lastAssignedAt: new Date() } },
//         { upsert: true }
//       );
//     }

//     let assignee = null;
//     if (assigneeId) {
//       assignee = await Staff.findById(assigneeId).select('name email');
//     }

//     return res.status(201).json({ request: r, assignedTo: assignee });
//   } catch (err) {
//     console.error('createRequest error', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// }


export const getLeastLoadedStaff = async (orgId) => {
  // 1. Try workload-based selection
  const workload = await StaffWorkload.find({ orgId })
    .sort({ activeRequests: 1, lastAssignedAt: 1 })
    .limit(1);

  if (workload.length > 0) {
    return workload[0].staffId;
  }

  // 2. Fallback: if no workload exists, pick any staff
  const staff = await Staff.findOne({ orgId });

  if (!staff) return null;

  return staff._id;
};

export const resolveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolvedByStaffId, note } = req.body;

    const reqDoc = await EscalationRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ message: 'Request not found' });
    if (String(reqDoc.orgId) !== String(req.user.orgId)) {
      return res.status(403).json({ message: 'You cannot resolve tickets from another organization' });
    }

    const oldStaffId = reqDoc.assignedTo;

    // mark resolved and add history
    reqDoc.status = 'Resolved';
    reqDoc.statusHistory = reqDoc.statusHistory || [];
    reqDoc.statusHistory.push({ status: 'Resolved', changedBy: resolvedByStaffId || undefined, changedByModel: resolvedByStaffId ? 'Staff' : 'User', note: note || 'Resolved via chat/call' });
    await reqDoc.save();

    // reduce previous staff workload
    if (oldStaffId) {
      await StaffWorkload.findOneAndUpdate({ staffId: oldStaffId }, { $inc: { activeRequests: -1, closedToday: 1 } });
    }

    // try to assign next unassigned open request to same staff who resolved (handoff)
    let next = null;
    if (resolvedByStaffId) {
      next = await EscalationRequest.findOne({ orgId: reqDoc.orgId, status: 'Open', assignedTo: { $exists: false } }).sort({ createdAt: 1 });
      if (next) {
        next.assignedTo = resolvedByStaffId;
        next.statusHistory = next.statusHistory || [];
        next.statusHistory.push({ status: 'Assigned', changedBy: resolvedByStaffId, changedByModel: 'Staff', note: 'Auto-assigned after resolve' });
        await next.save();

        await StaffWorkload.findOneAndUpdate({ staffId: resolvedByStaffId }, { $inc: { activeRequests: 1 }, $set: { lastAssignedAt: new Date() } }, { upsert: true });
      }
    }

    const populated = await EscalationRequest.findById(reqDoc._id)
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email');

    return res.json({ message: 'Resolved', assignedNext: next || null, request: populated });
  } catch (err) {
    console.error('resolveRequest error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}



export const createRequest = async (req, res) => {
  try {
    const { orgId: requestedOrgId, title, description, conversationSummary } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    let orgId = req.user?.orgId || requestedOrgId;
    let userId = req.user?._id;

    if (req.user.role === 'user') {
      orgId = req.user.orgId || requestedOrgId;
      if (!orgId) return res.status(400).json({ message: 'Organization is required' });

      const isSelectedOrg = String(req.user.orgId || '') === String(orgId);
      const membership = isSelectedOrg
        ? true
        : await UserOrg.exists({ userId: req.user._id, orgId });

      if (!membership) {
        return res.status(403).json({ message: 'You cannot create tickets for this organization' });
      }
    } else if (['organization_staff', 'organization_admin'].includes(req.user.role)) {
      orgId = req.user.orgId;
      userId = req.body.userId || req.user._id;
      if (!orgId) return res.status(400).json({ message: 'Authenticated user is not assigned to an organization' });
    }

    // STEP 1: find staff
    const assigneeId = await getLeastLoadedStaff(orgId);

    // STEP 2: create request
    const request = await EscalationRequest.create({
      orgId,
      userId,
      title,
      description,
      conversationSummary,
      assignedTo: assigneeId || undefined,
      statusHistory: [
        {
          status: 'Open',
          changedBy: userId,
          changedByModel: 'User',
          note: 'Created'
        }
      ]
    });

    // STEP 3: AUTO CREATE OR UPDATE WORKLOAD
    if (assigneeId) {
      await StaffWorkload.findOneAndUpdate(
        { staffId: assigneeId },
        {
          $setOnInsert: {
            staffId: assigneeId,
            orgId,
            activeRequests: 0,
            closedToday: 0
          }
        },
        { upsert: true, new: true }
      );

      // STEP 4: increment workload
      await StaffWorkload.findOneAndUpdate(
        { staffId: assigneeId },
        {
          $inc: { activeRequests: 1 },
          $set: { lastAssignedAt: new Date() }
        }
      );
    }

    const savedRequest = await EscalationRequest.findById(request._id)
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email');

    return res.status(201).json({
      request: savedRequest,
      assignedTo: savedRequest?.assignedTo || null
    });

  } catch (err) {
    console.error("createRequest error:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const listRequests = async (req, res) => {
  try {
    const q = {};

    if (req.user.role === 'user') {
      q.userId = req.user._id;
      if (req.user.orgId) q.orgId = req.user.orgId;
    } else if (['organization_staff', 'organization_admin'].includes(req.user.role)) {
      if (!req.user.orgId) return res.status(400).json({ message: 'Authenticated user is not assigned to an organization' });
      q.orgId = req.user.orgId;
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const items = await EscalationRequest.find(q)
      .sort({ createdAt: -1 })
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email');
    return res.json({ requests: items });
  } catch (err) {
    console.error('listRequests error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// export const closeRequest = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { closedByStaffId } = req.body;
//     const reqDoc = await EscalationRequest.findById(id);
//     if (!reqDoc) return res.status(404).json({ message: 'Request not found' });
//     // update status and add history
//     reqDoc.status = 'Closed';
//     reqDoc.statusHistory = reqDoc.statusHistory || [];
//     reqDoc.statusHistory.push({ status: 'Closed', changedBy: closedByStaffId || undefined, changedByModel: closedByStaffId ? 'Staff' : 'User', note: req.body.note || 'Closed' });
//     await reqDoc.save();

//     // reduce workload counters for the staff who had this assigned
//     if (reqDoc.assignedTo) {
//       await StaffWorkload.findOneAndUpdate({ staffId: reqDoc.assignedTo }, { $inc: { activeRequests: -1, closedToday: 1 } });
//     }

//     // after closing, try to assign one unassigned open request to this staff (handoff)
//     let next = null;
//     if (closedByStaffId) {
//       next = await EscalationRequest.findOne({ orgId: reqDoc.orgId, status: 'Open', assignedTo: { $exists: false } }).sort({ createdAt: 1 });
//       if (next) {
//         next.assignedTo = closedByStaffId;
//         // add history for assignment
//         next.statusHistory = next.statusHistory || [];
//         next.statusHistory.push({ status: 'Assigned', changedBy: closedByStaffId, changedByModel: 'Staff', note: 'Auto-assigned after handoff' });
//         await next.save();

//         await StaffWorkload.findOneAndUpdate({ staffId: closedByStaffId }, { $inc: { activeRequests: 1 }, $set: { lastAssignedAt: new Date() } }, { upsert: true });
//       }
//     }

//     return res.json({ message: 'Closed', assignedNext: next || null });
//   } catch (err) {
//     console.error('closeRequest error', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// }


export const closeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { closedByStaffId } = req.body;

    const reqDoc = await EscalationRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ message: 'Request not found' });
    if (String(reqDoc.orgId) !== String(req.user.orgId)) {
      return res.status(403).json({ message: 'You cannot close tickets from another organization' });
    }

    const oldStaffId = reqDoc.assignedTo;

    reqDoc.status = 'Closed';
    reqDoc.statusHistory = reqDoc.statusHistory || [];
    reqDoc.statusHistory.push({
      status: 'Closed',
      changedBy: closedByStaffId || oldStaffId || undefined,
      changedByModel: 'Staff',
      note: req.body.note || 'Closed'
    });

    await reqDoc.save();

    if (oldStaffId) {
      await StaffWorkload.findOneAndUpdate(
        { staffId: oldStaffId },
        { $inc: { activeRequests: -1, closedToday: 1 } }
      );
    }

    const populated = await EscalationRequest.findById(reqDoc._id)
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email');

    return res.json({
      message: 'Closed',
      request: populated
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const reopenRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const reqDoc = await EscalationRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ message: 'Request not found' });
    if (String(reqDoc.orgId) !== String(req.user.orgId)) {
      return res.status(403).json({ message: 'You cannot reopen tickets from another organization' });
    }
    reqDoc.status = 'Open';
    reqDoc.statusHistory = reqDoc.statusHistory || [];
    reqDoc.statusHistory.push({ status: 'Open', changedBy: req.body.changedBy || undefined, changedByModel: req.body.changedByStaff ? 'Staff' : 'User', note: req.body.note || 'Reopened' });
    await reqDoc.save();

    // if assigned, increment workload
    if (reqDoc.assignedTo) {
      await StaffWorkload.findOneAndUpdate({ staffId: reqDoc.assignedTo }, { $inc: { activeRequests: 1 } }, { upsert: true });
    }

    const populated = await EscalationRequest.findById(reqDoc._id)
      .populate('userId', 'name email')
      .populate('assignedTo', 'name email');
    return res.json({ message: 'Reopened', request: populated });
  } catch (err) {
    console.error('reopenRequest error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
