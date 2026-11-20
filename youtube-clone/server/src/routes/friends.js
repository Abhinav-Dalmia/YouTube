import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import Conversation from '../models/Conversation.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils.js';

const router = Router();
const userFields = 'name handle avatar';
const pairKey = (a, b) => [String(a), String(b)].sort().join(':');

async function establishFriendship(request) {
  await Promise.all([
    User.updateOne({ _id: request.from }, { $addToSet: { friends: request.to } }),
    User.updateOne({ _id: request.to }, { $addToSet: { friends: request.from } })
  ]);
  const participants = [request.from, request.to].sort((a, b) => String(a).localeCompare(String(b)));
  return Conversation.findOneAndUpdate(
    { participantKey: pairKey(...participants) },
    { $setOnInsert: { type: 'direct', participants, participantKey: pairKey(...participants) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

router.use(protect);

router.get('/search', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().replace(/^@/, '').slice(0, 50);
  if (q.length < 2) return res.json({ users: [] });
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = await User.find({
    _id: { $ne: req.user._id },
    $or: [{ handle: { $regex: escaped, $options: 'i' } }, { name: { $regex: escaped, $options: 'i' } }]
  }).select(userFields).limit(12).lean();
  const ids = matches.map(user => user._id);
  const requests = ids.length ? await FriendRequest.find({
    status: 'pending',
    $or: [{ from: req.user._id, to: { $in: ids } }, { to: req.user._id, from: { $in: ids } }]
  }).select('from to').lean() : [];
  const friends = new Set(req.user.friends.map(id => String(id)));
  res.json({ users: matches.filter(user => !friends.has(String(user._id))).map(user => {
    const request = requests.find(item => String(item.from) === String(user._id) || String(item.to) === String(user._id));
    return { ...user, requestStatus: request ? (String(request.from) === String(req.user._id) ? 'outgoing' : 'incoming') : null };
  }) });
}));

router.get('/', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('friends', userFields);
  res.json({ friends: (user?.friends || []).filter(Boolean) });
}));

router.get('/requests', asyncHandler(async (req, res) => {
  const [incoming, outgoing] = await Promise.all([
    FriendRequest.find({ to: req.user._id, status: 'pending' }).populate('from', userFields).sort({ createdAt: -1 }),
    FriendRequest.find({ from: req.user._id, status: 'pending' }).populate('to', userFields).sort({ createdAt: -1 })
  ]);
  res.json({ incoming, outgoing });
}));

router.post('/requests', asyncHandler(async (req, res) => {
  const targetId = String(req.body.userId || '');
  if (!mongoose.isValidObjectId(targetId)) return res.status(400).json({ message: 'Choose a valid account' });
  if (targetId === String(req.user._id)) return res.status(400).json({ message: 'You cannot add yourself as a friend' });
  const target = await User.findById(targetId).select('_id friends');
  if (!target) return res.status(404).json({ message: 'Account not found' });
  if (req.user.friends.some(id => String(id) === targetId)) return res.status(409).json({ message: 'You are already friends' });

  const reverse = await FriendRequest.findOne({ from: targetId, to: req.user._id, status: 'pending' });
  if (reverse) {
    reverse.status = 'accepted';
    await reverse.save();
    const conversation = await establishFriendship(reverse);
    return res.status(200).json({ accepted: true, conversationId: conversation._id, message: 'Friend request accepted' });
  }
  const prior = await FriendRequest.findOne({ from: req.user._id, to: targetId });
  if (prior?.status === 'pending') return res.status(409).json({ message: 'Friend request already sent' });
  if (prior) {
    prior.status = 'pending';
    await prior.save();
    return res.status(201).json({ request: prior, message: 'Friend request sent' });
  }
  const request = await FriendRequest.create({ from: req.user._id, to: targetId });
  res.status(201).json({ request, message: 'Friend request sent' });
}));

router.patch('/requests/:requestId', asyncHandler(async (req, res) => {
  const { action } = req.body;
  if (!['accept', 'decline'].includes(action)) return res.status(400).json({ message: 'Action must be accept or decline' });
  const request = await FriendRequest.findOne({ _id: req.params.requestId, to: req.user._id, status: 'pending' });
  if (!request) return res.status(404).json({ message: 'Pending friend request not found' });
  request.status = action === 'accept' ? 'accepted' : 'declined';
  await request.save();
  if (action === 'decline') return res.json({ accepted: false, message: 'Request declined' });
  const conversation = await establishFriendship(request);
  res.json({ accepted: true, conversationId: conversation._id, message: 'Friend request accepted' });
}));

router.delete('/:friendId', asyncHandler(async (req, res) => {
  const friendId = String(req.params.friendId);
  if (!mongoose.isValidObjectId(friendId)) return res.status(400).json({ message: 'Choose a valid friend' });
  await Promise.all([
    User.updateOne({ _id: req.user._id }, { $pull: { friends: friendId } }),
    User.updateOne({ _id: friendId }, { $pull: { friends: req.user._id } })
  ]);
  res.json({ removed: true });
}));

export default router;
