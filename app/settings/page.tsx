"use client";

import { useEffect, useState } from "react";
import { Save, Pencil } from "lucide-react";
import { EditSettingDialog } from "./edit-setting-dialog";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdminGuard } from "@/hooks/useRoleGuard";
import PageHeader from "@/components/PageHeader";
import {
  IconEdit2,
  IconInstaller,
  IconReward,
  IconSave,
  IconSettings,
  IconUsersGroupRounded,
} from "@/components/icons";
import IconReset from "@/components/icons/Reset";
import { DashboardCardHeader } from "../dashboard/page";
import { AnimatePresence, motion } from "framer-motion";
import IconBellBing from "@/components/icons/BellBing";
import IconDatabase from "@/components/icons/Database";

export interface SettingsData {
  allowInstallerCodeEdit?: boolean;
  maxReferralsPerInstaller?: number;
  requireCertificationForRewards?: boolean;
  autoVerifyInstallers?: boolean;
  defaultReferralReward?: number;
  maxRewardProcessingDays?: number;
  requireTransactionIdForPaid?: boolean;
  autoSendWhatsAppOnPaid?: boolean;
  allowUserSelfRegistration?: boolean;
  requireEmailVerification?: boolean;
  sessionTimeoutMinutes?: number;
  enableActivityLogging?: boolean;
  enableWhatsAppNotifications?: boolean;
  maintenanceMode?: boolean;
  systemNotificationMessage?: string;
  notifyAdminOnNewInstaller?: boolean;
  notifyAdminOnRewardSubmission?: boolean;
  adminNotificationEmail?: string;
  allowBulkRewardUpload?: boolean;
  maxBulkUploadSize?: number;
  activityLogRetentionDays?: number;
  autoDeleteOldActivities?: boolean;
  updatedAt?: string;
}

const GRID_CLASSES = "grid grid-cols-1 lg:grid-cols-2 gap-6";
const p_CLASSES =
  "text-xs bg-background border border-border px-2 py-1 rounded-xl squircle font-mono";

// List of switch (boolean) settings keys
const SWITCH_SETTINGS_KEYS: (keyof SettingsData)[] = [
  "allowInstallerCodeEdit",
  "requireCertificationForRewards",
  "autoVerifyInstallers",
  "requireTransactionIdForPaid",
  "autoSendWhatsAppOnPaid",
  "allowUserSelfRegistration",
  "requireEmailVerification",
  "enableActivityLogging",
  "enableWhatsAppNotifications",
  "maintenanceMode",
  "notifyAdminOnNewInstaller",
  "notifyAdminOnRewardSubmission",
  "allowBulkRewardUpload",
  "autoDeleteOldActivities",
];

