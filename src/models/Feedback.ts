import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  userId: string;
  email?: string;
  message: string;
  type: 'bug' | 'feature' | 'general';
  createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>({
  userId: { type: String, required: true },
  email: { type: String },
  message: { type: String, required: true },
  type: { type: String, default: 'general', enum: ['bug','feature','general'] },
}, { timestamps: true });

FeedbackSchema.index({ createdAt: -1 });
export default mongoose.model<IFeedback>('Feedback', FeedbackSchema);
