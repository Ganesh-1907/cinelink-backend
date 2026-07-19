import mongoose, { Schema, Document } from 'mongoose';

export interface IConnection extends Document {
  requesterId: string;
  targetId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const ConnectionSchema = new Schema<IConnection>({
  requesterId: { type: String, required: true },
  targetId: { type: String, required: true },
  status: { type: String, default: 'pending', enum: ['pending','accepted','rejected'] },
}, { timestamps: true });

ConnectionSchema.index({ requesterId: 1, targetId: 1 }, { unique: true });
export default mongoose.model<IConnection>('Connection', ConnectionSchema);
