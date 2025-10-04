'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { Copy, Check, Trash2, Edit, Eye } from 'lucide-react';

export default function RewardsPage() {
  const router = useRouter();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const { copiedText, copyToClipboard } = useCopyToClipboard();

  // Filter states
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [sendingDateFilter, setSendingDateFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [serialNumberStatusFilter, setSerialNumberStatusFilter] = useState('');
  const [productModelFilter, setProductModelFilter] = useState('');
  const [teamMemberFilter, setTeamMemberFilter] = useState('');

  // Unique values for filters
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [serialNumberStatuses, setSerialNumberStatuses] = useState<string[]>([]);
  const [productModels, setProductModels] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchRewards();
  }, [paymentStatusFilter, sendingDateFilter, paymentMethodFilter, serialNumberStatusFilter, productModelFilter, teamMemberFilter]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (paymentStatusFilter && paymentStatusFilter !== 'ALL') {
        params.append('paymentStatus', paymentStatusFilter);
      }
      if (sendingDateFilter) {
        params.append('sendingDate', sendingDateFilter);
      }
      if (paymentMethodFilter) {
        params.append('paymentMethod', paymentMethodFilter);
      }
      if (serialNumberStatusFilter) {
        params.append('serialNumberStatus', serialNumberStatusFilter);
      }
      if (productModelFilter) {
        params.append('productModel', productModelFilter);
      }
      if (teamMemberFilter) {
        params.append('registeredBy', teamMemberFilter);
      }

      const response = await fetch(`/api/rewards?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRewards(data.data.rewards);

        // Extract unique values for filters
        const allRewards = data.data.rewards;
        setPaymentMethods([...new Set(allRewards.map((r: any) => r.paymentMethod).filter(Boolean))]);
        setSerialNumberStatuses([...new Set(allRewards.map((r: any) => r.serialNumberStatus).filter(Boolean))]);
        setProductModels([...new Set(allRewards.map((r: any) => r.productModel).filter(Boolean))]);

        // Get unique team members
        const uniqueTeamMembers = allRewards
          .map((r: any) => r.registeredBy)
          .filter((value: any, index: number, self: any[]) =>
            value && self.findIndex((t: any) => t?._id === value?._id) === index
          );
        setTeamMembers(uniqueTeamMembers);
      }
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;

    try {
      const response = await fetch(`/api/rewards/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Reward deleted successfully!');
        fetchRewards();
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
        onClick={() => handleCopy(text)}
        className="ml-2 p-1 text-gray-400 hover:text-indigo-600 transition-colors"
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

  const clearFilters = () => {
    setPaymentStatusFilter('ALL');
    setSendingDateFilter('');
    setPaymentMethodFilter('');
    setSerialNumberStatusFilter('');
    setProductModelFilter('');
    setTeamMemberFilter('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Rewards</h1>
          <button
            onClick={() => router.push('/rewards/new')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            + Register New Reward
          </button>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Clear All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Payment Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {/* Sending Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sending Date
              </label>
              <input
                type="date"
                value={sendingDateFilter}
                onChange={(e) => setSendingDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Payment Method Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Methods</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* Serial Number Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial Number Status
              </label>
              <select
                value={serialNumberStatusFilter}
                onChange={(e) => setSerialNumberStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Status</option>
                {serialNumberStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Product Model Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Model
              </label>
              <select
                value={productModelFilter}
                onChange={(e) => setProductModelFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Models</option>
                {productModels.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            {/* Team Member Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registered By
              </label>
              <select
                value={teamMemberFilter}
                onChange={(e) => setTeamMemberFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Team Members</option>
                {teamMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading rewards...</div>
            </div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-600">No rewards found</div>
              <button
                onClick={() => router.push('/rewards/new')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Register First Reward
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installer Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rewards.map((reward: any) => (
                    <tr key={reward._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          {reward.serialNumber}
                          <CopyButton text={reward.serialNumber} label="Serial Number" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          {reward.installerCode}
                          <CopyButton text={reward.installerCode} label="Installer Code" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reward.installer?.fullName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {reward.productModel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Rs. {reward.rewardAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          reward.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                          reward.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {reward.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => router.push(`/rewards/${reward._id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/rewards/${reward._id}/edit`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(reward._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
