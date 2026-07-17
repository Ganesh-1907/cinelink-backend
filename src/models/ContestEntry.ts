import mongoose, { Schema, Document } from 'mongoose';

export interface IContestEntry extends Document {
  contestId: string; contestTitle?: string; userId: string;
  userEmail?: string; videoLink?: string;
  votes: number; juryScore: number; finalScore: number;
  paid: boolean; paymentId?: string; createdAt: Date;
}

const ContestEntrySchema = new Schema<IContestEntry>({
  contestId: { type: String, required: true }, contestTitle: { type: String },
  userId: { type: String, required: true }, userEmail: { type: String },
  videoLink: { type: String }, votes: { type: Number, default: 0 },
  juryScore: { type: Number, default: 0 }, finalScore: { type: Number, default: 0 },
  paid: { type: Boolean, default: false }, paymentId: { type: String },
}, { timestamps: true });

ContestEntrySchema.index({ contestId: 1 }); ContestEntrySchema.index({ userId: 1 });
export default mongoose.model<IContestEntry>('ContestEntry', ContestEntrySchema);
