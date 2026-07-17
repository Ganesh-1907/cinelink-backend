import mongoose, { Schema, Document } from 'mongoose';

export interface IContest extends Document {
  title: string; description?: string; prize?: string; entryFee?: number;
  deadline?: string; posterUrl?: string; createdBy: string;
  entriesCount: number; status: string; createdAt: Date; updatedAt: Date;
}

const ContestSchema = new Schema<IContest>({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' }, prize: { type: String, default: '' },
  entryFee: { type: Number, default: 0 }, deadline: { type: String, default: '' },
  posterUrl: { type: String, default: '' },
  createdBy: { type: String, required: true, index: true },
  entriesCount: { type: Number, default: 0 },
  status: { type: String, default: 'active', enum: ['active','closed','cancelled'] },
}, { timestamps: true });

ContestSchema.index({ createdAt: -1 });
export default mongoose.model<IContest>('Contest', ContestSchema);
