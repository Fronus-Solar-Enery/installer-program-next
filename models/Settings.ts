import mongoose, { Schema, Model } from "mongoose";
import { PAYMENT_METHOD } from "@/lib/constants";

export const DEFAULT_PAYMENT_METHODS = PAYMENT_METHOD.map((m) => m.value);

export interface ISettings {
  _id?: string;

  // Installer Settings
  allowInstallerCodeEdit: boolean;
  maxReferralsPerInstaller: number;

  // Reward Settings
  defaultReferralReward: number;
  requireTransactionIdForPaid: boolean;
  autoSendWhatsAppOnPaid: boolean;
  paymentMethods: string[];

  // System Settings
  enableWhatsAppNotifications: boolean;

  // Last updated
  updatedBy?: string;
  updatedAt?: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    // Installer Settings
    allowInstallerCodeEdit: {
      type: Boolean,
      default: false,
      required: true,
    },
    maxReferralsPerInstaller: {
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },

    // Reward Settings
    defaultReferralReward: {
      type: Number,
      default: 500,
      min: 0,
    },
    requireTransactionIdForPaid: {
      type: Boolean,
      default: true,
    },
    autoSendWhatsAppOnPaid: {
      type: Boolean,
      default: true,
    },
    paymentMethods: {
      type: [String],
      default: DEFAULT_PAYMENT_METHODS,
    },

    // System Settings
    enableWhatsAppNotifications: {
      type: Boolean,
      default: true,
    },

    // Metadata
    updatedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const Settings: Model<ISettings> =
  mongoose.models.Settings ||
  mongoose.model<ISettings>("Settings", SettingsSchema);

export default Settings;

// Helper function to get settings (atomically creates the singleton if missing).
// Single atomic find-and-upsert instead of findOne()-then-create(): removes the
// window where concurrent first-requests each create their own Settings doc,
// after which findOne() returns an arbitrary one and edits appear to randomly
// not apply.
// ponytail: a residual dup is only possible if two upserts race on the very
// first request ever (empty collection, no unique index). Harden with a unique
// index on a fixed singleton key if that first-boot edge ever bites.
export async function getSettings(): Promise<ISettings> {
  // upsert + new:true always resolves to a document; TS still widens to | null.
  return (await Settings.findOneAndUpdate(
    {},
    { $setOnInsert: {} },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ))!;
}
