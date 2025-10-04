'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { Copy, Check, Edit, Trash2, ArrowLeft } from 'lucide-react';

export default function RewardDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const rewardId = params.id as string;
  const { copiedText, copyToClipboard } = useCopyToClipboard();

  const [loading, setLoading] = useState(true);
  const [reward, setReward] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReward();
  }, [rewardId]);

  const fetchReward = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rewards/${rewardId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reward');
      }

      setReward(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reward');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this reward? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/rewards/${rewardId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Reward deleted successfully!');
        router.push('/rewards');
      } else {
        alert(data.error || 'Failed to delete reward');
      }
    } catch (error) {
      console.error('Failed to delete reward:', error);
      alert('An error occurred while deleting the reward');
    }
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => {
    const isCopied = copiedText === text;

    return (
      <button
        onClick={() => copyToClipboard(text)}
        className="ml-2 p-1 text-gray-400 hover:text-indigo-600 transition-colors inline-flex items-center"
        title={`Copy ${label}`}
      >
        {isCopied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600">Loading reward details...</p>
        </div>
      </div>
    );
  }

  if (error || !reward) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Reward not found'}</p>
            <button
              onClick={() => router.push('/rewards')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Rewards
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/rewards')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rewards
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reward Details</h1>
              <p className="mt-1 text-sm text-gray-500">
                Serial Number: {reward.serialNumber}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/rewards/${rewardId}/edit`)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Payment Status Badge */}
        <div className="mb-6">
          <span className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full ${
            reward.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
            reward.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {reward.paymentStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Product Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Serial Number</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  {reward.serialNumber}
                  <CopyButton text={reward.serialNumber} label="Serial Number" />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Product Model</dt>
                <dd className="mt-1 text-sm text-gray-900">{reward.productModel}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Serial Number Status</dt>
                <dd className="mt-1 text-sm text-gray-900">{reward.serialNumberStatus}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Inverter Serial Number</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  {reward.inverterSerialNumber}
                  <CopyButton text={reward.inverterSerialNumber} label="Inverter Serial Number" />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">City of Installation</dt>
                <dd className="mt-1 text-sm text-gray-900">{reward.cityOfInstallation}</dd>
              </div>
              {reward.installationDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Installation Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(reward.installationDate).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Installer Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Installer Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Installer Code</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  {reward.installerCode}
                  <CopyButton text={reward.installerCode} label="Installer Code" />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Installer Name</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {reward.installer?.fullName || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Installer CNIC</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {reward.installer?.cnic || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Installer Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {reward.installer?.phoneNumber || 'N/A'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Payment Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Reward Amount</dt>
                <dd className="mt-1 text-lg font-semibold text-green-600">
                  Rs. {reward.rewardAmount?.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Bank Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{reward.bankName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Account Number</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  {reward.accountNumber}
                  <CopyButton text={reward.accountNumber} label="Account Number" />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Account Title</dt>
                <dd className="mt-1 text-sm text-gray-900">{reward.accountTitle}</dd>
              </div>
              {reward.transactionId && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Transaction ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    {reward.transactionId}
                    <CopyButton text={reward.transactionId} label="Transaction ID" />
                  </dd>
                </div>
              )}
              {reward.paymentMethod && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Payment Method</dt>
                  <dd className="mt-1 text-sm text-gray-900">{reward.paymentMethod}</dd>
                </div>
              )}
              {reward.sendingDate && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Sending Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(reward.sendingDate).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Referrer Information (if exists) */}
          {reward.referrer && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Referrer Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Referrer Code</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    {reward.referrerCode}
                    <CopyButton text={reward.referrerCode} label="Referrer Code" />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Referrer Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {reward.referrer.fullName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Referrer Reward Amount</dt>
                  <dd className="mt-1 text-lg font-semibold text-green-600">
                    Rs. {reward.referrerRewardAmount || 500}
                  </dd>
                </div>
                {reward.referrerTransactionId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Referrer Transaction ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 flex items-center">
                      {reward.referrerTransactionId}
                      <CopyButton text={reward.referrerTransactionId} label="Referrer Transaction ID" />
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Registration Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Registered By</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {reward.registeredBy?.name || 'N/A'} ({reward.registeredBy?.email || 'N/A'})
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(reward.createdAt).toLocaleString()}
                </dd>
              </div>
              {reward.updatedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(reward.updatedAt).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
