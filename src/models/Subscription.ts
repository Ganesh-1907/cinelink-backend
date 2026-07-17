import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  userId: string; tier: string; paymentId: string;
  subscriptionId: string; startDate?: Date; endDate?: Date;
  status: string; createdAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
  userId: { type: String, required: true },
  tier: { type: String, required: true }, paymentId: { type: String },
  subscriptionId: { type: String }, startDate: { type: Date }, endDate: { type: Date },
  status: { type: String, default: 'active', enum: ['active','expired','cancelled'] },
}, { timestamps: true });

SubscriptionSchema.index({ userId: 1 });
export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
