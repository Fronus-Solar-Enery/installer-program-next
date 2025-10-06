'use client';

import { useState, useEffect } from 'react';
import Modal from './Modal';
import { PRODUCT_MODELS, PAYMENT_METHOD } from '@/lib/constants';
import { PaymentStatus } from '@/types/rewards';
import { toast } from 'sonner';

interface RewardEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rewardId: string;
  onSuccess?: () => void;
}

export default function RewardEditModal({
  open,
  onOpenChange,
  rewardId,
  onSuccess,
}: RewardEditModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reward, setReward] = useState<any>(null);

  // Form fields
  const [serialNumber, setSerialNumber] = useState('');
  const [productModel, setProductModel] = useState('');
  const [inverterSerialNumber, setInverterSerialNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [transactionId, setTransactionId] = useState('');
  const [referrerTransactionId, setReferrerTransactionId] = useState('');
  const [sendingDate, setSendingDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    if (open && rewardId) {
      fetchReward();
    }
  }, [open, rewardId]);

  const fetchReward = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rewards/${rewardId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reward');
      }

      const r = data.data;
      setReward(r);

      // Populate form fields
      setSerialNumber(r.serialNumber || '');
      setProductModel(r.productModel || '');
      setInverterSerialNumber(r.inverterSerialNumber || '');
      setPaymentStatus(r.paymentStatus);
      setTransactionId(r.transactionId || '');
      setReferrerTransactionId(r.referrerTransactionId || '');
      setSendingDate(r.sendingDate ? new Date(r.sendingDate).toISOString().split('T')[0] : '');
      setPaymentMethod(r.paymentMethod || '');
    } catch (err: any) {
      toast.error(err.message || 'Failed to load reward');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/rewards/${rewardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serialNumber,
          productModel,
          inverterSerialNumber,
          paymentStatus,
          transactionId: transactionId || undefined,
          referrerTransactionId: reward?.referrer ? (referrerTransactionId || undefined) : undefined,
          sendingDate: sendingDate || undefined,
          paymentMethod: paymentMethod || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Reward updated successfully');
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(data.error || 'Failed to update reward');
      }
    } catch (error) {
      console.error('Failed to update reward:', error);
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
        title="Edit Reward"
        size="xl"
      >
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading reward data...</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Reward"
      description={`Serial Number: ${reward?.serialNumber}`}
      size="xl"
      openInTabUrl={`/rewards/${rewardId}/edit`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reward Summary */}
        <div className="bg-muted rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Reward Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Installer:</span>
              <span className="ml-2 font-medium">{reward?.installer?.installerCode} - {reward?.installer?.fullName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Reward Amount:</span>
              <span className="ml-2 font-medium text-green-600">Rs. {reward?.rewardAmount?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Serial Number */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Serial Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Product Model */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Product Model <span className="text-red-500">*</span>
            </label>
            <select
              value={productModel}
              onChange={(e) => setProductModel(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select product model</option>
              {PRODUCT_MODELS.map((product) => (
                <option key={product.value} value={product.value}>
                  {product.label} (Rs. {product.reward.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Inverter Serial Number */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Inverter Serial Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={inverterSerialNumber}
              onChange={(e) => setInverterSerialNumber(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Payment Status <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value={PaymentStatus.PENDING}>Pending</option>
              <option value={PaymentStatus.PAID}>Paid</option>
              <option value={PaymentStatus.FAILED}>Failed</option>
            </select>
          </div>

          {/* Installer Transaction ID */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Installer Transaction ID
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Referrer Transaction ID - Only if referrer exists */}
          {reward?.referrer && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Referrer Transaction ID
              </label>
              <input
                type="text"
                value={referrerTransactionId}
                onChange={(e) => setReferrerTransactionId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}

          {/* Sending Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Sending Date
            </label>
            <input
              type="date"
              value={sendingDate}
              onChange={(e) => setSendingDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select payment method</option>
              {PAYMENT_METHOD.map(method => (
                <option key={method.value} value={method.value}>{method.label}</option>
              ))}
            </select>
          </div>
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
