import { Router } from 'express';
import Video from '../models/Video.js';
import User from '../models/User.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { uploadVideoFields } from '../middleware/upload.js';
import { deleteFromCloudinary, uploadToCloudinary } from '../config/cloudinary.js';
import { asyncHandler } from '../utils.js';
import fs from 'fs/promises';

const router = Router();

router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { q, category, sort = 'newest', limit = 40, page = 1, owner } = req.query;
  const filter = { visibility: 'public' };
  if (category && category !== 'All') filter.category = category;
  if (owner) filter.owner = owner;
  if (q?.trim()) filter.$text = { $search: q.trim() };
  const sortBy = q?.trim() ? { score: { $meta: 'textScore' }, createdAt: -1 } : sort === 'popular' ? { views: -1 } : { createdAt: -1 };
  let query = Video.find(filter).populate('owner', 'name handle avatar subscribers').sort(sortBy);
  if (filter.$text) query = query.select({ score: { $meta: 'textScore' } });
  const videos = await query.skip((Math.max(1, Number(page)) - 1) * Math.min(100, Number(limit))).limit(Math.min(100, Number(limit)));
  const total = await Video.countDocuments(filter);
  res.json({ videos, total, page: Number(page) });
}));

router.get('/mine', protect, asyncHandler(async (req, res) => {
  const videos = await Video.find({ owner: req.user._id }).populate('owner', 'name handle avatar').sort({ createdAt: -1 });
  res.json({ videos });
}));

router.get('/feed/subscriptions', protect, asyncHandler(async (req, res) => {
  const videos = await Video.find({ owner: { $in: req.user.subscriptions }, visibility: 'public' })
    .populate('owner', 'name handle avatar').sort({ createdAt: -1 }).limit(60);
  res.json({ videos });
}));

router.post('/upload', protect, uploadVideoFields, asyncHandler(async (req, res) => {
  const videoFile = req.files?.video?.[0];
  const { title, description, category = 'All', visibility = 'public', tags = '' } = req.body;
  const thumbFile = req.files?.thumbnail?.[0];
  let cloudVideo;
  let cloudThumbnail;
  let recordSaved = false;
  const stagedFiles = [videoFile, thumbFile].filter(Boolean);
  try {
    if (!videoFile) return res.status(400).json({ message: 'Choose a video file to upload' });
    if (!title?.trim()) return res.status(400).json({ message: 'Video title is required' });
    cloudVideo = await uploadToCloudinary(videoFile.path, {
      resourceType: 'video',
      folder: `youtube-clone/${req.user._id}/videos`
    });
    if (thumbFile) {
      cloudThumbnail = await uploadToCloudinary(thumbFile.path, {
        resourceType: 'image',
        folder: `youtube-clone/${req.user._id}/thumbnails`
      });
    }
    const video = await Video.create({
      title: title.trim(), description: description || '', category,
      visibility: ['public', 'unlisted', 'private'].includes(visibility) ? visibility : 'public',
      tags: String(tags).split(',').map(t => t.trim()).filter(Boolean).slice(0, 15),
      videoUrl: cloudVideo.secure_url,
      videoPublicId: cloudVideo.public_id,
      duration: cloudVideo.duration || 0,
      thumbnailUrl: cloudThumbnail?.secure_url || '',
      thumbnailPublicId: cloudThumbnail?.public_id || '',
      owner: req.user._id
    });
    recordSaved = true;
    await video.populate('owner', 'name handle avatar');
    res.status(201).json({ video, message: 'Video uploaded successfully' });
  } catch (error) {
    if (!recordSaved) {
      await Promise.allSettled([
        cloudVideo?.public_id ? deleteFromCloudinary(cloudVideo.public_id, 'video') : Promise.resolve(),
        cloudThumbnail?.public_id ? deleteFromCloudinary(cloudThumbnail.public_id, 'image') : Promise.resolve()
      ]);
    }
    throw error;
  } finally {
    await Promise.all(stagedFiles.map(file => fs.unlink(file.path).catch(() => {})));
  }
}));

