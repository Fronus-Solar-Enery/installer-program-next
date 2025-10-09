'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import InstallerEditModal from '@/components/InstallerEditModal';
import { Edit, Eye, ArrowUpDown, ArrowUp, ArrowDown, Settings2, Trash2, Users, CheckCircle, XCircle, MapPin, Building2, GraduationCap, Filter, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { TeamRole } from '@/types/roles';
import PageHeader from '@/components/PageHeader';
import { IInstaller } from '@/models/Installer';

interface InstallerWithId extends IInstaller {
  _id: string;
}

export default function InstallersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [installers, setInstallers] = useState<InstallerWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [googleAuthStatus, setGoogleAuthStatus] = useState<{
    isAuthenticated: boolean;
    hasRefreshToken: boolean;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedInstallerId, setSelectedInstallerId] = useState('');

  // Sorting state
  const [sortField, setSortField] = useState<keyof InstallerWithId>('createdAt');
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

  // Filter state
  const [filters, setFilters] = useState({
    city: '',
    province: '',
    trainingCenter: '',
    certified: '',
    bankName: '',
    dateRange: 'all' as 'all' | 'today' | 'week' | 'month' | 'year' | 'custom',
    customStartDate: '',
    customEndDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    fetchInstallers();
    checkGoogleAuthStatus();

    // Check for auth callback success
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth_success')) {
      checkGoogleAuthStatus(); // Refresh status
      window.history.replaceState({}, '', '/installers');
    }

    // Check for search result ID from navbar
    const searchId = params.get('id');
    if (searchId) {
      setSelectedInstallerId(searchId);
      // Scroll to the row after a short delay
      setTimeout(() => {
        const element = document.getElementById(`installer-${searchId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-primary/10');
          setTimeout(() => element.classList.remove('bg-primary/10'), 2000);
        }
      }, 500);
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
    } catch (err: unknown) {
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

  const handleDelete = async (installerId: string, installerName: string) => {
    setDeletingId(installerId);
    try {
      const response = await fetch(`/api/installers/${installerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Installer "${installerName}" deleted successfully!`);
        // Remove from local state
        setInstallers(prev => prev.filter(i => i._id !== installerId));
      } else {
        toast.error(data.error || 'Failed to delete installer');
      }
    } catch (error) {
      console.error('Failed to delete installer:', error);
      toast.error('An error occurred while deleting the installer');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSort = (field: keyof InstallerWithId) => {
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

  // Check if user is admin
  const isAdmin = session?.user?.role === TeamRole.ADMIN;

  const filteredInstallers = useMemo(() => {
    let result = installers;

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((installer) => {
        return (
          installer.fullName?.toLowerCase().includes(searchLower) ||
          installer.installerCode?.toLowerCase().includes(searchLower) ||
          installer.cnic?.includes(search) ||
          installer.phoneNumber?.includes(search) ||
          installer.whatsappNumber?.includes(search) ||
          installer.accountNumber?.includes(search) ||
          installer.accountTitle?.toLowerCase().includes(searchLower) ||
          installer.companyName?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (filters.dateRange === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      } else if (filters.dateRange === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (filters.dateRange === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (filters.dateRange === 'year') {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      } else if (filters.dateRange === 'custom' && filters.customStartDate && filters.customEndDate) {
        startDate = new Date(filters.customStartDate);
        endDate = new Date(filters.customEndDate);
        endDate.setHours(23, 59, 59, 999);
      }

      if (startDate) {
        result = result.filter(i => {
          const createdAt = new Date(i.createdAt || '');
          return createdAt >= startDate! && (!endDate || createdAt <= endDate);
        });
      }
    }

    // Apply filters
    if (filters.city) {
      result = result.filter(i => i.city === filters.city);
    }
    if (filters.province) {
      result = result.filter(i => i.province === filters.province);
    }
    if (filters.trainingCenter) {
      result = result.filter(i => i.trainingCenter === filters.trainingCenter);
    }
    if (filters.certified !== '') {
      const isCertified = filters.certified === 'true';
      result = result.filter(i => i.certified === isCertified);
    }
    if (filters.bankName) {
      result = result.filter(i => i.bankName === filters.bankName);
    }

    return result;
  }, [installers, search, filters]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = installers.length;
    const certified = installers.filter(i => i.certified).length;
    const notCertified = total - certified;
    const cities = new Set(installers.map(i => i.city).filter(Boolean)).size;
    const provinces = new Set(installers.map(i => i.province).filter(Boolean)).size;
    const trainingCenters = new Set(installers.map(i => i.trainingCenter).filter(Boolean)).size;

    return {
      total,
      certified,
      notCertified,
      cities,
      provinces,
      trainingCenters,
      filtered: filteredInstallers.length,
    };
  }, [installers, filteredInstallers]);

  // Get unique values for filters
  const uniqueValues = useMemo(() => {
    const cities = [...new Set(installers.map(i => i.city).filter(Boolean))].sort();
    const provinces = [...new Set(installers.map(i => i.province).filter(Boolean))].sort();
    const trainingCenters = [...new Set(installers.map(i => i.trainingCenter).filter(Boolean))].sort();
    const banks = [...new Set(installers.map(i => i.bankName).filter(Boolean))].sort();

    return { cities, provinces, trainingCenters, banks };
  }, [installers]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredInstallers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, search]);

  const sortedInstallers = useMemo(() => [...filteredInstallers].sort((a, b) => {
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

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // For dates and other types, convert to string for comparison
    return sortDirection === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  }), [filteredInstallers, sortField, sortDirection]);

  // Get paginated data
  const paginatedInstallers = sortedInstallers.slice(startIndex, endIndex);

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
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Installers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.total}</div>
                {statistics.total !== statistics.filtered && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {statistics.filtered} filtered
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Certified</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.certified}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {statistics.total > 0 ? Math.round((statistics.certified / statistics.total) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Not Certified</CardTitle>
                <XCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.notCertified}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {statistics.total > 0 ? Math.round((statistics.notCertified / statistics.total) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Locations</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.cities}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {statistics.provinces} provinces, {statistics.trainingCenters} training centers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? 'Hide' : 'Show'}
                </Button>
              </div>
            </CardHeader>
            {showFilters && (
              <CardContent>
                <div className="space-y-4">
                  {/* Date Range Filter */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Date Range
                      </label>
                      <Select
                        value={filters.dateRange}
                        onValueChange={(value) => setFilters(prev => ({
                          ...prev,
                          dateRange: value as typeof prev.dateRange,
                          customStartDate: value !== 'custom' ? '' : prev.customStartDate,
                          customEndDate: value !== 'custom' ? '' : prev.customEndDate,
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">Last 7 days</SelectItem>
                          <SelectItem value="month">Last 30 days</SelectItem>
                          <SelectItem value="year">Last year</SelectItem>
                          <SelectItem value="custom">Custom range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {filters.dateRange === 'custom' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Start Date</label>
                          <Input
                            type="date"
                            value={filters.customStartDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, customStartDate: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">End Date</label>
                          <Input
                            type="date"
                            value={filters.customEndDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, customEndDate: e.target.value }))}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Other Filters */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City</label>
                    <Select
                      value={filters.city || 'all'}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, city: value === 'all' ? '' : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All cities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All cities</SelectItem>
                        {uniqueValues.cities.map(city => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Province</label>
                    <Select
                      value={filters.province || 'all'}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, province: value === 'all' ? '' : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All provinces" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All provinces</SelectItem>
                        {uniqueValues.provinces.map(province => (
                          <SelectItem key={province} value={province}>{province}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Training Center</label>
                    <Select
                      value={filters.trainingCenter || 'all'}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, trainingCenter: value === 'all' ? '' : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All centers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All centers</SelectItem>
                        {uniqueValues.trainingCenters.map(center => (
                          <SelectItem key={center} value={center}>{center}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Certification</label>
                    <Select
                      value={filters.certified || 'all'}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, certified: value === 'all' ? '' : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="true">Certified</SelectItem>
                        <SelectItem value="false">Not Certified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bank</label>
                    <Select
                      value={filters.bankName || 'all'}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, bankName: value === 'all' ? '' : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All banks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All banks</SelectItem>
                        {uniqueValues.banks.map(bank => (
                          <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                </div>

                {(filters.city || filters.province || filters.trainingCenter || filters.certified || filters.bankName || filters.dateRange !== 'all') && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {filters.dateRange !== 'all' && (
                        <Badge variant="secondary" className="gap-1">
                          {filters.dateRange === 'today' && 'Today'}
                          {filters.dateRange === 'week' && 'Last 7 days'}
                          {filters.dateRange === 'month' && 'Last 30 days'}
                          {filters.dateRange === 'year' && 'Last year'}
                          {filters.dateRange === 'custom' && `${filters.customStartDate} to ${filters.customEndDate}`}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => setFilters(prev => ({ ...prev, dateRange: 'all', customStartDate: '', customEndDate: '' }))}
                          />
                        </Badge>
                      )}
                      {filters.city && (
                        <Badge variant="secondary" className="gap-1">
                          City: {filters.city}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => setFilters(prev => ({ ...prev, city: '' }))}
                          />
                        </Badge>
                      )}
                      {filters.province && (
                        <Badge variant="secondary" className="gap-1">
                          Province: {filters.province}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => setFilters(prev => ({ ...prev, province: '' }))}
                          />
                        </Badge>
                      )}
                      {filters.trainingCenter && (
                        <Badge variant="secondary" className="gap-1">
                          Center: {filters.trainingCenter}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => setFilters(prev => ({ ...prev, trainingCenter: '' }))}
                          />
                        </Badge>
                      )}
                      {filters.certified && (
                        <Badge variant="secondary" className="gap-1">
                          {filters.certified === 'true' ? 'Certified' : 'Not Certified'}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => setFilters(prev => ({ ...prev, certified: '' }))}
                          />
                        </Badge>
                      )}
                      {filters.bankName && (
                        <Badge variant="secondary" className="gap-1">
                          Bank: {filters.bankName}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => setFilters(prev => ({ ...prev, bankName: '' }))}
                          />
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilters({
                        city: '',
                        province: '',
                        trainingCenter: '',
                        certified: '',
                        bankName: '',
                        dateRange: 'all',
                        customStartDate: '',
                        customEndDate: '',
                      })}
                    >
                      Clear All
                    </Button>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex gap-3">
              <Input
                type="text"
                placeholder="Search by name, code, CNIC, phone, WhatsApp, account, company..."
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
              <>
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
                  {paginatedInstallers.map((installer: InstallerWithId) => (
                    <TableRow
                      key={installer._id}
                      id={`installer-${installer._id}`}
                      className="transition-colors"
                    >
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
                        <div className="flex items-center gap-2">
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
                          {isAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Delete"
                                  disabled={deletingId === installer._id}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Installer?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{installer.fullName}</strong> ({installer.installerCode})?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(installer._id, installer.fullName)}
                                    disabled={deletingId === installer._id}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {deletingId === installer._id ? 'Deleting...' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredInstallers.length)} of {filteredInstallers.length} results
                    {filteredInstallers.length !== installers.length && (
                      <span className="ml-1">(filtered from {installers.length} total)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Rows per page:</label>
                    <Select
                      value={rowsPerPage.toString()}
                      onValueChange={(value) => {
                        setRowsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="text-muted-foreground">...</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-8 h-8 p-0"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              </>
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
