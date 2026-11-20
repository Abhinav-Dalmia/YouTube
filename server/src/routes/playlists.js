import { Router } from 'express';
import Playlist from '../models/Playlist.js';
import Video from '../models/Video.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils.js';

const router = Router();
router.get('/', protect, asyncHandler(async (req, res) => {
  const playlists = await Playlist.find({ owner: req.user._id }).populate({ path: 'videos', populate: { path: 'owner', select: 'name handle avatar' } }).sort({ updatedAt: -1 });
  res.json({ playlists });
}));
router.post('/', protect, asyncHandler(async (req, res) => {
  if (!req.body.title?.trim()) return res.status(400).json({ message: 'Playlist title is required' });
  const playlist = await Playlist.create({ title: req.body.title.trim(), description: req.body.description || '', visibility: req.body.visibility || 'private', owner: req.user._id });
  res.status(201).json({ playlist });
}));
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const playlist = await Playlist.findById(req.params.id).populate({ path: 'videos', populate: { path: 'owner', select: 'name handle avatar' } }).populate('owner', 'name handle avatar');
  if (!playlist || (playlist.visibility === 'private' && String(playlist.owner._id) !== String(req.optionalUserId))) return res.status(404).json({ message: 'Playlist not found' });
  res.json({ playlist });
}));
router.post('/:id/videos', protect, asyncHandler(async (req, res) => {
  const playlist = await Playlist.findOne({ _id: req.params.id, owner: req.user._id });
  if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
  const video = await Video.findById(req.body.videoId);
  if (!video) return res.status(404).json({ message: 'Video not found' });
  playlist.videos.addToSet(video._id);
  await playlist.save();
  res.json({ playlist });
}));
router.delete('/:id/videos/:videoId', protect, asyncHandler(async (req, res) => {
  const playlist = await Playlist.findOne({ _id: req.params.id, owner: req.user._id });
  if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
  playlist.videos.pull(req.params.videoId);
  await playlist.save();
  res.json({ playlist });
}));
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const playlist = await Playlist.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!playlist) return res.status(404).json({ message: 'Playlist not found' });
  res.json({ message: 'Playlist deleted' });
}));
export default router;
