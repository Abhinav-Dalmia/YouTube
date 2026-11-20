import { Router } from 'express';
import Comment from '../models/Comment.js';
import Video from '../models/Video.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils.js';

const router = Router({ mergeParams: true });
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const comments = await Comment.find({ video: req.params.videoId, parent: null })
    .populate('owner', 'name handle avatar').sort({ createdAt: -1 }).limit(200);
  res.json({ comments });
}));
router.post('/', protect, asyncHandler(async (req, res) => {
  if (!req.body.text?.trim()) return res.status(400).json({ message: 'Comment cannot be empty' });
  const video = await Video.findById(req.params.videoId);
  if (!video) return res.status(404).json({ message: 'Video not found' });
  const comment = await Comment.create({ video: video._id, owner: req.user._id, text: req.body.text.trim(), parent: req.body.parent || null });
  await comment.populate('owner', 'name handle avatar');
  res.status(201).json({ comment });
}));
router.delete('/:commentId', protect, asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return res.status(404).json({ message: 'Comment not found' });
  if (String(comment.owner) !== String(req.user._id)) return res.status(403).json({ message: 'You cannot delete this comment' });
  await Comment.deleteMany({ $or: [{ _id: comment._id }, { parent: comment._id }] });
  res.json({ message: 'Comment deleted' });
}));
export default router;
