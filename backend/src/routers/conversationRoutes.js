import express from 'express';
import { 
    getUserConversations, 
    createConversation, 
    updateConversation, 
    addMembersToConversation,
    getPublicCommunities,
    getOrCreateInviteCode,
    getInviteMetadata,
    joinConversationByInvite
} from '../controllers/conversationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public discovery and guest invite routes
router.get('/public', getPublicCommunities);
router.get('/invite/:code', getInviteMetadata);
router.post('/join/:code', requireAuth, joinConversationByInvite);

// Authenticated conversation management
router.get('/', requireAuth, getUserConversations);
router.post('/', requireAuth, createConversation);
router.post('/:id/invite-link', requireAuth, getOrCreateInviteCode);
router.put('/:id', requireAuth, updateConversation);
router.post('/:id/members', requireAuth, addMembersToConversation);

export default router;