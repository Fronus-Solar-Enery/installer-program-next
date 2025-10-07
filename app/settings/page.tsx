'use client';

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface SettingsData {
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

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Settings saved successfully');
        fetchSettings();
      } else {
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SettingsData, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <SettingsIcon className="h-8 w-8" />
              System Settings
            </h1>
            <p className="text-muted-foreground mt-1">Configure system-wide settings and preferences</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={fetchSettings}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Installer Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Installer Settings</CardTitle>
              <CardDescription>Configure installer-related preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="allowInstallerCodeEdit">Allow Installer Code Edit</Label>
                  <p className="text-xs text-muted-foreground">Allow editing installer codes after creation</p>
                </div>
                <Switch
                  id="allowInstallerCodeEdit"
                  checked={settings?.allowInstallerCodeEdit || false}
                  onCheckedChange={(checked) => updateSetting('allowInstallerCodeEdit', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxReferralsPerInstaller">Max Referrals Per Installer</Label>
                <Input
                  id="maxReferralsPerInstaller"
                  type="number"
                  min="0"
                  max="100"
                  value={settings?.maxReferralsPerInstaller || 5}
                  onChange={(e) => updateSetting('maxReferralsPerInstaller', parseInt(e.target.value))}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="requireCertificationForRewards">Require Certification for Rewards</Label>
                  <p className="text-xs text-muted-foreground">Only certified installers can receive rewards</p>
                </div>
                <Switch
                  id="requireCertificationForRewards"
                  checked={settings?.requireCertificationForRewards || false}
                  onCheckedChange={(checked) => updateSetting('requireCertificationForRewards', checked)}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="autoVerifyInstallers">Auto Verify Installers</Label>
                  <p className="text-xs text-muted-foreground">Automatically verify new installers</p>
                </div>
                <Switch
                  id="autoVerifyInstallers"
                  checked={settings?.autoVerifyInstallers || false}
                  onCheckedChange={(checked) => updateSetting('autoVerifyInstallers', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Reward Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Reward Settings</CardTitle>
              <CardDescription>Configure reward and payment preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="defaultReferralReward">Default Referral Reward (Rs.)</Label>
                <Input
                  id="defaultReferralReward"
                  type="number"
                  min="0"
                  value={settings?.defaultReferralReward || 500}
                  onChange={(e) => updateSetting('defaultReferralReward', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxRewardProcessingDays">Max Reward Processing Days</Label>
                <Input
                  id="maxRewardProcessingDays"
                  type="number"
                  min="1"
                  value={settings?.maxRewardProcessingDays || 30}
                  onChange={(e) => updateSetting('maxRewardProcessingDays', parseInt(e.target.value))}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="requireTransactionIdForPaid">Require Transaction ID for Paid</Label>
                  <p className="text-xs text-muted-foreground">Transaction ID required to mark as PAID</p>
                </div>
                <Switch
                  id="requireTransactionIdForPaid"
                  checked={settings?.requireTransactionIdForPaid || false}
                  onCheckedChange={(checked) => updateSetting('requireTransactionIdForPaid', checked)}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="autoSendWhatsAppOnPaid">Auto Send WhatsApp on Paid</Label>
                  <p className="text-xs text-muted-foreground">Automatically send WhatsApp when marked as PAID</p>
                </div>
                <Switch
                  id="autoSendWhatsAppOnPaid"
                  checked={settings?.autoSendWhatsAppOnPaid || false}
                  onCheckedChange={(checked) => updateSetting('autoSendWhatsAppOnPaid', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Team Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>Manage team and user access settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="allowUserSelfRegistration">Allow User Self Registration</Label>
                  <p className="text-xs text-muted-foreground">Users can register without admin approval</p>
                </div>
                <Switch
                  id="allowUserSelfRegistration"
                  checked={settings?.allowUserSelfRegistration || false}
                  onCheckedChange={(checked) => updateSetting('allowUserSelfRegistration', checked)}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="requireEmailVerification">Require Email Verification</Label>
                  <p className="text-xs text-muted-foreground">Verify email before account activation</p>
                </div>
                <Switch
                  id="requireEmailVerification"
                  checked={settings?.requireEmailVerification || false}
                  onCheckedChange={(checked) => updateSetting('requireEmailVerification', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeoutMinutes">Session Timeout (Minutes)</Label>
                <Input
                  id="sessionTimeoutMinutes"
                  type="number"
                  min="30"
                  value={settings?.sessionTimeoutMinutes || 480}
                  onChange={(e) => updateSetting('sessionTimeoutMinutes', parseInt(e.target.value))}
                />
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
                  <Label htmlFor="enableActivityLogging">Enable Activity Logging</Label>
                  <p className="text-xs text-muted-foreground">Track all user actions</p>
                </div>
                <Switch
                  id="enableActivityLogging"
                  checked={settings?.enableActivityLogging || false}
                  onCheckedChange={(checked) => updateSetting('enableActivityLogging', checked)}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="enableWhatsAppNotifications">Enable WhatsApp Notifications</Label>
                  <p className="text-xs text-muted-foreground">Send WhatsApp messages to installers</p>
                </div>
                <Switch
                  id="enableWhatsAppNotifications"
                  checked={settings?.enableWhatsAppNotifications || false}
                  onCheckedChange={(checked) => updateSetting('enableWhatsAppNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-xs text-muted-foreground">Disable access for non-admin users</p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings?.maintenanceMode || false}
                  onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemNotificationMessage">System Notification Message</Label>
                <Textarea
                  id="systemNotificationMessage"
                  value={settings?.systemNotificationMessage || ''}
                  onChange={(e) => updateSetting('systemNotificationMessage', e.target.value)}
                  rows={3}
                  placeholder="Display a message to all users..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure email and notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="notifyAdminOnNewInstaller">Notify Admin on New Installer</Label>
                  <p className="text-xs text-muted-foreground">Email admin when installer registers</p>
                </div>
                <Switch
                  id="notifyAdminOnNewInstaller"
                  checked={settings?.notifyAdminOnNewInstaller || false}
                  onCheckedChange={(checked) => updateSetting('notifyAdminOnNewInstaller', checked)}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="notifyAdminOnRewardSubmission">Notify Admin on Reward Submission</Label>
                  <p className="text-xs text-muted-foreground">Email admin on new reward submission</p>
                </div>
                <Switch
                  id="notifyAdminOnRewardSubmission"
                  checked={settings?.notifyAdminOnRewardSubmission || false}
                  onCheckedChange={(checked) => updateSetting('notifyAdminOnRewardSubmission', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminNotificationEmail">Admin Notification Email</Label>
                <Input
                  id="adminNotificationEmail"
                  type="email"
                  value={settings?.adminNotificationEmail || ''}
                  onChange={(e) => updateSetting('adminNotificationEmail', e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Configure bulk operations and data retention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="allowBulkRewardUpload">Allow Bulk Reward Upload</Label>
                  <p className="text-xs text-muted-foreground">Enable Excel bulk upload feature</p>
                </div>
                <Switch
                  id="allowBulkRewardUpload"
                  checked={settings?.allowBulkRewardUpload || false}
                  onCheckedChange={(checked) => updateSetting('allowBulkRewardUpload', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxBulkUploadSize">Max Bulk Upload Size (rows)</Label>
                <Input
                  id="maxBulkUploadSize"
                  type="number"
                  min="1"
                  value={settings?.maxBulkUploadSize || 1000}
                  onChange={(e) => updateSetting('maxBulkUploadSize', parseInt(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityLogRetentionDays">Activity Log Retention (Days)</Label>
                <Input
                  id="activityLogRetentionDays"
                  type="number"
                  min="30"
                  value={settings?.activityLogRetentionDays || 90}
                  onChange={(e) => updateSetting('activityLogRetentionDays', parseInt(e.target.value))}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <Label htmlFor="autoDeleteOldActivities">Auto Delete Old Activities</Label>
                  <p className="text-xs text-muted-foreground">Automatically clean up old activity logs</p>
                </div>
                <Switch
                  id="autoDeleteOldActivities"
                  checked={settings?.autoDeleteOldActivities || false}
                  onCheckedChange={(checked) => updateSetting('autoDeleteOldActivities', checked)}
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
      </div>
    </div>
  );
}
