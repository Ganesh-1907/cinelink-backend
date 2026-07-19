import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedPost extends Document {
  userId: string;
  text: string;
  imageUrl?: string;
  likes: number;
  likedBy: string[];
  comments: number;
  postType: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedPostSchema = new Schema<IFeedPost>({
  userId: { type: String, required: true, index: true },
  text: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: String }],
  comments: { type: Number, default: 0 },
  postType: { type: String, default: 'text' },
}, { timestamps: true });

FeedPostSchema.index({ createdAt: -1 });
export default mongoose.model<IFeedPost>('FeedPost', FeedPostSchema);
