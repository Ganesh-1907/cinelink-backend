import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email?: string; phone?: string; password?: string;
  fullName?: string; displayName?: string; name?: string;
  bio?: string; role: string; location?: string;
  photoUrl?: string; photoURL?: string;
  introVideoLink?: string;
  portfolio1?: string; portfolio2?: string; portfolio3?: string;
  portfolioPhotos: string[]; portfolioMedia: string[];
  availabilityStatus?: string; lookingFor?: string;
  profileTags: string[];
  instagramLink?: string; youtubeLink?: string;
  ageRange?: string; height?: string; bodyType?: string;
  premiumTier: string; premiumExpiry?: Date; verifiedReal: boolean;
  subscriptionId?: string; isAdmin: boolean; isApprovedDirector: boolean;
  verificationStatus?: string; fcmToken?: string; platform?: string;
  isOnline: boolean; lastSeen?: Date; likedReels: string[];
  googleId?: string; refreshToken?: string;
  notificationsEnabled: boolean; emailNotifications: boolean; profileVisible: boolean;
  createdAt: Date; updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String },
  fullName: { type: String, trim: true },
  displayName: { type: String, trim: true },
  name: { type: String, trim: true },
  bio: { type: String, default: '' },
  role: { type: String, default: 'Actor', enum: ['Actor','Director','Writer','Producer','Editor','DOP','Crew','Creator','Admin'] },
  location: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  photoURL: { type: String, default: '' },
  introVideoLink: { type: String, default: '' },
  portfolio1: { type: String, default: '' },
  portfolio2: { type: String, default: '' },
  portfolio3: { type: String, default: '' },
  portfolioPhotos: [{ type: String }],
  portfolioMedia: [{ type: String }],
  availabilityStatus: { type: String, default: 'Open' },
  lookingFor: { type: String, default: '' },
  profileTags: [{ type: String }],
  instagramLink: { type: String, default: '' },
  youtubeLink: { type: String, default: '' },
  ageRange: { type: String, default: '' },
  height: { type: String, default: '' },
  bodyType: { type: String, default: '' },
  premiumTier: { type: String, default: 'none', enum: ['none','spotlight','marquee','premiere','premiereElite','black'] },
  premiumExpiry: { type: Date, default: null },
  verifiedReal: { type: Boolean, default: false },
  subscriptionId: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  isApprovedDirector: { type: Boolean, default: false },
  verificationStatus: { type: String, default: '' },
  fcmToken: { type: String, default: '' },
  platform: { type: String, default: '' },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date },
  likedReels: [{ type: String }],
  notificationsEnabled: { type: Boolean, default: true },
  emailNotifications: { type: Boolean, default: true },
  profileVisible: { type: Boolean, default: true },
  googleId: { type: String },
  refreshToken: { type: String },
}, { timestamps: true });

UserSchema.index({ role: 1 });
// UserSchema.index({ email: 1 });
// UserSchema.index({ phone: 1 });
UserSchema.index({ fullName: 'text', displayName: 'text', bio: 'text', location: 'text' });

export default mongoose.model<IUser>('User', UserSchema);
