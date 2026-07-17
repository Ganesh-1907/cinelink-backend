import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  title: string; description?: string; type?: string;
  createdBy: string; members: string[]; rolesNeeded?: string[];
  status: string; createdAt: Date; updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' }, type: { type: String, default: '' },
  createdBy: { type: String, required: true },
  members: [{ type: String }], rolesNeeded: [{ type: String }],
  status: { type: String, default: 'open', enum: ['open','closed','in_production','completed'] },
}, { timestamps: true });

ProjectSchema.index({ createdAt: -1 });
export default mongoose.model<IProject>('Project', ProjectSchema);
