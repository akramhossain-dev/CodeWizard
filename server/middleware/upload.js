import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Storage engine ─────────────────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// ── File type filters ──────────────────────────────────────────────────────
const imageOnlyFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP images are allowed.`), false);
    }
};

const anyMediaFilter = (req, file, cb) => {
    const allowed = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/avi', 'video/mov'
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Only images and videos are allowed.`), false);
    }
};

// ── Profile picture upload — 5 MB, images only, single file ───────────────
export const uploadProfilePicture = multer({
    storage,
    fileFilter: imageOnlyFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,  // 5 MB — prevents DoS via oversized images
        files: 1
    }
});

// ── General media upload — 50 MB, images + video, up to 10 files ──────────
// (kept for any future admin/content upload routes)
export const upload = multer({
    storage,
    fileFilter: anyMediaFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB
        files: 10
    }
});

// ── Multer error handler middleware ────────────────────────────────────────
export const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({ success: false, message: 'File too large. Maximum size is 5 MB.' });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({ success: false, message: 'Too many files uploaded.' });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({ success: false, message: 'Unexpected file field.' });
            default:
                return res.status(400).json({ success: false, message: 'File upload error.' });
        }
    }
    if (error?.message?.includes('Invalid file type')) {
        return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
};

export default upload;