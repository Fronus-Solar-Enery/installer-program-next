import mongoose from 'mongoose';

export interface IPasswordReset {
  email: string;
  pin: string;
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
}

const passwordResetSchema = new mongoose.Schema({
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
});

// Compound index for efficient queries
passwordResetSchema.index({ email: 1, pin: 1 });

const PasswordReset = mongoose.models.PasswordReset || mongoose.model('PasswordReset', passwordResetSchema);

export default PasswordReset;
