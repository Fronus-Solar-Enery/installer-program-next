import mongoose, { Schema, Model } from 'mongoose';

export interface IGoogleAuth {
  _id?: string;
  accountEmail: string; // Email of the authenticated Google account
  refreshToken: string;
  accessToken?: string;
  expiryDate?: Date;
  scope: string;
  isActive: boolean;
  authenticatedBy?: string; // User ID who authenticated (for audit trail)
  createdAt?: Date;
  updatedAt?: Date;
}

const GoogleAuthSchema = new Schema<IGoogleAuth>(
  {
    accountEmail: {
      type: String,
      required: true,
      unique: true, // Only one Google account can be authenticated
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
    authenticatedBy: {
      type: String,
      required: false, // Optional field for audit trail
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups
GoogleAuthSchema.index({ isActive: 1 });

const GoogleAuth: Model<IGoogleAuth> =
  mongoose.models.GoogleAuth || mongoose.model<IGoogleAuth>('GoogleAuth', GoogleAuthSchema);

export default GoogleAuth;
