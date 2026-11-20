import mongoose from 'mongoose';

const friendRequestSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending',
    index: true
  }
}, { timestamps: true });

friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });
friendRequestSchema.index({ to: 1, status: 1, createdAt: -1 });
friendRequestSchema.index({ from: 1, status: 1, createdAt: -1 });
friendRequestSchema.pre('validate', function () {
  if (this.from && this.to && this.from.equals(this.to)) {
    this.invalidate('to', 'You cannot send a friend request to yourself');
  }
});

export default mongoose.model('FriendRequest', friendRequestSchema);
