import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  handle: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  avatar: { type: String, default: '' },
  banner: { type: String, default: '' },
  description: { type: String, default: '' },
  subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  subscriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  watchLater: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  dislikedVideos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  watchHistory: [{ video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' }, watchedAt: { type: Date, default: Date.now } }]
}, { timestamps: true });

userSchema.virtual('subscriberCount').get(function () { return this.subscribers?.length || 0; });
userSchema.set('toJSON', { virtuals: true, transform: (_doc, ret) => { delete ret.password; return ret; } });
export default mongoose.model('User', userSchema);
