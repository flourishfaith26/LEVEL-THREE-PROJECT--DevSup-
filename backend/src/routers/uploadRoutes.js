import express from 'express';
import { upload } from '../middleware/upload.js';
import { requireAuth } from '../middleware/auth.js';

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

export default router;