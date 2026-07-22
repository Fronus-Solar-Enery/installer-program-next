import type { FC } from "react";
import { IconInstaller, IconReward, IconSettings } from "@/components/icons";
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
    id: "system",
    title: "System Settings",
    description: "Configure system-level options",
    Icon: IconSettings,
    rows: [
      {
        kind: "switch",
        key: "enableWhatsAppNotifications",
        label: "Enable WhatsApp Notifications",
        description: "Send WhatsApp messages to installers",
      },
    ],
  },
];
