import mongoose, { Schema, Document } from 'mongoose';

export interface IRoleNeeded {
  role: string;
  filled: boolean;
  memberId?: string | null;
  memberName?: string | null;
}

export interface IProject extends Document {
  title: string;
  description?: string;
  type?: string;
  createdBy: string;
  members: string[];
  rolesNeeded: IRoleNeeded[];
  status: string;
  language?: string;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: { type: String, default: '' },
  createdBy: { type: String, required: true, ref: 'User' },
  members: [{ type: String, ref: 'User' }],
  rolesNeeded: [{
    role: { type: String, required: true },
    filled: { type: Boolean, default: false },
    memberId: { type: String, default: null },
    memberName: { type: String, default: null }
  }],
  status: { type: String, default: 'open', enum: ['open','closed','in_production','completed'] },
  language: { type: String, default: 'English' },
  location: { type: String, default: '' },
}, { timestamps: true });

ProjectSchema.index({ createdAt: -1 });
export default mongoose.model<IProject>('Project', ProjectSchema);

