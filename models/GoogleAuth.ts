import mongoose, { Schema, Model } from 'mongoose';

export interface IGoogleAuth {
  _id?: string;
  accountEmail: string; // Email of the authenticated Google account
  refreshToken: string;
  accessToken?: string;
  expiryDate?: Date;
  scope: string;
  isActive: boolean;
  needsReauth?: boolean; // Set when the refresh token is rejected (invalid_grant)
  lastError?: string; // Last auth error message (e.g. "invalid_grant")
  lastErrorAt?: Date; // When the last auth error occurred
  lastVerifiedAt?: Date; // Last successful liveness check (throttles proactive checks)
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
    needsReauth: {
      type: Boolean,
      default: false,
    },
    lastError: {
      type: String,
    },
    lastErrorAt: {
      type: Date,
    },
    lastVerifiedAt: {
      type: Date,
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
