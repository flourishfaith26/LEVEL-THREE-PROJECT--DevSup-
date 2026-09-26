import express from 'express';
import { syncUser, getAllUsers, updateProfile } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/sync', requireAuth, syncUser);
router.get('/', requireAuth, getAllUsers); 
router.put('/profile', requireAuth, updateProfile);

export default router;