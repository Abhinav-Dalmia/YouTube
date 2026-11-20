import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });
export default mongoose.model('Comment', commentSchema);
