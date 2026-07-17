import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  participants: string[]; participantNames: string[];
  lastMessage?: string; lastMessageTime?: Date;
  unreadCount: Record<string, number>;
  createdAt: Date; updatedAt: Date;
}

const ChatSchema = new Schema<IChat>({
  participants: [{ type: String, required: true }],
  participantNames: [{ type: String }],
  lastMessage: { type: String, default: '' },
  lastMessageTime: { type: Date },
  unreadCount: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true });

ChatSchema.index({ participants: 1 }); ChatSchema.index({ updatedAt: -1 });
export default mongoose.model<IChat>('Chat', ChatSchema);
