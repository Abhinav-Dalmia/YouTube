import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: '', maxlength: 5000 },
  videoUrl: { type: String, required: true },
  videoPublicId: { type: String, default: '' },
  thumbnailUrl: { type: String, default: '' },
  thumbnailPublicId: { type: String, default: '' },
  duration: { type: Number, default: 0 },
  category: { type: String, default: 'All' },
  visibility: { type: String, enum: ['public', 'unlisted', 'private'], default: 'public' },
  allowFriendSharing: { type: Boolean, default: true },
  tags: [{ type: String, trim: true }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

videoSchema.index({ title: 'text', description: 'text', tags: 'text' });
export default mongoose.model('Video', videoSchema);
