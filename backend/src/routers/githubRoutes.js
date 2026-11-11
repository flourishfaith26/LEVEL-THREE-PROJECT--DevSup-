import express from 'express';
import User from '../models/User.js';

const router = express.Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Helper: Determine frontend origin to redirect back to
const getFrontendUrl = (req, stateUrl) => {
    if (stateUrl && (stateUrl.startsWith('http://') || stateUrl.startsWith('https://'))) {
        try {
            const parsed = new URL(stateUrl);
            return `${parsed.protocol}//${parsed.host}`;
        } catch (e) {
            // fall through
        }
    }
    const origin = req.headers.origin || req.headers.referer;
    if (origin && (origin.includes('devsupchat.com') || origin.includes('vercel.app') || origin.includes('localhost'))) {
        try {
            const parsed = new URL(origin);
            return `${parsed.protocol}//${parsed.host}`;
        } catch (e) {
            // fall through
        }
    }
    return process.env.FRONTEND_URL || 'https://devsupchat.com';
};

/**
 * 1. Initiate GitHub OAuth flow
 * GET /api/github/auth-url?userId=...&returnTo=...
 */
router.get('/auth-url', (req, res) => {
    const { userId, returnTo } = req.query;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    const statePayload = Buffer.from(JSON.stringify({
        userId,
        returnTo: returnTo || 'https://devsupchat.com/dashboard'
    })).toString('base64url');

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=read:user,repo&state=${statePayload}`;
    res.json({ url: githubAuthUrl });
});

/**
 * 2. GitHub OAuth Callback
 * GET /api/github/callback?code=...&state=...
 */
router.get('/callback', async (req, res) => {
    const { code, state } = req.query;

    let userId = null;
    let returnTo = 'https://devsupchat.com/dashboard';

    if (state) {
        try {
            const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
            userId = decoded.userId;
            if (decoded.returnTo) returnTo = decoded.returnTo;
        } catch (e) {
            console.warn('Could not parse GitHub OAuth state:', e.message);
        }
    }

    const frontendBase = getFrontendUrl(req, returnTo);

    if (!code) {
        return res.redirect(`${frontendBase}/dashboard?github_error=missing_code`);
    }

    try {
        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error || !tokenData.access_token) {
            console.error('GitHub token exchange error:', tokenData);
            return res.redirect(`${frontendBase}/dashboard?github_error=token_exchange_failed`);
        }

        const accessToken = tokenData.access_token;

        // Fetch user profile from GitHub API
        const ghUserRes = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'User-Agent': 'DevSup-Platform'
            }
        });

        const ghUser = await ghUserRes.json();

        if (!ghUser || !ghUser.login) {
            return res.redirect(`${frontendBase}/dashboard?github_error=profile_fetch_failed`);
        }

        // Fetch user's recent repos to determine top languages
        let topLanguages = [];
        try {
            const reposRes = await fetch('https://api.github.com/user/repos?sort=updated&per_page=12', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'User-Agent': 'DevSup-Platform'
                }
            });
            const repos = await reposRes.json();
            if (Array.isArray(repos)) {
                const langCounts = {};
                repos.forEach(r => {
                    if (r.language) {
                        langCounts[r.language] = (langCounts[r.language] || 0) + 1;
                    }
                });
                topLanguages = Object.entries(langCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(entry => entry[0]);
            }
        } catch (langErr) {
            console.warn('Could not compute top languages:', langErr.message);
        }

        // Update User in MongoDB
        if (userId) {
            await User.findByIdAndUpdate(userId, {
                githubId: String(ghUser.id),
                githubUsername: ghUser.login,
                githubProfileUrl: ghUser.html_url,
                githubProfile: ghUser.html_url,
                githubVerified: true,
                githubStats: {
                    publicRepos: ghUser.public_repos || 0,
                    followers: ghUser.followers || 0,
                    publicGists: ghUser.public_gists || 0,
                    avatarUrl: ghUser.avatar_url || '',
                    topLanguages
                }
            });
        }

        return res.redirect(`${frontendBase}/dashboard?github_verified=true&gh_user=${encodeURIComponent(ghUser.login)}`);
    } catch (err) {
        console.error('GitHub callback execution failed:', err);
        return res.redirect(`${frontendBase}/dashboard?github_error=internal_error`);
    }
});

/**
 * 3. Disconnect GitHub Profile
 * POST /api/github/disconnect
 */
router.post('/disconnect', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const updated = await User.findByIdAndUpdate(userId, {
            githubId: '',
            githubUsername: '',
            githubProfileUrl: '',
            githubProfile: '',
            githubVerified: false,
            githubStats: {
                publicRepos: 0,
                followers: 0,
                publicGists: 0,
                avatarUrl: '',
                topLanguages: []
            }
        }, { new: true });

        res.json({ success: true, user: updated });
    } catch (err) {
        console.error('Failed to disconnect GitHub:', err);
        res.status(500).json({ error: 'Failed to disconnect GitHub' });
    }
});

/**
 * 4. Rich GitHub Repo & PR Preview Unfurling
 * GET /api/github/preview?url=https://github.com/owner/repo
 */
router.get('/preview', async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Valid URL is required' });
    }

    try {
        const parsed = new URL(url);
        if (parsed.hostname !== 'github.com') {
            return res.status(400).json({ error: 'Not a GitHub URL' });
        }

        const pathParts = parsed.pathname.split('/').filter(Boolean);
        if (pathParts.length < 2) {
            return res.status(400).json({ error: 'URL must reference a repository' });
        }

        const [owner, repo, type, number] = pathParts;

        const authHeaders = {
            'User-Agent': 'DevSup-Platform',
            Accept: 'application/vnd.github.v3+json'
        };

        if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
            authHeaders.Authorization = `Basic ${Buffer.from(`${GITHUB_CLIENT_ID}:${GITHUB_CLIENT_SECRET}`).toString('base64')}`;
        }

        // If it's a Pull Request or Issue
        if ((type === 'pull' || type === 'issues') && number) {
            const endpoint = `https://api.github.com/repos/${owner}/${repo}/${type === 'pull' ? 'pulls' : 'issues'}/${number}`;
            const itemRes = await fetch(endpoint, { headers: authHeaders });
            if (itemRes.ok) {
                const item = await itemRes.json();
                return res.json({
                    isItem: true,
                    type: type === 'pull' ? 'pull_request' : 'issue',
                    owner,
                    repo,
                    number,
                    title: item.title,
                    state: item.state, // open / closed / merged
                    author: item.user?.login,
                    authorAvatar: item.user?.avatar_url,
                    createdAt: item.created_at,
                    commentsCount: item.comments || 0,
                    url: item.html_url
                });
            }
        }

        // Default: Repository Preview
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: authHeaders });
        if (!repoRes.ok) {
            return res.status(repoRes.status).json({ error: 'Could not fetch repository' });
        }

        const r = await repoRes.json();
        return res.json({
            isRepo: true,
            owner,
            repo: r.name,
            fullName: r.full_name,
            description: r.description,
            stars: r.stargazers_count,
            forks: r.forks_count,
            openIssues: r.open_issues_count,
            language: r.language,
            ownerAvatar: r.owner?.avatar_url,
            defaultBranch: r.default_branch,
            license: r.license?.spdx_id || r.license?.name || null,
            updatedAt: r.updated_at,
            url: r.html_url
        });
    } catch (err) {
        console.error('Error previewing GitHub URL:', err);
        return res.status(500).json({ error: 'Failed to preview GitHub URL' });
    }
});

export default router;
