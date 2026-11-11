import express from 'express';
import { getMessages, markMessagesReadHttp, sendMessageHttp } from '../controllers/messageController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/:conversationId', requireAuth, getMessages);
router.post('/', requireAuth, sendMessageHttp);
router.post('/:conversationId/read', requireAuth, markMessagesReadHttp);

export default router;
