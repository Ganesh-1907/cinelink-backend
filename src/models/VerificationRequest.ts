import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationRequest extends Document {
  userId: string;
  fullName?: string;
  idProofUrl?: string;
  selfieUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

const VerificationRequestSchema = new Schema<IVerificationRequest>({
  userId: { type: String, required: true },
  fullName: { type: String },
  idProofUrl: { type: String },
  selfieUrl: { type: String },
  status: { type: String, default: 'pending', enum: ['pending','approved','rejected'] },
  reviewedBy: { type: String },
  reviewedAt: { type: Date },
}, { timestamps: true });

VerificationRequestSchema.index({ status: 1 });
export default mongoose.model<IVerificationRequest>('VerificationRequest', VerificationRequestSchema);
