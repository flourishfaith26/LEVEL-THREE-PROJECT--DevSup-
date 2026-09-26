import express from 'express';
import { getUserConversations, createConversation } from '../controllers/conversationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, getUserConversations);
router.post('/', requireAuth, createConversation);

export default router;