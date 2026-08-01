import mongoose, { Schema, Document } from 'mongoose';

export interface IProjectRequest extends Document {
  projectId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  note: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
  createdAt: Date;
  updatedAt: Date;
}

const ProjectRequestSchema = new Schema<IProjectRequest>({
  projectId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  role: { type: String, required: true },
  note: { type: String, default: '' },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Accepted', 'Rejected'] }
}, { timestamps: true });

ProjectRequestSchema.index({ projectId: 1, userId: 1 });
export default mongoose.model<IProjectRequest>('ProjectRequest', ProjectRequestSchema);
