'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Settings as SettingsIcon, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);

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

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <SettingsIcon className="h-8 w-8" />
              System Settings
            </h1>
            <p className="text-gray-600 mt-1">Configure system-wide settings and preferences</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchSettings}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Installer Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Installer Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Allow Installer Code Edit</label>
                  <p className="text-xs text-gray-500">Allow editing installer codes after creation</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.allowInstallerCodeEdit || false}
                  onChange={(e) => updateSetting('allowInstallerCodeEdit', e.target.checked)}
                  className="h-5 w-5 text-indigo-600 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Referrals Per Installer
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings?.maxReferralsPerInstaller || 5}
                  onChange={(e) => updateSetting('maxReferralsPerInstaller', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Require Certification for Rewards</label>
                  <p className="text-xs text-gray-500">Only certified installers can receive rewards</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.requireCertificationForRewards || false}
                  onChange={(e) => updateSetting('requireCertificationForRewards', e.target.checked)}
                  className="h-5 w-5 text-indigo-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Auto Verify Installers</label>
                  <p className="text-xs text-gray-500">Automatically verify new installers</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.autoVerifyInstallers || false}
                  onChange={(e) => updateSetting('autoVerifyInstallers', e.target.checked)}
                  className="h-5 w-5 text-indigo-600 rounded"
                />
              </div>
            </div>
          </div>

          {/* Reward Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reward Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Referral Reward (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings?.defaultReferralReward || 500}
                  onChange={(e) => updateSetting('defaultReferralReward', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Reward Processing Days
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings?.maxRewardProcessingDays || 30}
                  onChange={(e) => updateSetting('maxRewardProcessingDays', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Require Transaction ID for Paid</label>
                  <p className="text-xs text-gray-500">Transaction ID required to mark as PAID</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.requireTransactionIdForPaid || false}
                  onChange={(e) => updateSetting('requireTransactionIdForPaid', e.target.checked)}
                  className="h-5 w-5 text-indigo-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Auto Send WhatsApp on Paid</label>
                  <p className="text-xs text-gray-500">Automatically send WhatsApp when marked as PAID</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.autoSendWhatsAppOnPaid || false}
                  onChange={(e) => updateSetting('autoSendWhatsAppOnPaid', e.target.checked)}
                  className="h-5 w-5 text-indigo-600 rounded"
                />
              </div>
            </div>
          </div>

          {/* Team Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Allow User Self Registration</label>
                  <p className="text-xs text-gray-500">Users can register without admin approval</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.allowUserSelfRegistration || false}
                  onChange={(e) => updateSetting('allowUserSelfRegistration', e.target.checked)}
                  className="h-5 w-5 text-indigo-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Require Email Verification</label>
                  <p className="text-xs text-gray-500">Verify email before account activation</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.requireEmailVerification || false}
                  onChange={(e) => updateSetting('requireEmailVerification', e.target.checked)}
                  className="h-5 w-5 text-indigo-600 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (Minutes)
                </label>
                <input
                  type="number"
                  min="30"
                  value={settings?.sessionTimeoutMinutes || 480}
                  onChange={(e) => updateSetting('sessionTimeoutMinutes', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Enable Activity Logging</label>
                  <p className="text-xs text-gray-500">Track all user actions</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.enableActivityLogging || false}
                  onChange={(e) => updateSetting('enableActivityLogging', e.target.checked)}
                  className="h-5 w-5 text-indigo-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Enable WhatsApp Notifications</label>
                  <p className="text-xs text-gray-500">Send WhatsApp messages to installers</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.enableWhatsAppNotifications || false}
                  onChange={(e) => updateSetting('enableWhatsAppNotifications', e.target.checked)}
                  className="h-5 w-5 text-indigo-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
                  <p className="text-xs text-gray-500">Disable access for non-admin users</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.maintenanceMode || false}
                  onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
                  className="h-5 w-5 text-indigo-600 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Notification Message
                </label>
                <textarea
                  value={settings?.systemNotificationMessage || ''}
                  onChange={(e) => updateSetting('systemNotificationMessage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Display a message to all users..."
                />
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Notify Admin on New Installer</label>
                  <p className="text-xs text-gray-500">Email admin when installer registers</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.notifyAdminOnNewInstaller || false}
                  onChange={(e) => updateSetting('notifyAdminOnNewInstaller', e.target.checked)}
                  className="h-5 w-5 text-indigo-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Notify Admin on Reward Submission</label>
                  <p className="text-xs text-gray-500">Email admin on new reward submission</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.notifyAdminOnRewardSubmission || false}
                  onChange={(e) => updateSetting('notifyAdminOnRewardSubmission', e.target.checked)}
                  className="h-5 w-5 text-indigo-600 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notification Email
                </label>
                <input
                  type="email"
                  value={settings?.adminNotificationEmail || ''}
                  onChange={(e) => updateSetting('adminNotificationEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="admin@example.com"
                />
              </div>
            </div>
          </div>

          {/* Bulk Operations & Data Retention */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Allow Bulk Reward Upload</label>
                  <p className="text-xs text-gray-500">Enable Excel bulk upload feature</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.allowBulkRewardUpload || false}
                  onChange={(e) => updateSetting('allowBulkRewardUpload', e.target.checked)}
                  className="h-5 w-5 text-indigo-600 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Bulk Upload Size (rows)
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings?.maxBulkUploadSize || 1000}
                  onChange={(e) => updateSetting('maxBulkUploadSize', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Log Retention (Days)
                </label>
                <input
                  type="number"
                  min="30"
                  value={settings?.activityLogRetentionDays || 90}
                  onChange={(e) => updateSetting('activityLogRetentionDays', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Auto Delete Old Activities</label>
                  <p className="text-xs text-gray-500">Automatically clean up old activity logs</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings?.autoDeleteOldActivities || false}
                  onChange={(e) => updateSetting('autoDeleteOldActivities', e.target.checked)}
                  className="h-5 w-5 text-indigo-600 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated Info */}
        {settings?.updatedAt && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Last updated: {new Date(settings.updatedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
