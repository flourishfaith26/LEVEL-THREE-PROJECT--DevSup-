import express from 'express';
import { getMessages } from '../controllers/messageController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/:conversationId', requireAuth, getMessages);

export default router;