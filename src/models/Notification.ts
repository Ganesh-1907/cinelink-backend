import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string; type: string; title: string; message: string;
  senderId?: string; chatId?: string; roomId?: string;
  projectId?: string; contestId?: string; auditionId?: string; role?: string;
  read: boolean; createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: String, required: true, index: true },
  type: { type: String, required: true }, title: { type: String, required: true },
  message: { type: String, default: '' }, senderId: { type: String },
  chatId: { type: String }, roomId: { type: String },
  projectId: { type: String }, contestId: { type: String }, auditionId: { type: String }, role: { type: String },
  read: { type: Boolean, default: false },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, createdAt: -1 });
export default mongoose.model<INotification>('Notification', NotificationSchema);
