'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { CITIES } from '@/lib/constants';
import { toast } from 'sonner';

interface InstallerEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installerId: string;
  onSuccess?: () => void;
}

const PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Gilgit-Baltistan',
  'Azad Jammu and Kashmir',
  'Islamabad Capital Territory',
];

export default function InstallerEditModal({
  open,
  onOpenChange,
  installerId,
  onSuccess,
}: InstallerEditModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [installer, setInstaller] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  // Form fields
  const [installerCode, setInstallerCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [cnic, setCnic] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [trainingCenter, setTrainingCenter] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [certified, setCertified] = useState(false);

  useEffect(() => {
    if (open && installerId) {
      fetchData();
    }
  }, [open, installerId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setLoading(true);
      setInstaller(null);
    }
  }, [open]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch installer and settings in parallel
      const [installerRes, settingsRes] = await Promise.all([
        fetch(`/api/installers/${installerId}`),
        fetch('/api/settings'),
      ]);

      const installerData = await installerRes.json();
      const settingsData = await settingsRes.json();

      if (installerData.success) {
        // The API returns { installer, statistics }, we need the installer object
        const inst = installerData.data.installer || installerData.data;
        setInstaller(inst);

        console.log('Loaded installer data:', inst); // Debug log

        // Populate form fields with existing values
        setInstallerCode(inst.installerCode || '');
        setFullName(inst.fullName || '');
        setCnic(inst.cnic || '');
        setPhoneNumber(inst.phoneNumber || '');
        setWhatsappNumber(inst.whatsappNumber || '');
        setAddress(inst.address || '');
        setCity(inst.city || '');
        setProvince(inst.province || '');
        setTrainingCenter(inst.trainingCenter || '');
        setCompanyName(inst.companyName || '');
        setBankName(inst.bankName || '');
        setAccountNumber(inst.accountNumber || '');
        setAccountTitle(inst.accountTitle || '');
        setCertified(inst.certified || false);
      } else {
        toast.error('Failed to load installer data');
      }

      if (settingsData.success) {
        setSettings(settingsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load installer data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData: any = {
        fullName,
        cnic,
        phoneNumber,
        whatsappNumber,
        address,
        city,
        province,
        trainingCenter,
        companyName,
        bankName,
        accountNumber,
        accountTitle,
        certified,
      };

      // Only include installerCode if editing is enabled
      if (settings?.allowInstallerCodeEdit) {
        updateData.installerCode = installerCode;
      }

      const response = await fetch(`/api/installers/${installerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Installer updated successfully');
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(data.error || 'Failed to update installer');
      }
    } catch (error) {
      console.error('Failed to update installer:', error);
      toast.error('An error occurred while updating');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="Edit Installer"
        size="xl"
      >
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading installer data...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Installer"
      description="Update installer information"
      size="xl"
      openInTabUrl={`/installers/${installerId}/edit`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Installer Code */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Installer Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={installerCode}
              onChange={(e) => setInstallerCode(e.target.value.toUpperCase())}
              disabled={!settings?.allowInstallerCodeEdit}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-muted disabled:cursor-not-allowed"
              required
            />
            {!settings?.allowInstallerCodeEdit && (
              <p className="mt-1 text-xs text-muted-foreground">
                Installer code editing is disabled by admin
              </p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* CNIC */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              CNIC <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={cnic}
              onChange={(e) => setCnic(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="12345-1234567-1"
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="+923001234567"
              required
            />
          </div>

          {/* WhatsApp Number */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              WhatsApp Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="+923001234567"
              required
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select City</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Province */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Province <span className="text-red-500">*</span>
            </label>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select Province</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Training Center */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Training Center <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={trainingCenter}
              onChange={(e) => setTrainingCenter(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Bank Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Account Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Account Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        </div>

        {/* Address - Full Width */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            rows={3}
            required
          />
        </div>

        {/* Certified Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="certified"
            checked={certified}
            onChange={(e) => setCertified(e.target.checked)}
            className="h-4 w-4 text-indigo-600 rounded"
          />
          <label htmlFor="certified" className="ml-2 text-sm font-medium text-foreground">
            Certified Installer
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-6 py-2 border border-border rounded-md text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
