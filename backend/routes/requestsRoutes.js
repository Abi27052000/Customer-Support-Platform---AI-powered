import express from 'express';
import { createRequest, listRequests, closeRequest, reopenRequest } from '../controllers/requestsController.js';

const router = express.Router();

// POST /api/requests  { orgId, userId, title, description }
router.post('/', createRequest);

// GET /api/requests?orgId=...
router.get('/', listRequests);

// PUT /api/requests/:id/close  { closedByStaffId }
router.put('/:id/close', closeRequest);

// PUT /api/requests/:id/open
router.put('/:id/open', reopenRequest);

// PUT /api/requests/:id/resolve
router.put('/:id/resolve', (req, res, next) => {
	// lazy-load controller to avoid circular issues
	import('../controllers/requestsController.js').then(m => m.resolveRequest(req, res, next)).catch(next);
});

export default router;
