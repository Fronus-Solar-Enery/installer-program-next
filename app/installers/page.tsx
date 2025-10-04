'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import InstallerEditModal from '@/components/InstallerEditModal';
import { Edit, Eye, ArrowUpDown, ArrowUp, ArrowDown, Settings2 } from 'lucide-react';

export default function InstallersPage() {
  const router = useRouter();
  const [installers, setInstallers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [googleAuthStatus, setGoogleAuthStatus] = useState<{
    isAuthenticated: boolean;
    hasRefreshToken: boolean;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedInstallerId, setSelectedInstallerId] = useState('');

  // Sorting state
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    installerCode: true,
    fullName: true,
    cnic: true,
    phoneNumber: true,
    city: true,
    province: false,
    trainingCenter: false,
    companyName: false,
    certified: true,
    bankName: false,
    accountNumber: false,
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  useEffect(() => {
    fetchInstallers();
    checkGoogleAuthStatus();

    // Check for auth callback success
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth_success')) {
      checkGoogleAuthStatus(); // Refresh status
      window.history.replaceState({}, '', '/installers');
    }
  }, []);

  const checkGoogleAuthStatus = async () => {
    try {
      const response = await fetch('/api/google-auth/status');
      const data = await response.json();
      setGoogleAuthStatus(data);
    } catch (err) {
      console.error('Failed to check Google auth status:', err);
    }
  };

  const handleAuthenticateGoogle = async () => {
    setAuthLoading(true);
    try {
      const response = await fetch('/api/google-auth/initiate');
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err: any) {
      console.error('Failed to authenticate:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchInstallers = async () => {
    try {
      const response = await fetch('/api/installers');
      const data = await response.json();

      if (data.success) {
        setInstallers(data.data.installers);
      }
    } catch (error) {
      console.error('Failed to fetch installers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column as keyof typeof prev],
    }));
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4 ml-1 inline" />
      : <ArrowDown className="h-4 w-4 ml-1 inline" />;
  };

  const filteredInstallers = installers.filter((installer: any) =>
    installer.fullName.toLowerCase().includes(search.toLowerCase()) ||
    installer.installerCode.toLowerCase().includes(search.toLowerCase()) ||
    installer.cnic.includes(search)
  );

  const sortedInstallers = [...filteredInstallers].sort((a: any, b: any) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
      return sortDirection === 'asc'
        ? (aVal === bVal ? 0 : aVal ? 1 : -1)
        : (aVal === bVal ? 0 : bVal ? 1 : -1);
    }

    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Installers</h1>

          {/* Show Authenticate button if not authenticated, otherwise Register button */}
          {googleAuthStatus && !googleAuthStatus.isAuthenticated ? (
            <button
              onClick={handleAuthenticateGoogle}
              disabled={authLoading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:bg-yellow-400 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              {authLoading ? 'Authenticating...' : '🔗 Authenticate Google Contacts'}
            </button>
          ) : (
            <button
              onClick={() => router.push('/installers/new')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              + Register New Installer
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4 flex gap-3">
            <input
              type="text"
              placeholder="Search by name, code, or CNIC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="relative">
              <button
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
              >
                <Settings2 className="h-4 w-4" />
                Columns
              </button>
              {showColumnMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <div className="p-2 max-h-96 overflow-y-auto">
                    <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                      Show/Hide Columns
                    </div>
                    {Object.entries(visibleColumns).map(([key, value]) => (
                      <label key={key} className="flex items-center px-2 py-2 hover:bg-gray-50 cursor-pointer rounded">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={() => toggleColumn(key)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading installers...</div>
            </div>
          ) : sortedInstallers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-600">No installers found</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {visibleColumns.installerCode && (
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('installerCode')}
                      >
                        Installer Code {getSortIcon('installerCode')}
                      </th>
                    )}
                    {visibleColumns.fullName && (
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('fullName')}
                      >
                        Name {getSortIcon('fullName')}
                      </th>
                    )}
                    {visibleColumns.cnic && (
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('cnic')}
                      >
                        CNIC {getSortIcon('cnic')}
                      </th>
                    )}
                    {visibleColumns.phoneNumber && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                    )}
                    {visibleColumns.city && (
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('city')}
                      >
                        City {getSortIcon('city')}
                      </th>
                    )}
                    {visibleColumns.province && (
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('province')}
                      >
                        Province {getSortIcon('province')}
                      </th>
                    )}
                    {visibleColumns.trainingCenter && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Training Center
                      </th>
                    )}
                    {visibleColumns.companyName && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                    )}
                    {visibleColumns.certified && (
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('certified')}
                      >
                        Certified {getSortIcon('certified')}
                      </th>
                    )}
                    {visibleColumns.bankName && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bank
                      </th>
                    )}
                    {visibleColumns.accountNumber && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedInstallers.map((installer: any) => (
                    <tr key={installer._id} className="hover:bg-gray-50">
                      {visibleColumns.installerCode && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => router.push(`/installers/${installer._id}`)}
                            className="text-indigo-600 hover:text-indigo-900 hover:underline font-mono"
                          >
                            {installer.installerCode}
                          </button>
                        </td>
                      )}
                      {visibleColumns.fullName && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {installer.fullName}
                        </td>
                      )}
                      {visibleColumns.cnic && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {installer.cnic}
                        </td>
                      )}
                      {visibleColumns.phoneNumber && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {installer.phoneNumber}
                        </td>
                      )}
                      {visibleColumns.city && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {installer.city}
                        </td>
                      )}
                      {visibleColumns.province && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {installer.province}
                        </td>
                      )}
                      {visibleColumns.trainingCenter && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {installer.trainingCenter}
                        </td>
                      )}
                      {visibleColumns.companyName && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {installer.companyName}
                        </td>
                      )}
                      {visibleColumns.certified && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {installer.certified ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Yes
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              No
                            </span>
                          )}
                        </td>
                      )}
                      {visibleColumns.bankName && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {installer.bankName}
                        </td>
                      )}
                      {visibleColumns.accountNumber && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {installer.accountNumber}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => router.push(`/installers/${installer._id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInstallerId(installer._id);
                              setEditModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
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

      {/* Edit Modal */}
      <InstallerEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        installerId={selectedInstallerId}
        onSuccess={fetchInstallers}
      />
    </div>
  );
}
