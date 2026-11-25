import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../tmp/uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  }
});
const maxBytes = Number(process.env.MAX_UPLOAD_MB || 512) * 1024 * 1024;
export const upload = multer({
  storage,
  limits: { fileSize: maxBytes, files: 2 },
  fileFilter: (_req, file, cb) => {
    const accepted = file.fieldname === 'video'
      ? ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'].includes(file.mimetype)
      : ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    cb(accepted ? null : new Error(`Unsupported ${file.fieldname} file type`), accepted);
  }
});

export const uploadVideoFields = (req, res, next) => {
  upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }])(req, res, async error => {
    if (!error) return next();
    const files = Object.values(req.files || {}).flat();
    await Promise.all(files.map(file => fs.promises.unlink(file.path).catch(() => {})));
    next(error);
  });
};
