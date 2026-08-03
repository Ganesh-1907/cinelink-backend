import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  chatId?: string;
  participants: string[]; participantNames: string[];
  lastMessage?: string; lastMessageTime?: Date;
  unreadCount: Record<string, number>;
  isGroupChat?: boolean;
  projectId?: string;
  groupName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>({
  chatId: { type: String, index: true, sparse: true },
  participants: [{ type: String, required: true }],
  participantNames: [{ type: String }],
  lastMessage: { type: String, default: '' },
  lastMessageTime: { type: Date },
  unreadCount: { type: Schema.Types.Mixed, default: {} },
  isGroupChat: { type: Boolean, default: false },
  projectId: { type: String, default: null, index: true },
  groupName: { type: String, default: '' }
}, { timestamps: true });

ChatSchema.index({ participants: 1 }); ChatSchema.index({ updatedAt: -1 });
export default mongoose.model<IChat>('Chat', ChatSchema);

