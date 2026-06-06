import express from 'express';
import { createRequest, listRequests, closeRequest, reopenRequest } from '../controllers/requestsController.js';
import { requireAuth, allowRoles } from '../middleware/auth.js';

const router = express.Router();

// POST /api/requests  { orgId, userId, title, description }
router.post('/', requireAuth, allowRoles(['user', 'organization_staff', 'organization_admin']), createRequest);

// GET /api/requests?orgId=...
router.get('/', requireAuth, allowRoles(['user', 'organization_staff', 'organization_admin']), listRequests);

// PUT /api/requests/:id/close  { closedByStaffId }
router.put('/:id/close', requireAuth, allowRoles(['organization_staff', 'organization_admin']), closeRequest);

// PUT /api/requests/:id/open
router.put('/:id/open', requireAuth, allowRoles(['organization_staff', 'organization_admin']), reopenRequest);

// PUT /api/requests/:id/resolve
router.put('/:id/resolve', requireAuth, allowRoles(['organization_staff', 'organization_admin']), (req, res, next) => {
	// lazy-load controller to avoid circular issues
	import('../controllers/requestsController.js').then(m => m.resolveRequest(req, res, next)).catch(next);
});

export default router;
