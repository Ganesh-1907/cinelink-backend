import mongoose, { Schema, Document } from 'mongoose';
export interface ICrew extends Document { userId: string; title: string; description?: string; craft?: string; location?: string; contact?: string; createdAt: Date; }
const CrewSchema = new Schema<ICrew>({ userId: { type: String, required: true }, title: { type: String, required: true }, description: { type: String }, craft: { type: String }, location: { type: String }, contact: { type: String } }, { timestamps: true });
export default mongoose.model<ICrew>('Crew', CrewSchema);
