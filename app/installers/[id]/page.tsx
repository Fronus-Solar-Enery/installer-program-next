'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { Copy, Check, Edit, Trash2, ArrowLeft, Award, TrendingUp, Activity as ActivityIcon, Package } from 'lucide-react';

export default function InstallerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const installerId = params.id as string;
  const { copiedText, copyToClipboard } = useCopyToClipboard();

  const [loading, setLoading] = useState(true);
  const [installer, setInstaller] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'products'>('details');
  const [activities, setActivities] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    fetchInstaller();
  }, [installerId]);

  useEffect(() => {
    if (activeTab === 'activity' && activities.length === 0) {
      fetchActivities();
    } else if (activeTab === 'products' && products.length === 0) {
      fetchProducts();
    }
  }, [activeTab]);

  const fetchInstaller = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/installers/${installerId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch installer');
      }

      setInstaller(data.data.installer);
      setStatistics(data.data.statistics);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch installer');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoadingActivities(true);

      // Fetch installer-specific activities
      const installerActivitiesRes = await fetch(`/api/activities?targetType=Installer&targetId=${installerId}&limit=100`);
      const installerActivitiesData = await installerActivitiesRes.json();

      // Fetch all reward activities for this installer's rewards
      const productsRes = await fetch(`/api/rewards?installer=${installerId}&limit=1000`);
      const productsData = await productsRes.json();

      let allActivities: any[] = [];

      // Add installer activities
      if (installerActivitiesData.success) {
        allActivities = [...installerActivitiesData.data.activities];
      }

      // Fetch reward activities for each product
      if (productsData.success && productsData.data.rewards.length > 0) {
        const rewardIds = productsData.data.rewards.map((r: any) => r._id);

        // Fetch activities for all rewards
        const rewardActivitiesPromises = rewardIds.map((rewardId: string) =>
          fetch(`/api/activities?targetType=InstallerReward&targetId=${rewardId}&limit=100`)
            .then(res => res.json())
        );

        const rewardActivitiesResults = await Promise.all(rewardActivitiesPromises);

        rewardActivitiesResults.forEach((result) => {
          if (result.success) {
            allActivities = [...allActivities, ...result.data.activities];
          }
        });
      }

      // Sort all activities by date (newest first)
      allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setActivities(allActivities);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch(`/api/rewards?installer=${installerId}&limit=1000`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data.rewards);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this installer? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/installers/${installerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Installer deleted successfully!');
        router.push('/installers');
      } else {
        alert(data.error || 'Failed to delete installer');
      }
    } catch (error) {
      console.error('Failed to delete installer:', error);
      alert('An error occurred while deleting the installer');
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
          <p className="text-gray-600">Loading installer details...</p>
        </div>
      </div>
    );
  }

  if (error || !installer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Installer not found'}</p>
            <button
              onClick={() => router.push('/installers')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Back to Installers
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
            onClick={() => router.push('/installers')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Installers
          </button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{installer.fullName}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Installer Code: {installer.installerCode}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/installers/${installerId}/edit`)}
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

        {/* Certified Badge */}
        {installer.certified && (
          <div className="mb-6">
            <span className="px-4 py-2 inline-flex items-center text-sm font-semibold rounded-full bg-green-100 text-green-800">
              <Award className="h-4 w-4 mr-2" />
              Certified Installer
            </span>
          </div>
        )}

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Rewards</p>
                  <p className="text-2xl font-semibold text-gray-900">{statistics.totalRewards}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <span className="text-yellow-600 font-bold">P</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-semibold text-yellow-600">{statistics.pendingRewards}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Paid</p>
                  <p className="text-2xl font-semibold text-green-600">{statistics.paidRewards}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 font-bold">F</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Failed</p>
                  <p className="text-2xl font-semibold text-red-600">{statistics.failedRewards}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Statistics */}
        {statistics && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 mb-6 text-white">
            <h2 className="text-lg font-semibold mb-4">Revenue Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm opacity-90">Total Amount</p>
                <p className="text-2xl font-bold">Rs. {statistics.totalAmount?.toLocaleString() || 0}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Pending Amount</p>
                <p className="text-2xl font-bold">Rs. {statistics.pendingAmount?.toLocaleString() || 0}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Paid Amount</p>
                <p className="text-2xl font-bold">Rs. {statistics.paidAmount?.toLocaleString() || 0}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Failed Amount</p>
                <p className="text-2xl font-bold">Rs. {statistics.failedAmount?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'details'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Edit className="h-4 w-4 mr-2" />
                Details
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'activity'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ActivityIcon className="h-4 w-4 mr-2" />
                Activity
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'products'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="h-4 w-4 mr-2" />
                Products ({statistics?.totalRewards || 0})
              </button>
            </nav>
          </div>
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{installer.fullName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">CNIC</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  {installer.cnic}
                  <CopyButton text={installer.cnic} label="CNIC" />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  {installer.phoneNumber}
                  <CopyButton text={installer.phoneNumber} label="Phone Number" />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">WhatsApp Number</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  {installer.whatsappNumber}
                  <CopyButton text={installer.whatsappNumber} label="WhatsApp Number" />
                </dd>
              </div>
            </dl>
          </div>

          {/* Location Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">City</dt>
                <dd className="mt-1 text-sm text-gray-900">{installer.city}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Province</dt>
                <dd className="mt-1 text-sm text-gray-900">{installer.province}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{installer.address}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Training Center</dt>
                <dd className="mt-1 text-sm text-gray-900">{installer.trainingCenter}</dd>
              </div>
            </dl>
          </div>

          {/* Banking Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Banking Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Bank Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{installer.bankName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Account Number</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  {installer.accountNumber}
                  <CopyButton text={installer.accountNumber} label="Account Number" />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Account Title</dt>
                <dd className="mt-1 text-sm text-gray-900">{installer.accountTitle}</dd>
              </div>
            </dl>
          </div>

          {/* Professional Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Installer Code</dt>
                <dd className="mt-1 text-sm font-mono font-bold text-gray-900 flex items-center">
                  {installer.installerCode}
                  <CopyButton text={installer.installerCode} label="Installer Code" />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Certified</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {installer.certified ? (
                    <span className="text-green-600 font-semibold">Yes</span>
                  ) : (
                    <span className="text-gray-500">No</span>
                  )}
                </dd>
              </div>
              {installer.companyName && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{installer.companyName}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Referrer Information */}
          {installer.referrer && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Referrer Information</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Referrer Code</dt>
                  <dd className="mt-1 text-sm text-gray-900 flex items-center">
                    {installer.referrer.installerCode}
                    <CopyButton text={installer.referrer.installerCode} label="Referrer Code" />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Referrer Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{installer.referrer.fullName}</dd>
                </div>
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
                  {installer.registeredBy?.name || 'N/A'} ({installer.registeredBy?.email || 'N/A'})
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(installer.createdAt).toLocaleString()}
                </dd>
              </div>
              {installer.updatedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(installer.updatedAt).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
            </div>
            <div className="p-6">
              {loadingActivities ? (
                <p className="text-center text-gray-600 py-8">Loading activities...</p>
              ) : activities.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No activities found</p>
              ) : (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {activities.map((activity: any, index: number) => (
                      <li key={activity._id}>
                        <div className="relative pb-8">
                          {index !== activities.length - 1 && (
                            <span
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                activity.type.includes('REGISTERED') ? 'bg-green-500' :
                                activity.type.includes('UPDATED') ? 'bg-blue-500' :
                                activity.type.includes('DELETED') ? 'bg-red-500' :
                                activity.type.includes('PAID') ? 'bg-green-500' :
                                activity.type.includes('FAILED') ? 'bg-red-500' :
                                'bg-gray-500'
                              }`}>
                                <ActivityIcon className="h-4 w-4 text-white" />
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                              <div>
                                <p className="text-sm text-gray-900">{activity.description}</p>
                                <p className="mt-1 text-xs text-gray-500">
                                  By {activity.performedBy?.name || 'Unknown'}
                                </p>
                              </div>
                              <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                <time dateTime={activity.createdAt}>
                                  {new Date(activity.createdAt).toLocaleString()}
                                </time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Installed Products</h2>
            </div>
            <div className="overflow-x-auto">
              {loadingProducts ? (
                <p className="text-center text-gray-600 py-8">Loading products...</p>
              ) : products.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No products found</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serial Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Model
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        City
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reward Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Installation Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product: any) => (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {product.serialNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.productModel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.cityOfInstallation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          Rs. {product.rewardAmount?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                            product.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {product.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.installationDate ? new Date(product.installationDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => router.push(`/rewards/${product._id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
