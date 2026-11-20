import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['text', 'video'], default: 'text', required: true },
  text: { type: String, trim: true, maxlength: 4000, default: '' },
  sharedVideo: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', default: null },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  editedAt: { type: Date, default: null },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: -1, _id: -1 });
messageSchema.pre('validate', function () {
  if (this.type === 'text' && !this.text?.trim()) {
    this.invalidate('text', 'Text messages cannot be empty');
  }
  if (this.type === 'video' && !this.sharedVideo) {
    this.invalidate('sharedVideo', 'A video message must reference a video');
  }
});

export default mongoose.model('Message', messageSchema);
