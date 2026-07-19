import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  targetId: string;
  targetType: 'audition' | 'film' | 'reel' | 'feedPost' | 'contestEntry' | 'profile';
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>({
  targetId: { type: String, required: true, index: true },
  targetType: {
    type: String, required: true,
    enum: ['audition', 'film', 'reel', 'feedPost', 'contestEntry', 'profile'],
  },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userAvatar: { type: String, default: '' },
  text: { type: String, required: true },
}, { timestamps: true });

CommentSchema.index({ targetId: 1, createdAt: -1 });
export default mongoose.model<IComment>('Comment', CommentSchema);
