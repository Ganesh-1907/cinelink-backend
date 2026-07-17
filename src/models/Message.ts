import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chatId: string; type: string; text?: string; imageUrl?: string;
  senderId: string; senderEmail?: string; senderName?: string;
  readBy: string[]; createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  chatId: { type: String, required: true, index: true },
  type: { type: String, default: 'text', enum: ['text', 'image'] },
  text: { type: String, default: '' }, imageUrl: { type: String, default: '' },
  senderId: { type: String, required: true },
  senderEmail: { type: String }, senderName: { type: String },
  readBy: [{ type: String }],
}, { timestamps: true });

MessageSchema.index({ chatId: 1, createdAt: -1 });
export default mongoose.model<IMessage>('Message', MessageSchema);
