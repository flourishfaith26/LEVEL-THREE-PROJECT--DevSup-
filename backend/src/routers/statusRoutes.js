import express from 'express';
import { createStatus, getStatuses, markViewed, deleteStatus } from '../controllers/statusController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, createStatus);
router.get('/', requireAuth, getStatuses);
router.post('/:id/view', requireAuth, markViewed);
router.delete('/:id', requireAuth, deleteStatus);

export default router;
