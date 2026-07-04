import mongoose, { Schema, Model } from 'mongoose';

export interface ISettings {
  _id?: string;

  // Installer Settings
  allowInstallerCodeEdit: boolean;
  maxReferralsPerInstaller: number;
  requireCertificationForRewards: boolean;
  autoVerifyInstallers: boolean;

  // Reward Settings
  defaultReferralReward: number;
  maxRewardProcessingDays: number;
  requireTransactionIdForPaid: boolean;
  autoSendWhatsAppOnPaid: boolean;

  // Team Settings
  allowUserSelfRegistration: boolean;
  requireEmailVerification: boolean;
  sessionTimeoutMinutes: number;

  // System Settings
  enableActivityLogging: boolean;
  enableWhatsAppNotifications: boolean;
  maintenanceMode: boolean;
  systemNotificationMessage?: string;

  // Notification Settings
  notifyAdminOnNewInstaller: boolean;
  notifyAdminOnRewardSubmission: boolean;
  adminNotificationEmail?: string;

  // Bulk Operations
  allowBulkRewardUpload: boolean;
  maxBulkUploadSize: number;

  // Data Retention
  activityLogRetentionDays: number;
  autoDeleteOldActivities: boolean;

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
    requireCertificationForRewards: {
      type: Boolean,
      default: false,
    },
    autoVerifyInstallers: {
      type: Boolean,
      default: false,
    },

    // Reward Settings
    defaultReferralReward: {
      type: Number,
      default: 500,
      min: 0,
    },
    maxRewardProcessingDays: {
      type: Number,
      default: 30,
      min: 1,
    },
    requireTransactionIdForPaid: {
      type: Boolean,
      default: true,
    },
    autoSendWhatsAppOnPaid: {
      type: Boolean,
      default: true,
    },

    // Team Settings
    allowUserSelfRegistration: {
      type: Boolean,
      default: false,
    },
    requireEmailVerification: {
      type: Boolean,
      default: false,
    },
    sessionTimeoutMinutes: {
      type: Number,
      default: 480, // 8 hours
      min: 30,
    },

    // System Settings
    enableActivityLogging: {
      type: Boolean,
      default: true,
    },
    enableWhatsAppNotifications: {
      type: Boolean,
      default: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    systemNotificationMessage: {
      type: String,
    },

    // Notification Settings
    notifyAdminOnNewInstaller: {
      type: Boolean,
      default: true,
    },
    notifyAdminOnRewardSubmission: {
      type: Boolean,
      default: false,
    },
    adminNotificationEmail: {
      type: String,
    },

    // Bulk Operations
    allowBulkRewardUpload: {
      type: Boolean,
      default: true,
    },
    maxBulkUploadSize: {
      type: Number,
      default: 1000,
      min: 1,
    },

    // Data Retention
    activityLogRetentionDays: {
      type: Number,
      default: 90,
      min: 30,
    },
    autoDeleteOldActivities: {
      type: Boolean,
      default: false,
    },

    // Metadata
    updatedBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Settings: Model<ISettings> =
  mongoose.models.Settings ||
  mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;

// Helper function to get settings (creates default if doesn't exist)
export async function getSettings(): Promise<ISettings> {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({});
  }

  return settings;
}
