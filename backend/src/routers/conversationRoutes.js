import express from 'express';
import { getUserConversations, createConversation, updateConversation } from '../controllers/conversationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, getUserConversations);
router.post('/', requireAuth, createConversation);
router.put('/:id', requireAuth, updateConversation);

export default router;