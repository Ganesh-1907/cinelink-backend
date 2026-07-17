import mongoose, { Schema, Document } from 'mongoose';

export interface IReel extends Document {
  videoUrl: string; caption?: string; creatorId: string;
  creatorName?: string; creatorAvatar?: string;
  likes: number; likedBy: string[]; commentsCount: number; views: number;
  createdAt: Date;
}

const ReelSchema = new Schema<IReel>({
  videoUrl: { type: String, required: true }, caption: { type: String, default: '' },
  creatorId: { type: String, required: true, index: true },
  creatorName: { type: String, default: '' }, creatorAvatar: { type: String, default: '' },
  likes: { type: Number, default: 0 }, likedBy: [{ type: String }],
  commentsCount: { type: Number, default: 0 }, views: { type: Number, default: 0 },
}, { timestamps: true });

ReelSchema.index({ createdAt: -1 });
export default mongoose.model<IReel>('Reel', ReelSchema);
