import express from 'express';
import crypto from 'crypto';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper: Ensure a bot user exists for system DevOps alerts
const getOrCreateDevOpsBot = async () => {
    let bot = await User.findOne({ username: 'devops-bot' });
    if (!bot) {
        bot = new User({
            auth0Id: 'devops-bot-system',
            username: 'devops-bot',
            displayName: 'DevOps CI/CD Bot',
            email: 'devops-bot@devsupchat.com',
            avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
            hasCompletedProfile: true,
            techDiscipline: 'DevOps & Infrastructure'
        });
        await bot.save();
    }
    return bot;
};

// ==========================================
// 1. Webhook Management (Authenticated)
// ==========================================

// GET /api/webhooks/conversation/:conversationId
router.get('/conversation/:conversationId', requireAuth, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const conv = await Conversation.findById(conversationId).select('webhooks name');
        if (!conv) {
            return res.status(404).json({ error: 'Channel / conversation not found' });
        }
        res.json({ webhooks: conv.webhooks || [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/webhooks/conversation/:conversationId
router.post('/conversation/:conversationId', requireAuth, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { name = 'DevOps Alert Webhook', service = 'custom' } = req.body;
        const auth0Id = req.auth.payload.sub;
        const currentUser = await User.findOne({ auth0Id });

        const conv = await Conversation.findById(conversationId);
        if (!conv) {
            return res.status(404).json({ error: 'Channel / conversation not found' });
        }

        const token = crypto.randomBytes(24).toString('hex');
        const newWebhook = {
            token,
            name,
            service,
            createdBy: currentUser ? currentUser._id : undefined,
            createdAt: new Date()
        };

        conv.webhooks.push(newWebhook);
        await conv.save();

        const created = conv.webhooks[conv.webhooks.length - 1];
        res.status(201).json({
            webhook: created,
            webhookUrl: `${process.env.BACKEND_URL || 'https://level-three-project-devsup.onrender.com'}/api/webhooks/incoming/${token}`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/webhooks/conversation/:conversationId/:webhookId
router.delete('/conversation/:conversationId/:webhookId', requireAuth, async (req, res) => {
    try {
        const { conversationId, webhookId } = req.params;
        const conv = await Conversation.findById(conversationId);
        if (!conv) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        conv.webhooks = conv.webhooks.filter(w => String(w._id) !== String(webhookId) && w.token !== webhookId);
        await conv.save();

        res.json({ success: true, message: 'Webhook deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2. Incoming Webhook Ingestion (Public Token)
// ==========================================

router.post(['/incoming/:token', '/:token'], async (req, res) => {
    try {
        const { token } = req.params;
        const conv = await Conversation.findOne({ 'webhooks.token': token });

        if (!conv) {
            return res.status(404).json({ error: 'Invalid or expired webhook token' });
        }

        const webhookMeta = conv.webhooks.find(w => w.token === token);
        const headers = req.headers;
        const body = req.body || {};

        let alertData = {
            service: webhookMeta?.service || 'custom',
            status: 'info',
            title: 'DevOps Notification',
            description: '',
            branch: '',
            commit: '',
            author: '',
            url: '',
            environment: '',
            fields: []
        };

        // 1. Detect GitHub Event
        const githubEvent = headers['x-github-event'];
        if (githubEvent) {
            alertData.service = 'github';
            if (githubEvent === 'push') {
                const repoName = body.repository?.full_name || 'Repository';
                const branch = body.ref ? body.ref.replace('refs/heads/', '') : 'main';
                const commits = body.commits || [];
                const latestCommit = commits[commits.length - 1];
                const author = body.pusher?.name || latestCommit?.author?.name || 'GitHub User';

                alertData.status = 'info';
                alertData.title = `[GitHub Push] ${commits.length} new commit(s) pushed to ${repoName}`;
                alertData.branch = branch;
                alertData.author = author;
                alertData.url = body.compare || body.repository?.html_url || '';
                alertData.commit = latestCommit ? latestCommit.id?.slice(0, 7) : '';
                alertData.description = latestCommit?.message || 'New commits pushed';
            } else if (githubEvent === 'pull_request') {
                const pr = body.pull_request || {};
                const action = body.action || 'opened';
                const isMerged = pr.merged;

                alertData.status = isMerged ? 'success' : (action === 'closed' ? 'failure' : 'info');
                alertData.title = `[GitHub PR #${pr.number}] ${action.toUpperCase()}: ${pr.title}`;
                alertData.branch = pr.head?.ref || '';
                alertData.author = pr.user?.login || 'Developer';
                alertData.url = pr.html_url || '';
                alertData.description = pr.body ? (pr.body.slice(0, 140) + '...') : '';
                alertData.fields.push({ label: 'Base', value: pr.base?.ref || 'main' });
            } else if (githubEvent === 'workflow_run') {
                const run = body.workflow_run || {};
                const conclusion = run.conclusion || 'in_progress';
                const isSuccess = conclusion === 'success';
                const isFailure = conclusion === 'failure';

                alertData.status = isSuccess ? 'success' : (isFailure ? 'failure' : 'pending');
                alertData.title = `[GitHub CI/CD] ${run.name}: ${conclusion.toUpperCase()}`;
                alertData.branch = run.head_branch || '';
                alertData.commit = run.head_sha?.slice(0, 7) || '';
                alertData.author = run.actor?.login || 'CI Runner';
                alertData.url = run.html_url || '';
                alertData.description = run.head_commit?.message || 'GitHub Actions workflow triggered';
            } else if (githubEvent === 'issues') {
                const issue = body.issue || {};
                alertData.title = `[GitHub Issue #${issue.number}] ${body.action}: ${issue.title}`;
                alertData.url = issue.html_url || '';
                alertData.author = issue.user?.login || 'Developer';
                alertData.description = issue.body?.slice(0, 140) || '';
            } else {
                alertData.title = `[GitHub Event] ${githubEvent}`;
                alertData.description = `GitHub event ${githubEvent} triggered on ${body.repository?.full_name || 'repo'}`;
            }
        } 
        // 2. Detect Vercel Deployment Event
        else if (body.type?.startsWith('deployment.') || headers['x-vercel-signature']) {
            alertData.service = 'vercel';
            const deployment = body.payload?.deployment || body;
            const eventType = body.type || 'deployment';

            if (eventType.includes('succeeded') || deployment.readyState === 'READY') {
                alertData.status = 'success';
                alertData.title = `[Vercel] Deployment Ready: ${deployment.name || 'Project'}`;
            } else if (eventType.includes('error') || deployment.readyState === 'ERROR') {
                alertData.status = 'failure';
                alertData.title = `[Vercel] Deployment Failed: ${deployment.name || 'Project'}`;
            } else {
                alertData.status = 'pending';
                alertData.title = `[Vercel] Deploying: ${deployment.name || 'Project'}`;
            }

            alertData.url = deployment.url ? `https://${deployment.url}` : '';
            alertData.environment = deployment.target || 'production';
            alertData.branch = deployment.meta?.githubCommitRef || '';
            alertData.commit = deployment.meta?.githubCommitSha?.slice(0, 7) || '';
            alertData.author = deployment.meta?.githubCommitAuthorName || deployment.creator?.username || 'Vercel';
            alertData.description = deployment.meta?.githubCommitMessage || 'Vercel edge deployment updated';
        }
        // 3. Detect Sentry Exception Alert
        else if (headers['sentry-hook-resource'] || body.event?.event_id || body.issue) {
            alertData.service = 'sentry';
            alertData.status = 'failure';
            const issue = body.issue || body.event || {};

            alertData.title = `[Sentry Alert] ${issue.title || issue.message || 'Production Exception'}`;
            alertData.description = issue.culprit || issue.metadata?.value || 'Runtime exception caught in production environment.';
            alertData.url = issue.url || issue.web_url || '';
            alertData.environment = body.event?.environment || 'production';
            alertData.fields.push({ label: 'Platform', value: body.event?.platform || 'node' });
        }
        // 4. Custom / Generic DevOps Webhook
        else {
            alertData.service = body.service || webhookMeta?.service || 'custom';
            alertData.status = body.status || (body.success === true ? 'success' : (body.success === false ? 'failure' : 'info'));
            alertData.title = body.title || body.name || 'DevOps Pipeline Alert';
            alertData.description = body.description || body.message || body.text || JSON.stringify(body);
            alertData.branch = body.branch || '';
            alertData.commit = body.commit ? String(body.commit).slice(0, 7) : '';
            alertData.author = body.author || 'CI/CD Pipeline';
            alertData.url = body.url || body.link || '';
            alertData.environment = body.environment || body.env || '';
            if (Array.isArray(body.fields)) {
                alertData.fields = body.fields;
            }
        }

        // Increment sequence and save into conversation
        const botUser = await getOrCreateDevOpsBot();
        conv.messageSequence = (conv.messageSequence || 0) + 1;

        const formattedContent = `${alertData.title}${alertData.branch ? ` (${alertData.branch})` : ''}\n${alertData.description}`;

        const alertMessage = new Message({
            conversationId: conv._id,
            sender: botUser._id,
            content: formattedContent,
            devopsAlert: alertData,
            sequence: conv.messageSequence
        });

        await alertMessage.save();

        // Update webhook last triggered
        webhookMeta.lastTriggeredAt = new Date();
        conv.lastMessage = alertMessage._id;
        await conv.save();

        await alertMessage.populate([
            { path: 'sender', select: 'displayName avatarUrl username techDiscipline' }
        ]);

        // Broadcast to conversation room via Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.to(String(conv._id)).emit('receive_message', alertMessage);
            io.to(String(conv._id)).emit('devops_alert_received', {
                conversationId: conv._id,
                alert: alertData,
                message: alertMessage
            });
            if (conv.participants) {
                conv.participants.forEach(pId => {
                    io.to(`user:${String(pId)}`).emit('receive_message', alertMessage);
                });
            }
        }

        res.status(200).json({ success: true, messageId: alertMessage._id });
    } catch (err) {
        console.error('Webhook ingestion error:', err);
        res.status(500).json({ error: 'Webhook processing failed', details: err.message });
    }
});

export default router;

