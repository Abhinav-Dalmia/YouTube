import { Router } from 'express';
import User from '../models/User.js';
import Video from '../models/Video.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { asyncHandler, safeUser } from '../utils.js';

const router = Router();
router.get('/watch-later', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({ path: 'watchLater', populate: { path: 'owner', select: 'name handle avatar' } });
  res.json({ videos: user.watchLater.filter(Boolean) });
}));
router.post('/watch-later/:videoId', protect, asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.videoId);
  if (!video) return res.status(404).json({ message: 'Video not found' });
  const exists = req.user.watchLater.some(id => String(id) === String(video._id));
  if (exists) req.user.watchLater.pull(video._id); else req.user.watchLater.addToSet(video._id);
  await req.user.save();
  res.json({ saved: !exists });
}));
router.get('/history', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({ path: 'watchHistory.video', populate: { path: 'owner', select: 'name handle avatar' } });
  const videos = user.watchHistory.filter(item => item.video).map(item => ({ ...item.video.toObject(), watchedAt: item.watchedAt }));
  res.json({ videos });
}));
router.get('/liked', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({ path: 'likedVideos', populate: { path: 'owner', select: 'name handle avatar' } });
  res.json({ videos: user.likedVideos.filter(Boolean) });
}));
router.get('/:handle', optionalAuth, asyncHandler(async (req, res) => {
  const handle = req.params.handle.replace(/^@/, '').toLowerCase();
  const user = await User.findOne({ handle });
  if (!user) return res.status(404).json({ message: 'Channel not found' });
  const videos = await Video.find({ owner: user._id, visibility: 'public' }).sort({ createdAt: -1 }).populate('owner', 'name handle avatar');
  res.json({ channel: safeUser(user), videos, isSubscribed: req.optionalUserId ? user.subscribers.some(id => String(id) === req.optionalUserId) : false });
}));
router.post('/:id/subscribe', protect, asyncHandler(async (req, res) => {
  if (String(req.user._id) === req.params.id) return res.status(400).json({ message: 'You cannot subscribe to your own channel' });
  const channel = await User.findById(req.params.id);
  if (!channel) return res.status(404).json({ message: 'Channel not found' });
  const already = channel.subscribers.some(id => String(id) === String(req.user._id));
  if (already) {
    channel.subscribers.pull(req.user._id);
    req.user.subscriptions.pull(channel._id);
  } else {
    channel.subscribers.addToSet(req.user._id);
    req.user.subscriptions.addToSet(channel._id);
  }
  await Promise.all([channel.save(), req.user.save()]);
  res.json({ subscribed: !already, subscriberCount: channel.subscribers.length });
}));
router.patch('/profile/me', protect, asyncHandler(async (req, res) => {
  for (const key of ['name', 'description', 'avatar', 'banner']) if (req.body[key] !== undefined) req.user[key] = req.body[key];
  await req.user.save();
  res.json({ user: safeUser(req.user) });
}));
export default router;
