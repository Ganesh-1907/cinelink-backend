import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  userId: string; reportedUserId?: string; auditionId?: string;
  filmId?: string; contestId?: string; reelId?: string;
  reason: string; message?: string; status: string;
  reviewedBy?: string; reviewedAt?: Date; createdAt: Date;
}

const ReportSchema = new Schema<IReport>({
  userId: { type: String, required: true }, reportedUserId: { type: String },
  auditionId: { type: String }, filmId: { type: String },
  contestId: { type: String }, reelId: { type: String },
  reason: { type: String, required: true }, message: { type: String, default: '' },
  status: { type: String, default: 'pending', enum: ['pending','reviewed','action_taken','dismissed'] },
  reviewedBy: { type: String }, reviewedAt: { type: Date },
}, { timestamps: true });

ReportSchema.index({ createdAt: -1 }); ReportSchema.index({ status: 1 });
export default mongoose.model<IReport>('Report', ReportSchema);
