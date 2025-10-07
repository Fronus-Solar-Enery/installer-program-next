'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import InstallerEditModal from '@/components/InstallerEditModal';
import { Edit, Eye, ArrowUpDown, ArrowUp, ArrowDown, Settings2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PageHeader from '@/components/PageHeader';

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
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Installers"
        description="Manage installer registrations and information"
        action={
          <div className="flex gap-3">
            {googleAuthStatus && !googleAuthStatus.isAuthenticated ? (
              <Button
                onClick={handleAuthenticateGoogle}
                disabled={authLoading}
                variant="default"
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <svg
                  className="w-5 h-5 mr-2"
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
                {authLoading ? 'Authenticating...' : 'Authenticate Google Contacts'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => router.push('/installers/bulk-upload')}
                  variant="secondary"
                >
                  Bulk Upload
                </Button>
                <Button
                  onClick={() => router.push('/installers/new')}
                >
                  + Register New Installer
                </Button>
              </>
            )}
          </div>
        }
      />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex gap-3">
              <Input
                type="text"
                placeholder="Search by name, code, or CNIC..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <DropdownMenu open={showColumnMenu} onOpenChange={setShowColumnMenu}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Show/Hide Columns</DropdownMenuLabel>
                  {Object.entries(visibleColumns).map(([key, value]) => (
                    <DropdownMenuCheckboxItem
                      key={key}
                      checked={value}
                      onCheckedChange={() => toggleColumn(key)}
                    >
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">Loading installers...</div>
              </div>
            ) : sortedInstallers.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">No installers found</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleColumns.installerCode && (
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('installerCode')}
                      >
                        Installer Code {getSortIcon('installerCode')}
                      </TableHead>
                    )}
                    {visibleColumns.fullName && (
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('fullName')}
                      >
                        Name {getSortIcon('fullName')}
                      </TableHead>
                    )}
                    {visibleColumns.cnic && (
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('cnic')}
                      >
                        CNIC {getSortIcon('cnic')}
                      </TableHead>
                    )}
                    {visibleColumns.phoneNumber && (
                      <TableHead>Phone</TableHead>
                    )}
                    {visibleColumns.city && (
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('city')}
                      >
                        City {getSortIcon('city')}
                      </TableHead>
                    )}
                    {visibleColumns.province && (
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('province')}
                      >
                        Province {getSortIcon('province')}
                      </TableHead>
                    )}
                    {visibleColumns.trainingCenter && (
                      <TableHead>Training Center</TableHead>
                    )}
                    {visibleColumns.companyName && (
                      <TableHead>Company</TableHead>
                    )}
                    {visibleColumns.certified && (
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('certified')}
                      >
                        Certified {getSortIcon('certified')}
                      </TableHead>
                    )}
                    {visibleColumns.bankName && (
                      <TableHead>Bank</TableHead>
                    )}
                    {visibleColumns.accountNumber && (
                      <TableHead>Account</TableHead>
                    )}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInstallers.map((installer: any) => (
                    <TableRow key={installer._id}>
                      {visibleColumns.installerCode && (
                        <TableCell className="font-medium">
                          <Button
                            variant="link"
                            onClick={() => router.push(`/installers/${installer._id}`)}
                            className="font-mono p-0 h-auto"
                          >
                            {installer.installerCode}
                          </Button>
                        </TableCell>
                      )}
                      {visibleColumns.fullName && (
                        <TableCell>
                          {installer.fullName}
                        </TableCell>
                      )}
                      {visibleColumns.cnic && (
                        <TableCell className="text-muted-foreground">
                          {installer.cnic}
                        </TableCell>
                      )}
                      {visibleColumns.phoneNumber && (
                        <TableCell className="text-muted-foreground">
                          {installer.phoneNumber}
                        </TableCell>
                      )}
                      {visibleColumns.city && (
                        <TableCell className="text-muted-foreground">
                          {installer.city}
                        </TableCell>
                      )}
                      {visibleColumns.province && (
                        <TableCell className="text-muted-foreground">
                          {installer.province}
                        </TableCell>
                      )}
                      {visibleColumns.trainingCenter && (
                        <TableCell className="text-muted-foreground">
                          {installer.trainingCenter}
                        </TableCell>
                      )}
                      {visibleColumns.companyName && (
                        <TableCell className="text-muted-foreground">
                          {installer.companyName}
                        </TableCell>
                      )}
                      {visibleColumns.certified && (
                        <TableCell>
                          <Badge variant={installer.certified ? "default" : "secondary"}>
                            {installer.certified ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.bankName && (
                        <TableCell className="text-muted-foreground">
                          {installer.bankName}
                        </TableCell>
                      )}
                      {visibleColumns.accountNumber && (
                        <TableCell className="text-muted-foreground">
                          {installer.accountNumber}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/installers/${installer._id}`)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedInstallerId(installer._id);
                              setEditModalOpen(true);
                            }}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
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
