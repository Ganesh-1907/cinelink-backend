import mongoose, { Schema, Document } from 'mongoose';

export interface IAudition extends Document {
  title: string; description: string; location?: string; role?: string;
  ageMin?: number; ageMax?: number; gender?: string; lastDate?: string;
  language?: string; contactLink?: string; posterUrl?: string; category?: string;
  budget?: string; positions?: string; directorId: string; directorName?: string;
  postedById: string; likes: number; likedBy: string[]; views: number;
  commentsCount: number; applicationsCount: number;
  createdAt: Date; updatedAt: Date;
}

const AuditionSchema = new Schema<IAudition>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  location: { type: String, default: '' }, role: { type: String, default: '' },
  ageMin: { type: Number }, ageMax: { type: Number },
  gender: { type: String, default: 'Any' }, lastDate: { type: String, default: '' },
  language: { type: String, default: '' }, contactLink: { type: String, default: '' },
  posterUrl: { type: String, default: '' }, category: { type: String, default: '' },
  budget: { type: String, default: '' }, positions: { type: String, default: '' },
  directorId: { type: String, required: true }, directorName: { type: String, default: '' },
  postedById: { type: String, required: true },
  likes: { type: Number, default: 0 }, likedBy: [{ type: String }],
  views: { type: Number, default: 0 }, commentsCount: { type: Number, default: 0 },
  applicationsCount: { type: Number, default: 0 },
}, { timestamps: true });

AuditionSchema.index({ createdAt: -1 }); AuditionSchema.index({ directorId: 1 });
AuditionSchema.index({ title: 'text', description: 'text', location: 'text', role: 'text' });
export default mongoose.model<IAudition>('Audition', AuditionSchema);
