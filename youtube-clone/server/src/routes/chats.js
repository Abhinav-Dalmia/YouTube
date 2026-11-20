import { Router } from 'express';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Video from '../models/Video.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils.js';

const router = Router();
const userFields = 'name handle avatar';

async function getChat(conversationId, userId) {
  if (!mongoose.isValidObjectId(conversationId)) return null;
  const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
  if (!conversation) return null;
  const otherId = conversation.participants.find(id => String(id) !== String(userId));
  const [user, other] = await Promise.all([
    User.findById(userId).select('friends'),
    User.findById(otherId).select('friends')
  ]);
  const isMutualFriend = user?.friends.some(id => String(id) === String(otherId)) && other?.friends.some(id => String(id) === String(userId));
  return isMutualFriend ? conversation : null;
}

function exposeMessage(message, viewerId) {
  const item = message.toObject ? message.toObject() : message;
  const video = item.sharedVideo;
  const blocked = video && (video.visibility === 'private' || !video.allowFriendSharing) && String(video.owner?._id || video.owner) !== String(viewerId);
  if (blocked) {
    item.sharedVideo = null;
    item.videoUnavailable = true;
  }
  return item;
}

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('friends');
  const conversations = await Conversation.find({ participants: req.user._id }).sort({ lastMessageAt: -1, updatedAt: -1 })
    .populate('participants', userFields).populate({ path: 'lastMessage', populate: [{ path: 'sender', select: userFields }, { path: 'sharedVideo', select: 'title thumbnailUrl visibility allowFriendSharing owner' }] });
  const friendIds = new Set((user?.friends || []).map(id => String(id)));
  const valid = conversations.filter(chat => chat.participants.filter(Boolean).some(p => String(p._id) !== String(req.user._id) && friendIds.has(String(p._id))));
  res.json({ conversations: valid.map(chat => ({ ...chat.toObject(), lastMessage: chat.lastMessage ? exposeMessage(chat.lastMessage, req.user._id) : null })) });
}));

router.get('/:conversationId/messages', asyncHandler(async (req, res) => {
  const conversation = await getChat(req.params.conversationId, req.user._id);
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
  const filter = { conversation: conversation._id };
  if (req.query.before && mongoose.isValidObjectId(req.query.before)) filter._id = { $lt: req.query.before };
  const messages = await Message.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit)
    .populate('sender', userFields).populate({ path: 'sharedVideo', select: 'title thumbnailUrl duration visibility allowFriendSharing owner' });
  await Message.updateMany({ conversation: conversation._id, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } }, { $addToSet: { readBy: req.user._id } });
  res.json({ messages: messages.reverse().map(message => exposeMessage(message, req.user._id)) });
}));

router.post('/:conversationId/messages', asyncHandler(async (req, res) => {
  const conversation = await getChat(req.params.conversationId, req.user._id);
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });
  const { type = 'text', text = '', videoId } = req.body;
  if (!['text', 'video'].includes(type)) return res.status(400).json({ message: 'Message type must be text or video' });
  let video = null;
  if (type === 'video') {
    if (!mongoose.isValidObjectId(videoId)) return res.status(400).json({ message: 'Choose a valid video to share' });
    video = await Video.findById(videoId);
    if (!video || !video.allowFriendSharing || video.visibility === 'private') return res.status(404).json({ message: 'This video cannot be shared with friends' });
  }
  if (type === 'text' && !String(text).trim()) return res.status(400).json({ message: 'Message cannot be empty' });
  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    type,
    text: String(text).trim().slice(0, 4000),
    sharedVideo: video?._id || null,
    readBy: [req.user._id]
  });
  conversation.lastMessage = message._id;
  conversation.lastMessageAt = message.createdAt;
  await conversation.save();
  await message.populate([{ path: 'sender', select: userFields }, { path: 'sharedVideo', select: 'title thumbnailUrl duration visibility allowFriendSharing owner' }]);
  res.status(201).json({ message: exposeMessage(message, req.user._id) });
}));

export default router;
