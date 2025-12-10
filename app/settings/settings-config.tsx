import { SettingsData } from "./page";

export const getSettingsCards = (settings: SettingsData | null) => [
  {
    key: "maxReferralsPerInstaller" as keyof SettingsData,
    label: (
      <>
        Max <br /> Referrals
      </>
    ),
    dialogTitle: "Max Referrals Per Installer",
    dialogDescription:
      "Set the maximum number of referrals allowed per installer",
    description: "Max Number of Referrals Per Installer",
    value: settings?.maxReferralsPerInstaller,
    align: "items-center",
  },
  {
    key: "defaultReferralReward" as keyof SettingsData,
    label: (
      <>
        Referral <br /> Reward
      </>
    ),
    dialogTitle: "Default Referral Reward",
    dialogDescription: "Set the default reward amount for referrals (Rs.)",
    description: "Referral Reward for each Referrer Installer",
    value: settings?.defaultReferralReward || 500,
    align: "items-end",
  },
  {
    key: "maxRewardProcessingDays" as keyof SettingsData,
    label: "Reward Processing",
    dialogTitle: "Max Reward Processing Days",
    dialogDescription: "Set the maximum number of days to process a reward",
    description: "Max Processing Days for Reward",
    value: settings?.maxRewardProcessingDays || 30,
    align: "items-end",
  },
  {
    key: "sessionTimeoutMinutes" as keyof SettingsData,
    label: "Session Timeout",
    dialogTitle: "Session Timeout",
    dialogDescription: "Set the session timeout in minutes",
    description: "Session Timeout in Minutes",
    value: settings?.sessionTimeoutMinutes || 480,
    align: "items-end",
  },
  {
    key: "maxBulkUploadSize" as keyof SettingsData,
    label: "Max Bulk Upload Size",
    dialogTitle: "Max Bulk Upload Size",
    dialogDescription: "Set the max bulk upload size in MB",
    description: "Max Bulk Upload Size in MB",
    value: settings?.maxBulkUploadSize || 1000,
    align: "items-end",
  },
  {
    key: "activityLogRetentionDays" as keyof SettingsData,
    label: "Activity Log Retention Days",
    dialogTitle: "Activity Log Retention Days",
    dialogDescription: "Set the activity log retention days",
    description: "Activity Log Retention Days",
    value: settings?.activityLogRetentionDays || 90,
    align: "items-end",
  },
  //   {
  //     key: "systemNotificationMessage" as keyof SettingsData,
  //     label: "System Notification Message",
  //     dialogTitle: "System Notification Message",
  //     dialogDescription: "Set the system notification message",
  //     description: "System Notification Message",
  //     value: settings?.systemNotificationMessage,
  //     align: "items-end",
  //   },
];

export const getSwitchCards = (settings: SettingsData | null) => [
  {
    key: "allowInstallerCodeEdit" as keyof SettingsData,
    label: "InstallerCode Edit",
    description: "Allow editing installer codes after creation",
    value: settings?.allowInstallerCodeEdit,
  },
  {
    key: "allowTrainingCenterEdit" as keyof SettingsData,
    label: "Training Center Edit",
    description: "Allow editing training center after creation",
    value: settings?.allowTrainingCenterEdit,
  },
  {
    key: "requireCertificationForRewards" as keyof SettingsData,
    label: "Certification",
    description: "Only certified installers can receive rewards",
    value: settings?.requireCertificationForRewards,
  },
  {
    key: "requireTransactionIdForPaid" as keyof SettingsData,
    label: "TRX ID for Paid",
    description: "Transaction ID required to mark as PAID",
    value: settings?.requireTransactionIdForPaid,
  },
  {
    key: "autoSendWhatsAppOnPaid" as keyof SettingsData,
    label: "Notify on Paid",
    description: "Auto send WhatsApp message on PAID",
    value: settings?.autoSendWhatsAppOnPaid,
  },
  {
    key: "allowUserSelfRegistration" as keyof SettingsData,
    label: "Self Registration",
    description: "Users can register without admin approval",
    value: settings?.allowUserSelfRegistration,
  },
  {
    key: "requireEmailVerification" as keyof SettingsData,
    label: "Email Verification",
    description: "Verify email before account activation",
    value: settings?.requireEmailVerification,
  },
  {
    key: "enableActivityLogging" as keyof SettingsData,
    label: "Activity Logging",
    description: "Track all user actions in activity logs",
    value: settings?.enableActivityLogging,
  },
  {
    key: "enableWhatsAppNotifications" as keyof SettingsData,
    label: "WhatsApp Notifications",
    description: "Send WhatsApp messages to installers",
    value: settings?.enableWhatsAppNotifications,
  },
  {
    key: "maintenanceMode" as keyof SettingsData,
    label: "Maintenance Mode",
    description: "Disable access for non-admin users",
    value: settings?.maintenanceMode,
  },
  {
    key: "notifyAdminOnNewInstaller" as keyof SettingsData,
    label: "Notify Admin on Installer",
    dialogTitle: "Notify Admin on New Installer",
    dialogDescription: "Notify admin when a new installer is registered",
    description: "Notify Admin on New Installer",
    value: settings?.notifyAdminOnNewInstaller,
    align: "items-end",
  },
  {
    key: "notifyAdminOnRewardSubmission" as keyof SettingsData,
    label: "Notify Admin on Reward",
    dialogTitle: "Notify Admin on Reward Submission",
    dialogDescription: "Notify admin when a new installer is registered",
    description: "Notify Admin on New Installer",
    value: settings?.notifyAdminOnRewardSubmission,
    align: "items-end",
  },
  {
    key: "allowBulkRewardUpload" as keyof SettingsData,
    label: "Allow Bulk Reward",
    dialogTitle: "Allow Bulk Reward Upload",
    dialogDescription: "Allow bulk reward upload ",
    description: "Allow Bulk Reward Upload",
    value: settings?.allowBulkRewardUpload,
    align: "items-end",
  },
  {
    key: "autoDeleteOldActivities" as keyof SettingsData,
    label: "Auto Delete Old Activities",
    dialogTitle: "Auto Delete Old Activities",
    dialogDescription: "Auto delete old activities",
    description: "Auto Delete Old Activities",
    value: settings?.autoDeleteOldActivities,
    align: "items-end",
  },
];
