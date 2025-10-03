import mongoose, { Schema, Model } from 'mongoose';

export interface IGoogleAuth {
  _id?: string;
  userId: string;
  refreshToken: string;
  accessToken?: string;
  expiryDate?: Date;
  scope: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const GoogleAuthSchema = new Schema<IGoogleAuth>(
  {
    userId: {
      type: String,
      required: true,
      unique: true, // One auth per user
    },
    refreshToken: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
    },
    expiryDate: {
      type: Date,
    },
    scope: {
      type: String,
      required: true,
      default: 'https://www.googleapis.com/auth/contacts',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
GoogleAuthSchema.index({ userId: 1, isActive: 1 });

const GoogleAuth: Model<IGoogleAuth> =
  mongoose.models.GoogleAuth || mongoose.model<IGoogleAuth>('GoogleAuth', GoogleAuthSchema);

export default GoogleAuth;
