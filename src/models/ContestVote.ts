import mongoose, { Schema, Document } from 'mongoose';

export interface IContestVote extends Document {
  contestId: string;
  entryId: string;
  voterId: string;
  createdAt: Date;
}

const ContestVoteSchema = new Schema<IContestVote>({
  contestId: { type: String, required: true },
  entryId: { type: String, required: true },
  voterId: { type: String, required: true },
}, { timestamps: true });

ContestVoteSchema.index({ contestId: 1, entryId: 1 });
ContestVoteSchema.index({ voterId: 1, contestId: 1 }, { unique: true });

export default mongoose.model<IContestVote>('ContestVote', ContestVoteSchema);