router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id).populate('owner', 'name handle avatar subscribers');
  if (!video || (video.visibility === 'private' && String(video.owner._id) !== String(req.optionalUserId))) return res.status(404).json({ message: 'Video not found' });
  res.json({ video });
}));

router.post('/:id/view', optionalAuth, asyncHandler(async (req, res) => {
  const video = await Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
  if (!video) return res.status(404).json({ message: 'Video not found' });
  if (req.optionalUserId) {
    await User.updateOne({ _id: req.optionalUserId }, { $pull: { watchHistory: { video: video._id } } });
    await User.updateOne({ _id: req.optionalUserId }, { $push: { watchHistory: { $each: [{ video: video._id, watchedAt: new Date() }], $position: 0, $slice: 500 } } });
  }
  res.json({ views: video.views });
}));

router.post('/:id/reaction', protect, asyncHandler(async (req, res) => {
  const { reaction } = req.body;
  if (!['like', 'dislike'].includes(reaction)) return res.status(400).json({ message: 'Reaction must be like or dislike' });
  const video = await Video.findById(req.params.id);
  if (!video) return res.status(404).json({ message: 'Video not found' });
  const uid = String(req.user._id);
  const liked = video.likes.some(id => String(id) === uid);
  const disliked = video.dislikes.some(id => String(id) === uid);
  if (reaction === 'like') {
    video.likes = video.likes.filter(id => String(id) !== uid);
    video.dislikes = video.dislikes.filter(id => String(id) !== uid);
    if (!liked) video.likes.push(req.user._id);
  } else {
    video.dislikes = video.dislikes.filter(id => String(id) !== uid);
    video.likes = video.likes.filter(id => String(id) !== uid);
    if (!disliked) video.dislikes.push(req.user._id);
  }
  await video.save();
  if (reaction === 'like' && !liked) await User.updateOne({ _id: req.user._id }, { $addToSet: { likedVideos: video._id } });
  else if (reaction === 'like' && liked) await User.updateOne({ _id: req.user._id }, { $pull: { likedVideos: video._id } });
  else await User.updateOne({ _id: req.user._id }, { $pull: { likedVideos: video._id } });
  res.json({ likes: video.likes.length, dislikes: video.dislikes.length, userReaction: reaction === 'like' ? (liked ? null : 'like') : (disliked ? null : 'dislike') });
}));

router.patch('/:id', protect, asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) return res.status(404).json({ message: 'Video not found' });
  if (String(video.owner) !== String(req.user._id)) return res.status(403).json({ message: 'You cannot edit this video' });
  for (const key of ['title', 'description', 'category', 'visibility']) if (req.body[key] !== undefined) video[key] = req.body[key];
  await video.save();
  res.json({ video });
}));

router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (!video) return res.status(404).json({ message: 'Video not found' });
  if (String(video.owner) !== String(req.user._id)) return res.status(403).json({ message: 'You cannot delete this video' });
  await Promise.all([
    video.deleteOne(),
    (await import('../models/Comment.js')).default.deleteMany({ video: video._id }),
    (await import('../models/Playlist.js')).default.updateMany({}, { $pull: { videos: video._id } }),
    User.updateMany({}, { $pull: { likedVideos: video._id, watchLater: video._id, watchHistory: { video: video._id } } })
  ]);
  const cleanup = await Promise.allSettled([
    video.videoPublicId ? deleteFromCloudinary(video.videoPublicId, 'video') : Promise.resolve(),
    video.thumbnailPublicId ? deleteFromCloudinary(video.thumbnailPublicId, 'image') : Promise.resolve()
  ]);
  for (const result of cleanup) if (result.status === 'rejected') console.error('Cloudinary asset cleanup failed:', result.reason?.message || 'unknown error');
  res.json({ message: 'Video deleted' });
}));

export default router;
