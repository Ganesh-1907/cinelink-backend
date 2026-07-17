import mongoose, { Schema, Document } from 'mongoose';

export interface IFilm extends Document {
  title: string; description?: string; genre?: string; duration?: string;
  videoLink?: string; videoUrl?: string; posterUrl?: string;
  userId: string; userEmail?: string; likes: number; likedBy: string[];
  commentsCount: number; paid: boolean; createdAt: Date; updatedAt: Date;
}

const FilmSchema = new Schema<IFilm>({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' }, genre: { type: String, default: '' },
  duration: { type: String, default: '' }, videoLink: { type: String, default: '' },
  videoUrl: { type: String, default: '' }, posterUrl: { type: String, default: '' },
  userId: { type: String, required: true, index: true }, userEmail: { type: String },
  likes: { type: Number, default: 0 }, likedBy: [{ type: String }],
  commentsCount: { type: Number, default: 0 }, paid: { type: Boolean, default: false },
}, { timestamps: true });

FilmSchema.index({ createdAt: -1 });
export default mongoose.model<IFilm>('Film', FilmSchema);
