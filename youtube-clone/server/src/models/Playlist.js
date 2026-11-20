import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '' },
  visibility: { type: String, enum: ['public', 'unlisted', 'private'], default: 'private' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }]
}, { timestamps: true });
export default mongoose.model('Playlist', playlistSchema);
