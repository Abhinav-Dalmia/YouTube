import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  type: { type: String, enum: ['direct'], default: 'direct', required: true },
  participants: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    validate: {
      validator: participants => participants.length === 2 && String(participants[0]) !== String(participants[1]),
      message: 'A direct conversation must have two different participants'
    }
  },
  // Set to the sorted user IDs joined by ':' so a pair only gets one chat.
  participantKey: { type: String, required: true, unique: true },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  lastMessageAt: { type: Date, default: null }
}, { timestamps: true });

conversationSchema.index({ participants: 1, lastMessageAt: -1 });

export default mongoose.model('Conversation', conversationSchema);
