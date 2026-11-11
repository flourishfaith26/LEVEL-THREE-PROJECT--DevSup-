import express from 'express';
import CallLog from '../models/CallLog.js';
import { requireAuth } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

import Conversation from '../models/Conversation.js';

router.get('/', requireAuth, async (req, res) => {
    try {
        const user = await User.findOne({ auth0Id: req.auth.payload.sub });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const userConversations = await Conversation.find({ participants: user._id }).select('_id');
        const conversationIds = userConversations.map(c => c._id);

        const logs = await CallLog.find({
            $and: [
                { $or: [{ caller: user._id }, { receiver: user._id }, { conversation: { $in: conversationIds } }] },
                { deletedBy: { $ne: user._id } }
            ]
        })
        .populate('caller receiver')
        .populate({
            path: 'conversation',
            populate: { path: 'participants', select: 'displayName avatarUrl techDiscipline username' }
        })
        .sort({ createdAt: -1 })
        .limit(50);
        
        // Self-heal any legacy call logs where receiver was missing but conversation participants exist
        for (const log of logs) {
            if (!log.receiver && log.conversation?.participants && log.conversation.type === 'direct') {
                const callerIdStr = String(log.caller?._id || log.caller);
                const other = log.conversation.participants.find(p => String(p._id || p) !== callerIdStr);
                if (other) {
                    log.receiver = other;
                    const otherId = other._id || other;
                    CallLog.updateOne({ _id: log._id }, { receiver: otherId }).exec().catch(err => {
                        console.warn('CallLog repair non-fatal error:', err);
                    });
                }
            }
        }

        res.status(200).json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const user = await User.findOne({ auth0Id: req.auth.payload.sub });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const log = await CallLog.findById(req.params.id);
        if (!log) return res.status(404).json({ error: 'Log not found' });
        
        if (log.caller.toString() !== user._id.toString() && log.receiver.toString() !== user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        if (!log.deletedBy.includes(user._id)) {
            log.deletedBy.push(user._id);
            await log.save();
        }
        
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
