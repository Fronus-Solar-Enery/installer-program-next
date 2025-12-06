"use client";

import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Pencil,
} from "lucide-react";
import { EditSettingDialog } from "./edit-setting-dialog";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminGuard } from "@/hooks/useRoleGuard";
import PageHeader from "@/components/PageHeader";
import {
  IconEdit2,
  IconInstaller,
  IconRefresh,
  IconRefresh2,
  IconReward,
  IconSetting3,
  IconSetting4,
  IconSettings,
} from "@/components/icons";
import IconReset from "@/components/icons/Reset";
import { DashboardCardHeader } from "../dashboard/page";

interface SettingsData {
  allowInstallerCodeEdit?: boolean;
  allowTrainingCenterEdit?: boolean;
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

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(originalSettings);

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

  const handleDialogSave = (value: string | number) => {
    if (dialogConfig.key) {
      updateSetting(dialogConfig.key, value);
    }
  };

  if (!isAuthorized) {
    return null;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="System Settings"
        description="Configure system-wide settings and preferences"
        iconFill
        Icon={IconSettings}
        action={
          <div className="flex gap-3">
            <Button onClick={fetchSettings} variant="outline" className="gap-1">
              <IconReset className="size-3.5!" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        }
      />
      <div className="space-y-2">
        <div className="flex gap-2">
          {/* Allow Installer Code Edit */}
          <Card className="flex items-center justify-between max-w-3xs p-6 gap-2">
            <div className="flex-1">
              <Label htmlFor="allowInstallerCodeEdit">InstallerCode Edit</Label>
              <p className="text-xs text-muted-foreground">
                Allow editing installer codes after creation
              </p>
            </div>
            <Switch
              id="allowInstallerCodeEdit"
              checked={settings?.allowInstallerCodeEdit || false}
              onCheckedChange={(checked) =>
                updateSetting("allowInstallerCodeEdit", checked)
              }
              className="h-7 w-12"
              thumbClassName="size-6 data-[state=checked]:translate-x-5"
            />
          </Card>

          {/* Allow Training Center Edit */}
          <Card className="flex items-center justify-between max-w-3xs p-6 gap-2">
            <div className="flex-1">
              <Label htmlFor="allowTrainingCenterEdit">
                Training Center Edit
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow editing training center after creation
              </p>
            </div>
            <Switch
              id="allowTrainingCenterEdit"
              checked={settings?.allowTrainingCenterEdit || false}
              onCheckedChange={(checked) =>
                updateSetting("allowTrainingCenterEdit", checked)
              }
              className="h-7 w-12"
              thumbClassName="size-6 data-[state=checked]:translate-x-5"
            />
          </Card>
        </div>
        <div>
          {/* Allow Training Center Edit */}
          <Card className="flex flex-col items-center justify-between max-w-[160px] p-6 gap-2">
            <div className="flex justify-between w-full">
              <div className="text-6xl font-mono font-bold">
                {settings?.maxReferralsPerInstaller}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-[12px] mt-2"
                onClick={() =>
                  openEditDialog(
                    "maxReferralsPerInstaller",
                    "Max Referrals Per Installer",
                    "Set the maximum number of referrals allowed per installer",
                    "number"
                  )
                }
              >
                <IconEdit2 fill duotone className="size-5" />
              </Button>
            </div>
            <div className="flex-1">
              <Label htmlFor="allowTrainingCenterEdit">Referrals</Label>
              <p className="text-xs text-muted-foreground">
                Max Referrals Per Installer
              </p>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Installer Settings */}
        <Card>
          <DashboardCardHeader
            title="Installer Settings"
            description={`Configure installer-related preferences`}
            Icon={IconInstaller}
            iconBadge={false}
          />
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="maxReferralsPerInstaller">
                Max Referrals Per Installer
              </Label>
              <div className="flex gap-2">
                <Input
                  id="maxReferralsPerInstaller"
                  type="number"
                  value={settings?.maxReferralsPerInstaller || 5}
                  readOnly
                  className="bg-muted"
                />
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
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
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
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="defaultReferralReward">
                Default Referral Reward (Rs.)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="defaultReferralReward"
                  type="number"
                  value={settings?.defaultReferralReward || 500}
                  readOnly
                  className="bg-muted"
                />
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
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRewardProcessingDays">
                Max Reward Processing Days
              </Label>
              <div className="flex gap-2">
                <Input
                  id="maxRewardProcessingDays"
                  type="number"
                  value={settings?.maxRewardProcessingDays || 30}
                  readOnly
                  className="bg-muted"
                />
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
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between space-x-2">
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
          <CardHeader>
            <CardTitle>Team Settings</CardTitle>
            <CardDescription>
              Manage team and user access settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="sessionTimeoutMinutes">
                Session Timeout (Minutes)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="sessionTimeoutMinutes"
                  type="number"
                  value={settings?.sessionTimeoutMinutes || 480}
                  readOnly
                  className="bg-muted"
                />
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
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Configure system-level options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="systemNotificationMessage">
                System Notification Message
              </Label>
              <div className="flex gap-2">
                <Textarea
                  id="systemNotificationMessage"
                  value={settings?.systemNotificationMessage || ""}
                  readOnly
                  rows={3}
                  className="bg-muted"
                  placeholder="Display a message to all users..."
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-auto"
                  onClick={() =>
                    openEditDialog(
                      "systemNotificationMessage",
                      "System Notification Message",
                      "Set the message to display to all users",
                      "textarea"
                    )
                  }
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Configure email and notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="adminNotificationEmail">
                Admin Notification Email
              </Label>
              <div className="flex gap-2">
                <Input
                  id="adminNotificationEmail"
                  type="email"
                  value={settings?.adminNotificationEmail || ""}
                  readOnly
                  className="bg-muted"
                  placeholder="admin@example.com"
                />
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
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Configure bulk operations and data retention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="maxBulkUploadSize">
                Max Bulk Upload Size (rows)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="maxBulkUploadSize"
                  type="number"
                  value={settings?.maxBulkUploadSize || 1000}
                  readOnly
                  className="bg-muted"
                />
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
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activityLogRetentionDays">
                Activity Log Retention (Days)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="activityLogRetentionDays"
                  type="number"
                  value={settings?.activityLogRetentionDays || 90}
                  readOnly
                  className="bg-muted"
                />
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
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
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
          </CardContent>
        </Card>
      </div>

      {/* Last Updated Info */}
      {settings?.updatedAt && (
        <Alert className="mt-6">
          <AlertDescription>
            Last updated: {new Date(settings.updatedAt).toLocaleString()}
          </AlertDescription>
        </Alert>
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
        />
      )}
    </>
  );
}