// Default settings values
const DEFAULT_SETTINGS: SettingsData = {
  allowInstallerCodeEdit: false,
  maxReferralsPerInstaller: 5,
  requireCertificationForRewards: false,
  autoVerifyInstallers: false,
  defaultReferralReward: 1000,
  maxRewardProcessingDays: 30,
  requireTransactionIdForPaid: true,
  autoSendWhatsAppOnPaid: false,
  allowUserSelfRegistration: true,
  requireEmailVerification: true,
  sessionTimeoutMinutes: 480,
  enableActivityLogging: true,
  enableWhatsAppNotifications: false,
  maintenanceMode: false,
  systemNotificationMessage: "",
  notifyAdminOnNewInstaller: true,
  notifyAdminOnRewardSubmission: true,
  adminNotificationEmail: "",
  allowBulkRewardUpload: true,
  maxBulkUploadSize: 1000,
  activityLogRetentionDays: 90,
  autoDeleteOldActivities: false,
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogSaving, setDialogSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [originalSettings, setOriginalSettings] = useState<SettingsData | null>(
    null
  );
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    key: keyof SettingsData | null;
    title: string;
    description?: string;
    type: "text" | "number" | "email" | "textarea";
  }>({
    isOpen: false,
    key: null,
    title: "",
    description: "",
    type: "text",
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Only check switch settings for hasChanges
  const hasChanges = SWITCH_SETTINGS_KEYS.some(
    (key) => settings?.[key] !== originalSettings?.[key]
  );

  const { isAuthorized } = useAdminGuard({
    autoRedirect: true,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings");
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setOriginalSettings(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchSettings();
    }
  }, [isAuthorized]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Settings saved successfully");
        setOriginalSettings(settings);
        fetchSettings();
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (
    key: keyof SettingsData,
    value: string | number | boolean
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const openEditDialog = (
    key: keyof SettingsData,
    title: string,
    description: string,
    type: "text" | "number" | "email" | "textarea" = "text"
  ) => {
    setDialogConfig({
      isOpen: true,
      key,
      title,
      description,
      type,
    });
  };

  const handleDialogSave = async (value: string | number) => {
    if (!dialogConfig.key || !settings || !originalSettings) return;

    const key = dialogConfig.key;
    // Use originalSettings to ensure we don't save pending switch changes
    const payload = { ...originalSettings, [key]: value };

    try {
      setDialogSaving(true);
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`${dialogConfig.title} updated successfully`);
        // Update both settings (UI) and originalSettings (Server state)
        // We use function update for settings to preserve any other pending changes (like switches)
        setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
        setOriginalSettings(payload);
        // Close the dialog after successful save
        setDialogConfig((prev) => ({ ...prev, isOpen: false }));
      } else {
        toast.error(data.error || "Failed to save setting");
      }
    } catch (error) {
      console.error("Failed to save setting:", error);
      toast.error("An error occurred while saving");
    } finally {
      setDialogSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    try {
      setResetting(true);
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(DEFAULT_SETTINGS),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Settings reset to defaults successfully");
        setSettings(DEFAULT_SETTINGS);
        setOriginalSettings(DEFAULT_SETTINGS);
        setShowResetConfirm(false);
      } else {
        toast.error(data.error || "Failed to reset settings");
      }
    } catch (error) {
      console.error("Failed to reset settings:", error);
      toast.error("An error occurred while resetting");
    } finally {
      setResetting(false);
    }
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <>
      <PageHeader
        title="System Settings"
        description="Configure system-wide settings and preferences"
        iconFill
        Icon={IconSettings}
        action={
          <Button
            onClick={() => setShowResetConfirm(true)}
            variant="outline"
            className="gap-1"
          >
            <IconReset className="size-3.5!" />
            Reset Defaults
          </Button>
        }
      />
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <div className="flex flex-row items-center gap-4 p-6 pb-2">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <CardContent className="space-y-6 pt-6">
                  {[...Array(4)].map((_, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between space-x-2"
                    >
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-6 w-10 rounded-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Installer Settings */}
            <Card>
              <DashboardCardHeader
                title="Installer Settings"
                description={`Configure installer-related preferences`}
                Icon={IconInstaller}
                iconBadge={false}
              />
              <CardContent className={GRID_CLASSES}>
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="allowInstallerCodeEdit">
                      Allow Installer Code Edit
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Allow editing installer code after registration
                    </p>
                  </div>
                  <Switch
                    id="allowInstallerCodeEdit"
                    checked={settings?.allowInstallerCodeEdit || false}
                    onCheckedChange={(checked) =>
                      updateSetting("allowInstallerCodeEdit", checked)
                    }
                  />
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="maxReferralsPerInstaller">
                      Max Referrals Per Installer
                    </Label>
                    <p className={p_CLASSES}>
                      {settings?.maxReferralsPerInstaller || 5} referrals
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      openEditDialog(
                        "maxReferralsPerInstaller",
                        "Max Referrals Per Installer",
                        "Set the maximum number of referrals allowed per installer",
                        "number"
                      )
                    }
                    className="shrink-0"
                  >
                    <IconEdit2 />
                  </Button>
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="requireCertificationForRewards">
                      Require Certification for Rewards
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Only certified installers can receive rewards
                    </p>
                  </div>
                  <Switch
                    id="requireCertificationForRewards"
                    checked={settings?.requireCertificationForRewards || false}
                    onCheckedChange={(checked) =>
                      updateSetting("requireCertificationForRewards", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="autoVerifyInstallers">
                      Auto Verify Installers
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically verify new installers
                    </p>
                  </div>
                  <Switch
                    id="autoVerifyInstallers"
                    checked={settings?.autoVerifyInstallers || false}
                    onCheckedChange={(checked) =>
                      updateSetting("autoVerifyInstallers", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Reward Settings */}
            <Card>
              <DashboardCardHeader
                title="Reward Settings"
                description={`Configure reward and payment preferences`}
                Icon={IconReward}
                iconBadge={false}
              />
              <CardContent className={GRID_CLASSES}>
                <div className="flex items-end justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="defaultReferralReward">
                      Default Referral Reward (Rs.)
                    </Label>
                    <p className={p_CLASSES}>
                      Rs. {settings?.defaultReferralReward}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      openEditDialog(
                        "defaultReferralReward",
                        "Default Referral Reward",
                        "Set the default reward amount for referrals (Rs.)",
                        "number"
                      )
                    }
                    className="shrink-0"
                  >
                    <IconEdit2 />
                  </Button>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="maxRewardProcessingDays">
                      Max Reward Processing Days
                    </Label>
                    <p className={p_CLASSES}>
                      {settings?.maxRewardProcessingDays || 30} days
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      openEditDialog(
                        "maxRewardProcessingDays",
                        "Max Reward Processing Days",
                        "Set the maximum number of days to process a reward",
                        "number"
                      )
                    }
                    className="shrink-0"
                  >
                    <IconEdit2 />
                  </Button>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="requireTransactionIdForPaid">
                      Require Transaction ID for Paid
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Transaction ID required to mark as PAID
                    </p>
                  </div>
                  <Switch
                    id="requireTransactionIdForPaid"
                    checked={settings?.requireTransactionIdForPaid || false}
                    onCheckedChange={(checked) =>
                      updateSetting("requireTransactionIdForPaid", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="autoSendWhatsAppOnPaid">
                      Auto Send WhatsApp on Paid
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically send WhatsApp when marked as PAID
                    </p>
                  </div>
                  <Switch
                    id="autoSendWhatsAppOnPaid"
                    checked={settings?.autoSendWhatsAppOnPaid || false}
                    onCheckedChange={(checked) =>
                      updateSetting("autoSendWhatsAppOnPaid", checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Team Settings */}
            <Card>
              <DashboardCardHeader
                title="Team Settings"
                description={`Manage team and user access settings`}
                Icon={IconUsersGroupRounded}
                iconBadge={false}
              />
              <CardContent className={GRID_CLASSES}>
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="allowUserSelfRegistration">
                      Allow User Self Registration
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Users can register without admin approval
                    </p>
                  </div>
                  <Switch
                    id="allowUserSelfRegistration"
                    checked={settings?.allowUserSelfRegistration || false}
                    onCheckedChange={(checked) =>
                      updateSetting("allowUserSelfRegistration", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="requireEmailVerification">
                      Require Email Verification
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Verify email before account activation
                    </p>
                  </div>
                  <Switch
                    id="requireEmailVerification"
                    checked={settings?.requireEmailVerification || false}
                    onCheckedChange={(checked) =>
                      updateSetting("requireEmailVerification", checked)
                    }
                  />
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="sessionTimeoutMinutes">
                      Session Timeout (Minutes)
                    </Label>
                    <p className={p_CLASSES}>
                      {settings?.sessionTimeoutMinutes || 480} minutes
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      openEditDialog(
                        "sessionTimeoutMinutes",
                        "Session Timeout",
                        "Set the session timeout in minutes",
                        "number"
                      )
                    }
                    className="shrink-0"
                  >
                    <IconEdit2 />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Settings */}
            <Card>
              <DashboardCardHeader
                title="System Settings"
                description={`Configure system-level options`}
                Icon={IconSettings}
                iconBadge={false}
              />
              <CardContent className={GRID_CLASSES}>
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="enableActivityLogging">
                      Enable Activity Logging
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Track all user actions
                    </p>
                  </div>
                  <Switch
                    id="enableActivityLogging"
                    checked={settings?.enableActivityLogging || false}
                    onCheckedChange={(checked) =>
                      updateSetting("enableActivityLogging", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="enableWhatsAppNotifications">
                      Enable WhatsApp Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Send WhatsApp messages to installers
                    </p>
                  </div>
                  <Switch
                    id="enableWhatsAppNotifications"
                    checked={settings?.enableWhatsAppNotifications || false}
                    onCheckedChange={(checked) =>
                      updateSetting("enableWhatsAppNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Disable access for non-admin users
                    </p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={settings?.maintenanceMode || false}
                    onCheckedChange={(checked) =>
                      updateSetting("maintenanceMode", checked)
                    }
                  />
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="systemNotificationMessage">
                      System Notification Message
                    </Label>
                    <p className={p_CLASSES}>
                      {settings?.systemNotificationMessage || ""}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() =>
                      openEditDialog(
                        "systemNotificationMessage",
                        "System Notification Message",
                        "Set the message to display to all users",
                        "textarea"
                      )
                    }
                  >
                    <IconEdit2 />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <DashboardCardHeader
                title="Notification Settings"
                description={`Configure email and notification preferences`}
                Icon={IconBellBing}
                iconBadge={false}
              />
              <CardContent className={GRID_CLASSES}>
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="notifyAdminOnNewInstaller">
                      Notify Admin on New Installer
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Email admin when installer registers
                    </p>
                  </div>
                  <Switch
                    id="notifyAdminOnNewInstaller"
                    checked={settings?.notifyAdminOnNewInstaller || false}
                    onCheckedChange={(checked) =>
                      updateSetting("notifyAdminOnNewInstaller", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="notifyAdminOnRewardSubmission">
                      Notify Admin on Reward Submission
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Email admin on new reward submission
                    </p>
                  </div>
                  <Switch
                    id="notifyAdminOnRewardSubmission"
                    checked={settings?.notifyAdminOnRewardSubmission || false}
                    onCheckedChange={(checked) =>
                      updateSetting("notifyAdminOnRewardSubmission", checked)
                    }
                  />
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="adminNotificationEmail">
                      Admin Notification Email
                    </Label>
                    <p className={p_CLASSES}>
                      {settings?.adminNotificationEmail || "No email set"}
                    </p>
                  </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        openEditDialog(
                          "adminNotificationEmail",
                          "Admin Notification Email",
                          "Set the email address for admin notifications",
                          "email"
                        )
                      }
                      className="cursor-pointer"
                    >
                      <IconEdit2 />
                    </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <DashboardCardHeader
                title="Data Management"
                description={`Configure bulk operations and data retention`}
                Icon={IconDatabase}
                iconBadge={false}
              />
              <CardContent className={GRID_CLASSES}>
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="allowBulkRewardUpload">
                      Allow Bulk Reward Upload
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Enable Excel bulk upload feature
                    </p>
                  </div>
                  <Switch
                    id="allowBulkRewardUpload"
                    checked={settings?.allowBulkRewardUpload || false}
                    onCheckedChange={(checked) =>
                      updateSetting("allowBulkRewardUpload", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="autoDeleteOldActivities">
                      Auto Delete Old Activities
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically clean up old activity logs
                    </p>
                  </div>
                  <Switch
                    id="autoDeleteOldActivities"
                    checked={settings?.autoDeleteOldActivities || false}
                    onCheckedChange={(checked) =>
                      updateSetting("autoDeleteOldActivities", checked)
                    }
                  />
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="maxBulkUploadSize">
                      Max Bulk Upload Size (rows)
                    </Label>
                    <p className={p_CLASSES}>
                      {settings?.maxBulkUploadSize || 1000} rows
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      openEditDialog(
                        "maxBulkUploadSize",
                        "Max Bulk Upload Size",
                        "Set the maximum number of rows allowed in bulk uploads",
                        "number"
                      )
                    }
                    className="shrink-0"
                  >
                    <IconEdit2 />
                  </Button>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor="activityLogRetentionDays">
                      Activity Log Retention (Days)
                    </Label>
                    <p className={p_CLASSES}>
                      {settings?.activityLogRetentionDays || 90} days
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      openEditDialog(
                        "activityLogRetentionDays",
                        "Activity Log Retention",
                        "Set the number of days to retain activity logs",
                        "number"
                      )
                    }
                    className="shrink-0"
                  >
                    <IconEdit2 />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Last Updated Info */}
          {settings?.updatedAt && (
            <Alert className="mt-6 squircle rounded-2xl py-6">
              <AlertDescription>
                Last updated: {new Date(settings.updatedAt).toLocaleString()}
              </AlertDescription>
            </Alert>
          )}
          {hasChanges && (
            <AnimatePresence>
              <div className="w-xl fixed left-1/2 bottom-8 -translate-x-1/2">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="bg-background/70 border border-border backdrop-blur-xl p-6 squircle rounded-2xl shadow-lg flex items-center justify-between"
                >
                  <p className="text-center text-sm text-muted-foreground">
                    Careful⠀⎯ ⠀You have unsaved changes
                  </p>

                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setSettings(originalSettings)}
                    >
                      Discard
                    </Button>

                    <Button
                      onClick={handleSave}
                      disabled={saving || !hasChanges}
                      className="gap-2"
                    >
                      <IconSave width={2} />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </motion.div>
              </div>
            </AnimatePresence>
          )}
          {settings && (
            <EditSettingDialog
              isOpen={dialogConfig.isOpen}
              onClose={() =>
                setDialogConfig((prev) => ({ ...prev, isOpen: false }))
              }
              onSave={handleDialogSave}
              title={dialogConfig.title}
              description={dialogConfig.description}
              currentValue={
                dialogConfig.key
                  ? (settings[dialogConfig.key] as string | number)
                  : ""
              }
              type={dialogConfig.type}
              isSaving={dialogSaving}
            />
          )}
        </>
      )}

      {/* Reset to Defaults Confirmation Dialog */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Default Settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all settings to their default values. This action
              cannot be undone and will overwrite all your current settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetToDefaults}
              disabled={resetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting ? "Resetting..." : "Reset to Defaults"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
