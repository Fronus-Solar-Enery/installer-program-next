'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { PaymentStatus } from '@/models/InstallerReward';

const PAYMENT_METHODS = [
  'Bank Transfer',
  'Cheque',
  'Cash',
  'Online Payment',
  'Mobile Banking',
];

export default function EditRewardPage() {
  const router = useRouter();
  const params = useParams();
  const rewardId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [reward, setReward] = useState<any>(null);

  // Form fields
  const [transactionId, setTransactionId] = useState('');
  const [referrerTransactionId, setReferrerTransactionId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [sendingDate, setSendingDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    fetchReward();
  }, [rewardId]);

  const fetchReward = async () => {
    try {
      setFetchLoading(true);
      const response = await fetch(`/api/rewards/${rewardId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reward');
      }

      setReward(data.data);
      // Pre-fill form with existing data
      setTransactionId(data.data.transactionId || '');
      setReferrerTransactionId(data.data.referrerTransactionId || '');
      setPaymentStatus(data.data.paymentStatus);
      setSendingDate(data.data.sendingDate ? new Date(data.data.sendingDate).toISOString().split('T')[0] : '');
      setPaymentMethod(data.data.paymentMethod || '');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reward');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!transactionId) {
      setError('Installer transaction ID is required');
      setLoading(false);
      return;
    }

    if (reward?.referrer && !referrerTransactionId) {
      setError('Referrer transaction ID is required when installer has a referrer');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/rewards/${rewardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId,
          referrerTransactionId: reward?.referrer ? referrerTransactionId : undefined,
          paymentStatus,
          sendingDate: sendingDate || undefined,
          paymentMethod: paymentMethod || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update reward');
      }

      alert('Reward updated successfully!');
      router.push('/rewards');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600">Loading reward details...</p>
        </div>
      </div>
    );
  }

  if (!reward) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-red-600">Reward not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Reward Payment Details</h1>
          <button
            onClick={() => router.push('/rewards')}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Back to Rewards
          </button>
        </div>

        {/* Reward Summary */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reward Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Serial Number:</span>
              <span className="ml-2 font-medium">{reward.serialNumber}</span>
            </div>
            <div>
              <span className="text-gray-600">Product Model:</span>
              <span className="ml-2 font-medium">{reward.productModel}</span>
            </div>
            <div>
              <span className="text-gray-600">Installer:</span>
              <span className="ml-2 font-medium">{reward.installer?.installerCode} - {reward.installer?.fullName}</span>
            </div>
            <div>
              <span className="text-gray-600">Reward Amount:</span>
              <span className="ml-2 font-medium text-green-600">Rs. {reward.rewardAmount?.toLocaleString()}</span>
            </div>
            {reward.referrer && (
              <>
                <div>
                  <span className="text-gray-600">Referrer:</span>
                  <span className="ml-2 font-medium text-blue-600">
                    {reward.referrer.installerCode} - {reward.referrer.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Referrer Reward:</span>
                  <span className="ml-2 font-medium text-green-600">Rs. {reward.referrerRewardAmount || 500}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>

          <div className="space-y-6">
            {/* Installer Transaction ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Installer Transaction ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter transaction ID"
                required
              />
            </div>

            {/* Referrer Transaction ID - Only if referrer exists */}
            {reward.referrer && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referrer Transaction ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={referrerTransactionId}
                  onChange={(e) => setReferrerTransactionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter referrer transaction ID"
                  required
                />
              </div>
            )}

            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value={PaymentStatus.PENDING}>Pending</option>
                <option value={PaymentStatus.PAID}>Paid</option>
                <option value={PaymentStatus.FAILED}>Failed</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select payment method</option>
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* Sending Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sending Date
              </label>
              <input
                type="date"
                value={sendingDate}
                onChange={(e) => setSendingDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/rewards')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
              >
                {loading ? 'Updating...' : 'Update Payment Details'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
