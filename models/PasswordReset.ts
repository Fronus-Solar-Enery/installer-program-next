import mongoose from 'mongoose';

export interface IPasswordReset {
  email: string;
  pin: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
  /** Failed verification attempts; the record is destroyed once this hits the cap. */
  attempts: number;
}

const passwordResetSchema = new mongoose.Schema<IPasswordReset>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  pin: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index - automatically delete documents when expiresAt is reached
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  used: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 0,
  },
});

// Compound index for efficient queries
passwordResetSchema.index({ email: 1, pin: 1 });

const PasswordReset =
  (mongoose.models.PasswordReset as mongoose.Model<IPasswordReset>) ||
  mongoose.model<IPasswordReset>('PasswordReset', passwordResetSchema);

export default PasswordReset;
