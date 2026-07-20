import mongoose, { Schema, Model, Types } from "mongoose";

export interface IWarning {
  _id?: string;
  installer: Types.ObjectId;
  reward: Types.ObjectId;
  serialNumber: string;
  reason: string;
  issuedAt: Date;
  // null when the system issued it automatically from a rejected reward
  issuedBy?: Types.ObjectId | null;
  revokedAt?: Date | null;
  revokedBy?: Types.ObjectId | null;
  revokedNote?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const WarningSchema = new Schema<IWarning>(
  {
    installer: {
      type: Schema.Types.ObjectId,
      ref: "Installer",
      required: [true, "Installer is required"],
    },
    reward: {
      type: Schema.Types.ObjectId,
      ref: "InstallerReward",
      required: [true, "Reward is required"],
      // One warning per reward. Re-saving a reward that is already rejected as a
      // false claim must not stack warnings; the issuer upserts on this key.
      unique: true,
    },
    serialNumber: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: "TeamMember",
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: "TeamMember",
      default: null,
    },
    revokedNote: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// The active-warning count query: installer + not revoked + within the window.
WarningSchema.index({ installer: 1, revokedAt: 1, issuedAt: -1 });

const Warning: Model<IWarning> =
  mongoose.models.Warning || mongoose.model<IWarning>("Warning", WarningSchema);

export default Warning;
