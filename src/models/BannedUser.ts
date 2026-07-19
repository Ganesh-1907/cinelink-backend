import mongoose, { Schema, Document } from 'mongoose';

export interface IBannedUser extends Document {
  userId: string;
  reason?: string;
  bannedBy: string;
  createdAt: Date;
}

const BannedUserSchema = new Schema<IBannedUser>({
  userId: { type: String, required: true, unique: true },
  reason: { type: String, default: '' },
  bannedBy: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IBannedUser>('BannedUser', BannedUserSchema);
