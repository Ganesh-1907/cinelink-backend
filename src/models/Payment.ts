import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  userId: string; userEmail?: string; amount: number; currency?: string;
  orderId: string; paymentId?: string; purpose: string;
  itemId?: string; itemTitle?: string; videoLink?: string;
  status: string; method?: string; paidAt?: Date; createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  userId: { type: String, required: true, index: true },
  userEmail: { type: String }, amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  orderId: { type: String, required: true, unique: true },
  paymentId: { type: String }, purpose: { type: String, required: true },
  itemId: { type: String }, itemTitle: { type: String }, videoLink: { type: String },
  status: { type: String, default: 'created' }, method: { type: String }, paidAt: { type: Date },
}, { timestamps: true });

PaymentSchema.index({ userId: 1, createdAt: -1 });
export default mongoose.model<IPayment>('Payment', PaymentSchema);
