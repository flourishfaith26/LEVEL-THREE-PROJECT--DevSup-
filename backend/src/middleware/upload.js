import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const ext = path.extname(file.originalname || '');
        const baseName = path.basename(file.originalname || 'document', ext)
            .replace(/[^a-zA-Z0-9_\-]/g, '_')
            .slice(0, 50) || 'document';
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e4)}`;

        const isImage = file.mimetype?.startsWith('image/');
        const isVideo = file.mimetype?.startsWith('video/');
        const isAudio = file.mimetype?.startsWith('audio/');

        let resourceType = 'auto';
        if (isImage) {
            resourceType = 'image';
        } else if (isVideo || isAudio) {
            resourceType = 'video';
        } else {
            // For all documents (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, etc.), store as raw
            // with explicit extension so Cloudinary never rasterizes, alters, or corrupts the file
            resourceType = 'raw';
        }

        // For raw files, Cloudinary requires the public_id to include the exact extension
        // so that the delivered file retains its extension and content type
        const publicId = resourceType === 'raw'
            ? `${baseName}_${uniqueSuffix}${ext || ''}`
            : `${baseName}_${uniqueSuffix}`;

        return {
            folder: 'devsup_attachments',
            resource_type: resourceType,
            public_id: publicId
        };
    }
});

export const upload = multer({ storage });
