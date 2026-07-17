import mongoose, { Schema, Document } from 'mongoose';
export interface IApplication extends Document { auditionId: string; userId: string; userName?: string; userEmail?: string; userPhoto?: string; note?: string; status: string; createdAt: Date; }
const AppSchema = new Schema<IApplication>({ auditionId: { type: String, required: true }, userId: { type: String, required: true }, userName: { type: String }, userEmail: { type: String }, userPhoto: { type: String }, note: { type: String }, status: { type: String, default: 'pending', enum: ['pending','shortlisted','selected','rejected'] } }, { timestamps: true });
export default mongoose.model<IApplication>('Application', AppSchema);
