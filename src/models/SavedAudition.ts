import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedAudition extends Document {
  userId: string;
  auditionId: string;
  createdAt: Date;
}

const SavedAuditionSchema = new Schema<ISavedAudition>({
  userId: { type: String, required: true },
  auditionId: { type: String, required: true },
}, { timestamps: true });

SavedAuditionSchema.index({ userId: 1 });
SavedAuditionSchema.index({ userId: 1, auditionId: 1 }, { unique: true });
export default mongoose.model<ISavedAudition>('SavedAudition', SavedAuditionSchema);
