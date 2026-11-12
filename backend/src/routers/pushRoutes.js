import express from 'express';
import * as webpush from 'web-push';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Fallback VAPID keys if process.env is empty
let VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
let VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    try {
        const generated = webpush.generateVAPIDKeys();
        VAPID_PUBLIC_KEY = VAPID_PUBLIC_KEY || generated.publicKey;
        VAPID_PRIVATE_KEY = VAPID_PRIVATE_KEY || generated.privateKey;
    } catch (e) {
        console.warn('Could not generate VAPID keys:', e.message);
    }
}

try {
    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
        webpush.setVapidDetails(
            'mailto:support@devsupchat.com',
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
        );
    }
} catch (e) {
    console.warn('Failed to configure web-push VAPID details:', e.message);
}

/**
 * GET /api/push/public-key
 */
router.get('/public-key', (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY || '' });
});

/**
 * POST /api/push/subscribe
 * Body: { subscription: { endpoint, keys: { p256dh, auth } } }
 */
router.post('/subscribe', requireAuth, async (req, res) => {
    try {
        const { subscription } = req.body;
        const auth0Id = req.auth.payload.sub;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ error: 'Valid push subscription object required' });
        }

        const user = await User.findOne({ auth0Id });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Check if endpoint already registered
        const exists = user.pushSubscriptions?.some(s => s.endpoint === subscription.endpoint);
        if (!exists) {
            if (!user.pushSubscriptions) user.pushSubscriptions = [];
            user.pushSubscriptions.push({
                endpoint: subscription.endpoint,
                keys: subscription.keys,
                createdAt: new Date()
            });
            await user.save();
        }

        res.status(201).json({ success: true, message: 'Push subscription registered' });
    } catch (err) {
        console.error('Push subscribe error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * POST /api/push/unsubscribe
 * Body: { endpoint }
 */
router.post('/unsubscribe', requireAuth, async (req, res) => {
    try {
        const { endpoint } = req.body;
        const auth0Id = req.auth.payload.sub;

        const user = await User.findOne({ auth0Id });
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.pushSubscriptions = (user.pushSubscriptions || []).filter(s => s.endpoint !== endpoint);
        await user.save();

        res.json({ success: true, message: 'Push subscription removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * Utility: Send a Web Push notification to a target user across all their devices
 */
export const sendPushNotificationToUser = async (userId, payload) => {
    try {
        const user = await User.findById(userId).select('pushSubscriptions displayName');
        if (!user || !Array.isArray(user.pushSubscriptions) || user.pushSubscriptions.length === 0) {
            return;
        }

        const notificationPayload = JSON.stringify({
            title: payload.title || 'DevSup Notification',
            body: payload.body || 'You have a new message on DevSup',
            icon: payload.icon || '/favicon.ico',
            badge: '/favicon.ico',
            data: {
                url: payload.url || 'https://devsupchat.com/dashboard',
                conversationId: payload.conversationId,
                timestamp: Date.now()
            }
        });

        const deadEndpoints = [];

        await Promise.allSettled(
            user.pushSubscriptions.map(async (sub) => {
                try {
                    await webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: sub.keys
                        },
                        notificationPayload
                    );
                } catch (pushErr) {
                    // Status 404 or 410 means subscription expired or was revoked
                    if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
                        deadEndpoints.push(sub.endpoint);
                    }
                }
            })
        );

        // Prune expired endpoints
        if (deadEndpoints.length > 0) {
            await User.findByIdAndUpdate(userId, {
                $pull: { pushSubscriptions: { endpoint: { $in: deadEndpoints } } }
            });
        }
    } catch (err) {
        console.warn('Error sending web push notification:', err.message);
    }
};

export default router;

