'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

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

  const filteredInstallers = installers.filter((installer: any) =>
    installer.fullName.toLowerCase().includes(search.toLowerCase()) ||
    installer.installerCode.toLowerCase().includes(search.toLowerCase()) ||
    installer.cnic.includes(search)
  );

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
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name, code, or CNIC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading installers...</div>
            </div>
          ) : filteredInstallers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-600">No installers found</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Installer Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CNIC
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInstallers.map((installer: any) => (
                    <tr key={installer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {installer.installerCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {installer.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {installer.cnic}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {installer.phoneNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {installer.city}
                      </td>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => router.push(`/installers/${installer._id}`)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          View
                        </button>
                        <button
                          onClick={() => router.push(`/installers/${installer._id}/edit`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
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
