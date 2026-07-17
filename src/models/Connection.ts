import mongoose, { Schema, Document } from 'mongoose';

export interface IConnection extends Document {
  users: string[]; createdAt: Date;
}

const ConnectionSchema = new Schema<IConnection>({
  users: [{ type: String, required: true }],
}, { timestamps: true });

ConnectionSchema.index({ users: 1 });
export default mongoose.model<IConnection>('Connection', ConnectionSchema);
