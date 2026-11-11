import express from 'express';
import { 
    getMessages, 
    markMessagesReadHttp, 
    sendMessageHttp,
    addCodeReview,
    toggleResolveCodeReview
} from '../controllers/messageController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/:conversationId', requireAuth, getMessages);
router.post('/', requireAuth, sendMessageHttp);
router.post('/:conversationId/read', requireAuth, markMessagesReadHttp);
router.post('/:id/code-review', requireAuth, addCodeReview);
router.patch('/:id/code-review/:reviewId/resolve', requireAuth, toggleResolveCodeReview);

export default router;
