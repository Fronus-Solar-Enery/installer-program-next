import type { FC } from "react";
import {
  IconInstaller,
  IconReward,
  IconSettings,
  IconUsersGroupRounded,
} from "@/components/icons";
import IconBellBing from "@/components/icons/BellBing";
import IconDatabase from "@/components/icons/Database";
import type { SettingsData } from "./page";

type ValueType = "text" | "number" | "email" | "textarea";

export type SettingRow =
  | {
      kind: "switch";
      key: keyof SettingsData;
      label: string;
      description: string;
    }
  | {
      kind: "value";
      key: keyof SettingsData;
      label: string;
      dialogTitle: string;
      dialogDescription: string;
      type: ValueType;
      format: (settings: SettingsData | null) => string;
    }
  | {
      kind: "config";
      key: keyof SettingsData;
      label: string;
      dialogTitle: string;
      dialogDescription: string;
      type: ValueType;
      format: (settings: SettingsData | null) => string;
    };

export interface SettingsCardConfig {
  id: string;
  title: string;
  description: string;
  Icon: FC<IconProps>;
  rows: SettingRow[];
}

export const SETTINGS_CARDS: SettingsCardConfig[] = [
  {
    id: "installer",
    title: "Installer Settings",
    description: "Configure installer-related preferences",
    Icon: IconInstaller,
    rows: [
      {
        kind: "switch",
        key: "allowInstallerCodeEdit",
        label: "Allow Installer Code Edit",
        description: "Allow editing installer code after registration",
      },
      {
        kind: "value",
        key: "maxReferralsPerInstaller",
        label: "Max Referrals Per Installer",
        dialogTitle: "Max Referrals Per Installer",
        dialogDescription:
          "Set the maximum number of referrals allowed per installer",
        type: "number",
        format: (s) => `${s?.maxReferralsPerInstaller || 5} referrals`,
      },
      {
        kind: "switch",
        key: "requireCertificationForRewards",
        label: "Require Certification for Rewards",
        description: "Only certified installers can receive rewards",
      },
      {
        kind: "switch",
        key: "autoVerifyInstallers",
        label: "Auto Verify Installers",
        description: "Automatically verify new installers",
      },
    ],
  },
  {
    id: "reward",
    title: "Reward Settings",
    description: "Configure reward and payment preferences",
    Icon: IconReward,
    rows: [
      {
        kind: "value",
        key: "defaultReferralReward",
        label: "Default Referral Reward (Rs.)",
        dialogTitle: "Default Referral Reward",
        dialogDescription: "Set the default reward amount for referrals (Rs.)",
        type: "number",
        format: (s) => `Rs. ${s?.defaultReferralReward ?? ""}`,
      },
      {
        kind: "value",
        key: "maxRewardProcessingDays",
        label: "Max Reward Processing Days",
        dialogTitle: "Max Reward Processing Days",
        dialogDescription: "Set the maximum number of days to process a reward",
        type: "number",
        format: (s) => `${s?.maxRewardProcessingDays || 30} days`,
      },
      {
        kind: "switch",
        key: "requireTransactionIdForPaid",
        label: "Require Transaction ID for Paid",
        description: "Transaction ID required to mark as PAID",
      },
      {
        kind: "switch",
        key: "autoSendWhatsAppOnPaid",
        label: "Auto Send WhatsApp on Paid",
        description: "Automatically send WhatsApp when marked as PAID",
      },
    ],
  },
  {
    id: "team",
    title: "Team Settings",
    description: "Manage team and user access settings",
    Icon: IconUsersGroupRounded,
    rows: [
      {
        kind: "switch",
        key: "allowUserSelfRegistration",
        label: "Allow User Self Registration",
        description: "Users can register without admin approval",
      },
      {
        kind: "switch",
        key: "requireEmailVerification",
        label: "Require Email Verification",
        description: "Verify email before account activation",
      },
      {
        kind: "value",
        key: "sessionTimeoutMinutes",
        label: "Session Timeout (Minutes)",
        dialogTitle: "Session Timeout",
        dialogDescription: "Set the session timeout in minutes",
        type: "number",
        format: (s) => `${s?.sessionTimeoutMinutes || 480} minutes`,
      },
    ],
  },
  {
    id: "system",
    title: "System Settings",
    description: "Configure system-level options",
    Icon: IconSettings,
    rows: [
      {
        kind: "switch",
        key: "enableActivityLogging",
        label: "Enable Activity Logging",
        description: "Track all user actions",
      },
      {
        kind: "switch",
        key: "enableWhatsAppNotifications",
        label: "Enable WhatsApp Notifications",
        description: "Send WhatsApp messages to installers",
      },
      {
        kind: "switch",
        key: "enableWhatsAppHybridMode",
        label: "Enable WhatsApp Hybrid Mode",
        description: "Send free-form text within 24h of installer's last message",
      },
      {
        kind: "switch",
        key: "maintenanceMode",
        label: "Maintenance Mode",
        description: "Disable access for non-admin users",
      },
      {
        kind: "config",
        key: "systemNotificationMessage",
        label: "System Notification Message",
        dialogTitle: "System Notification Message",
        dialogDescription: "Set the message to display to all users",
        type: "textarea",
        format: (s) => `${s?.systemNotificationMessage || ""}`,
      },
    ],
  },
  {
    id: "notification",
    title: "Notification Settings",
    description: "Configure email and notification preferences",
    Icon: IconBellBing,
    rows: [
      {
        kind: "switch",
        key: "notifyAdminOnNewInstaller",
        label: "Notify Admin on New Installer",
        description: "Email admin when installer registers",
      },
      {
        kind: "switch",
        key: "notifyAdminOnRewardSubmission",
        label: "Notify Admin on Reward Submission",
        description: "Email admin on new reward submission",
      },
      {
        kind: "value",
        key: "adminNotificationEmail",
        label: "Admin Notification Email",
        dialogTitle: "Admin Notification Email",
        dialogDescription: "Set the email address for admin notifications",
        type: "email",
        format: (s) => `${s?.adminNotificationEmail || "No email set"}`,
      },
    ],
  },
  {
    id: "data",
    title: "Data Management",
    description: "Configure bulk operations and data retention",
    Icon: IconDatabase,
    rows: [
      {
        kind: "switch",
        key: "allowBulkRewardUpload",
        label: "Allow Bulk Reward Upload",
        description: "Enable Excel bulk upload feature",
      },
      {
        kind: "switch",
        key: "autoDeleteOldActivities",
        label: "Auto Delete Old Activities",
        description: "Automatically clean up old activity logs",
      },
      {
        kind: "value",
        key: "maxBulkUploadSize",
        label: "Max Bulk Upload Size (rows)",
        dialogTitle: "Max Bulk Upload Size",
        dialogDescription:
          "Set the maximum number of rows allowed in bulk uploads",
        type: "number",
        format: (s) => `${s?.maxBulkUploadSize || 1000} rows`,
      },
      {
        kind: "value",
        key: "activityLogRetentionDays",
        label: "Activity Log Retention (Days)",
        dialogTitle: "Activity Log Retention",
        dialogDescription: "Set the number of days to retain activity logs",
        type: "number",
        format: (s) => `${s?.activityLogRetentionDays || 90} days`,
      },
    ],
  },
];
