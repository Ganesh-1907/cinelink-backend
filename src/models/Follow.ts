import mongoose, { Schema, Document } from 'mongoose';

export interface IFollow extends Document {
  followerId: string;
  followingId: string;
  createdAt: Date;
}

const FollowSchema = new Schema<IFollow>({
  followerId: { type: String, required: true, index: true },
  followingId: { type: String, required: true, index: true },
}, { timestamps: true });

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
FollowSchema.index({ followingId: 1, createdAt: -1 });

export default mongoose.model<IFollow>('Follow', FollowSchema);
