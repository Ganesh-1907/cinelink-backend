import mongoose, { Schema, Document } from 'mongoose';

export interface ICastingRequest extends Document {
  userId: string;
  userEmail: string;
  userName: string;
  role: string;
  bio: string;
  companyName: string;
  yearsExperience: string;
  message: string;
  experience: string;
  portfolio: string;
  idType: string;
  idProofUrl: string;
  companyDocUrl: string;
  phone: string;
  phoneVerified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CastingRequestSchema = new Schema<ICastingRequest>(
  {
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    role: { type: String, default: 'Director' },
    bio: { type: String, default: '' },
    companyName: { type: String, default: '' },
    yearsExperience: { type: String, default: '' },
    message: { type: String, default: '' },
    experience: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    idType: { type: String, default: '' },
    idProofUrl: { type: String, default: '' },
    companyDocUrl: { type: String, default: '' },
    phone: { type: String, default: '' },
    phoneVerified: { type: Boolean, default: false },
    status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true },
);

CastingRequestSchema.index({ userId: 1 });
CastingRequestSchema.index({ status: 1 });

export default mongoose.model<ICastingRequest>('CastingRequest', CastingRequestSchema);
