import express from 'express';
import { upload } from '../middleware/upload.js';
import { requireAuth } from '../middleware/auth.js';
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
// Allows opening files directly in mobile apps (Word, WPS, PDF readers) without redirecting to Cloudinary
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

        // Fetch from Cloudinary on server side (no CORS blocks, follows redirects)
        const cloudRes = await fetch(fileUrl);
        if (!cloudRes.ok) {
            return res.status(cloudRes.status).send('File not found or inaccessible on storage');
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
