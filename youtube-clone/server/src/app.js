import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import videoRoutes from './routes/videos.js';
import commentRoutes from './routes/comments.js';
import userRoutes from './routes/users.js';
import playlistRoutes from './routes/playlists.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads'), { maxAge: '7d' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'youtube-clone-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/videos/:videoId/comments', commentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/playlists', playlistRoutes);

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }));
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.name === 'ValidationError' ? 400 : err.name === 'CastError' ? 400 : err.code === 11000 ? 409 : err.name === 'MulterError' ? 400 : 500;
  res.status(status).json({ message: status === 500 ? 'Something went wrong on the server' : err.message });
});
export default app;
