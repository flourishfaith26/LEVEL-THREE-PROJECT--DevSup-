import express from 'express';
import { 
    syncUser, 
    getAllUsers, 
    updateProfile, 
    searchByUsername, 
    checkUsernameAvailability,
    blockUser,
    unblockUser,
    getBlockedUsers,
    lookupUser,
    deleteAccount
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/lookup', lookupUser);
router.post('/sync', requireAuth, syncUser);
router.get('/', requireAuth, getAllUsers); 
router.put('/profile', requireAuth, updateProfile);
router.get('/search', requireAuth, searchByUsername);
router.get('/check-username', requireAuth, checkUsernameAvailability);
router.post('/block/:targetUserId', requireAuth, blockUser);
router.post('/unblock/:targetUserId', requireAuth, unblockUser);
router.get('/blocked', requireAuth, getBlockedUsers);
router.delete('/account', requireAuth, deleteAccount);

export default router;