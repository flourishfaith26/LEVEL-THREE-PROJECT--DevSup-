import express from 'express';
import { upload } from '../middleware/upload.js';
import { requireAuth } from '../middleware/auth.js';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';

const router = express.Router();

router.post('/', requireAuth, upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file provided' });
        res.status(200).json({ fileUrl: req.file.path });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Proxy endpoint to stream files from Cloudinary with full CORS and correct headers
// Uses Cloudinary signed private download URLs to bypass account-level PDF/document delivery restrictions
router.get('/file', async (req, res) => {
    try {
        const fileUrl = req.query.url;
        const filename = req.query.name || 'document';

        if (!fileUrl) {
            return res.status(400).send('File URL is required');
        }

        const parsedUrl = new URL(fileUrl);
        if (!parsedUrl.hostname.endsWith('cloudinary.com')) {
            return res.status(403).send('Invalid file source');
        }

        const ext = path.extname(filename).toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === '.pdf') mimeType = 'application/pdf';
        else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (ext === '.doc') mimeType = 'application/msword';
        else if (ext === '.xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        else if (ext === '.xls') mimeType = 'application/vnd.ms-excel';
        else if (ext === '.pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        else if (ext === '.ppt') mimeType = 'application/vnd.ms-powerpoint';
        else if (ext === '.txt') mimeType = 'text/plain';
        else if (ext === '.csv') mimeType = 'text/csv';
        else if (ext === '.zip') mimeType = 'application/zip';
        else if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';

        // Extract public_id from Cloudinary URL (e.g. devsup_attachments/my_file.pdf)
        const match = fileUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/);
        let publicId = match ? decodeURIComponent(match[1]).split('?')[0] : null;

        let cloudRes = null;

        // 1. Authenticated signed download URL using Cloudinary SDK (bypasses all delivery restrictions)
        if (publicId) {
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET
            });

            const isRaw = fileUrl.includes('/raw/');
            const candidateConfigs = [
                { resource_type: isRaw ? 'raw' : 'image', id: publicId },
                { resource_type: isRaw ? 'image' : 'raw', id: publicId },
                { resource_type: 'image', id: publicId.replace(/\.[^/.]+$/, '') },
                { resource_type: 'raw', id: publicId.replace(/\.[^/.]+$/, '') }
            ];

            for (const cfg of candidateConfigs) {
                try {
                    const signedUrl = cloudinary.utils.private_download_url(cfg.id, '', {
                        resource_type: cfg.resource_type,
                        type: 'upload',
                        expires_at: Math.floor(Date.now() / 1000) + 3600
                    });
                    const resTest = await fetch(signedUrl);
                    if (resTest.ok) {
                        cloudRes = resTest;
                        break;
                    }
                } catch {
                    // Try next candidate
                }
            }
        }

        // 2. Fallback: Direct fetch
        if (!cloudRes) {
            const directRes = await fetch(fileUrl);
            if (directRes.ok) {
                cloudRes = directRes;
            }
        }

        // 3. Fallback: Try swapping raw and image paths if needed
        if (!cloudRes && fileUrl.includes('/raw/')) {
            const imgUrl = fileUrl.replace('/raw/', '/image/');
            const imgRes = await fetch(imgUrl);
            if (imgRes.ok) cloudRes = imgRes;
        }

        if (!cloudRes || !cloudRes.ok) {
            return res.status(404).send('File not found or inaccessible on storage');
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Content-Type', mimeType);

        const safeName = filename.replace(/["\r\n]/g, '_');
        res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);

        const contentLength = cloudRes.headers.get('content-length');
        if (contentLength) {
            res.setHeader('Content-Length', contentLength);
        }

        const buffer = await cloudRes.arrayBuffer();
        res.end(Buffer.from(buffer));
    } catch (err) {
        console.error('File route error:', err);
        if (!res.headersSent) {
            res.status(500).send('Server error');
        }
    }
});

export default router;
