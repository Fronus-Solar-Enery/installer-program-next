"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import InstallerEditModal from "@/components/InstallerEditModal";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  CheckCircle,
  XCircle,
  MapPin,
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  MotionCard,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { TeamRole } from "@/types/roles";
import PageHeader from "@/components/PageHeader";
import { IInstaller } from "@/models/Installer";
import Dropdown, {
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import IconLayer from "@/components/icons/Layer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useRelativeTime } from "@/lib/getRelativeTime";
import { TableSkeleton } from "@/components/TableSkeleton";
import {
  IconActivity,
  IconAdd,
  IconClockCircle,
  IconEdit2,
  IconEye,
  IconRefresh2,
  IconSquareShareLine,
  IconUserCog,
} from "@/components/icons";
import IconTrashBin2 from "@/components/icons/TrashBin2";
import { EmptyState } from "@/components/EmptyState";
import Loading from "@/components/ui/loading";
import IconSetting4 from "@/components/icons/Setting4";
import { motion, AnimatePresence } from "framer-motion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";

interface InstallerWithId extends IInstaller {
  _id: string;
}

export default function InstallersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [installers, setInstallers] = useState<InstallerWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [googleAuthStatus, setGoogleAuthStatus] = useState<{
    isAuthenticated: boolean;
    hasRefreshToken: boolean;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Bulk selection state
  const [selectedInstallers, setSelectedInstallers] = useState<Set<string>>(
    new Set()
  );
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedInstallerId, setSelectedInstallerId] = useState("");

  // Sorting state
  const [sortField, setSortField] =
    useState<keyof InstallerWithId>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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

  // Filter state
  const [filters, setFilters] = useState({
    city: "",
    province: "",
    trainingCenter: "",
    certified: "",
    bankName: "",
    dateRange: "all" as "all" | "today" | "week" | "month" | "year" | "custom",
    customStartDate: "",
    customEndDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [downloadingReport, setDownloadingReport] = useState(false);

  useEffect(() => {
    fetchInstallers();
    checkGoogleAuthStatus();

    // Check for auth callback success
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth_success")) {
      checkGoogleAuthStatus(); // Refresh status
      window.history.replaceState({}, "", "/installers");
    }

    // Check for search result ID from navbar
    const searchId = params.get("id");
    if (searchId) {
      setSelectedInstallerId(searchId);
      // Scroll to the row after a short delay
      setTimeout(() => {
        const element = document.getElementById(`installer-${searchId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("bg-primary/10");
          setTimeout(() => element.classList.remove("bg-primary/10"), 2000);
        }
      }, 500);
    }
  }, []);

  const checkGoogleAuthStatus = async () => {
    try {
      const response = await fetch("/api/google-auth/status");
      const data = await response.json();
      setGoogleAuthStatus(data);
    } catch (err) {
      console.error("Failed to check Google auth status:", err);
    }
  };

  const handleAuthenticateGoogle = async () => {
    setAuthLoading(true);
    try {
      const response = await fetch("/api/google-auth/initiate");
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err: unknown) {
      console.error("Failed to authenticate:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchInstallers = async () => {
    try {
      setLoading(true);
      // Fetch all installers without pagination - frontend handles pagination
      const response = await fetch("/api/installers?limit=10000");
      const data = await response.json();

      if (data.success) {
        setInstallers(data.data.installers);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch installers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (installerId: string, installerName: string) => {
    setDeletingId(installerId);
    try {
      const response = await fetch(`/api/installers/${installerId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Installer "${installerName}" deleted successfully!`);
        // Remove from local state
        setInstallers((prev) => prev.filter((i) => i._id !== installerId));
        // Remove from selection if selected
        setSelectedInstallers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(installerId);
          return newSet;
        });
      } else {
        toast.error(data.error || "Failed to delete installer");
      }
    } catch (error) {
      console.error("Failed to delete installer:", error);
      toast.error("An error occurred while deleting the installer");
    } finally {
      setDeletingId(null);
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedInstallers.size === 0) return;

    setBulkDeleting(true);
    const toastId = toast.loading(
      `Deleting ${selectedInstallers.size} installer(s)...`
    );

    try {
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      // Delete installers one by one
      for (const installerId of selectedInstallers) {
        try {
          const response = await fetch(`/api/installers/${installerId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            successCount++;
            // Remove from local state
            setInstallers((prev) => prev.filter((i) => i._id !== installerId));
          } else {
            failCount++;
            const data = await response.json();
            errors.push(data.error || "Unknown error");
          }
        } catch (error) {
          failCount++;
          errors.push("Network error");
        }
      }

      // Clear selection
      setSelectedInstallers(new Set());

      // Show results
      toast.dismiss(toastId);
      if (successCount > 0 && failCount === 0) {
        toast.success(`Successfully deleted ${successCount} installer(s)!`);
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(
          `Deleted ${successCount} installer(s), ${failCount} failed`
        );
      } else {
        toast.error(`Failed to delete installers: ${errors[0]}`);
      }
    } catch (error) {
      toast.dismiss(toastId);
      console.error("Bulk delete error:", error);
      toast.error("An error occurred during bulk delete");
    } finally {
      setBulkDeleting(false);
    }
  };

  // Toggle individual selection
  const toggleSelection = (installerId: string) => {
    setSelectedInstallers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(installerId)) {
        newSet.delete(installerId);
      } else {
        newSet.add(installerId);
      }
      return newSet;
    });
  };

  // Toggle all on current page
  const toggleSelectAll = () => {
    const currentPageIds = paginatedInstallers.map((i) => i._id);

    // If all on current page are selected, deselect all
    const allSelected = currentPageIds.every((id) =>
      selectedInstallers.has(id)
    );

    if (allSelected) {
      setSelectedInstallers((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.delete(id));
        return newSet;
      });
    } else {
      // Select all on current page
      setSelectedInstallers((prev) => {
        const newSet = new Set(prev);
        currentPageIds.forEach((id) => newSet.add(id));
        return newSet;
      });
    }
  };

  // Download filtered report
  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    try {
      toast.loading("Generating report...");

      const queryParams = new URLSearchParams({
        city: filters.city || "",
        province: filters.province || "",
        trainingCenter: filters.trainingCenter || "",
        certified: filters.certified || "",
        bankName: filters.bankName || "",
        dateRange: filters.dateRange !== "all" ? filters.dateRange : "",
        customStartDate: filters.customStartDate || "",
        customEndDate: filters.customEndDate || "",
        format: "excel",
      });

      const response = await fetch(`/api/reports/installers?${queryParams}`);

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `installers_report_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.dismiss();
      toast.success("Report downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.dismiss();
      toast.error("Failed to download report");
    } finally {
      setTimeout(() => setDownloadingReport(false), 500);
    }
  };

  const handleSort = (field: keyof InstallerWithId) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleColumn = (column: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column as keyof typeof prev],
    }));
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1 inline" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1 inline" />
    );
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
    if (filters.dateRange !== "all") {
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (filters.dateRange === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59
        );
      } else if (filters.dateRange === "week") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (filters.dateRange === "month") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (filters.dateRange === "year") {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      } else if (
        filters.dateRange === "custom" &&
        filters.customStartDate &&
        filters.customEndDate
      ) {
        startDate = new Date(filters.customStartDate);
        endDate = new Date(filters.customEndDate);
        endDate.setHours(23, 59, 59, 999);
      }

      if (startDate) {
        result = result.filter((i) => {
          const createdAt = new Date(i.createdAt || "");
          return createdAt >= startDate! && (!endDate || createdAt <= endDate);
        });
      }
    }

    // Apply filters
    if (filters.city) {
      result = result.filter((i) => i.city === filters.city);
    }
    if (filters.province) {
      result = result.filter((i) => i.province === filters.province);
    }
    if (filters.trainingCenter) {
      result = result.filter(
        (i) => i.trainingCenter === filters.trainingCenter
      );
    }
    if (filters.certified !== "") {
      const isCertified = filters.certified === "true";
      result = result.filter((i) => i.certified === isCertified);
    }
    if (filters.bankName) {
      result = result.filter((i) => i.bankName === filters.bankName);
    }

    return result;
  }, [installers, search, filters]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = installers.length;
    const certified = installers.filter((i) => i.certified).length;
    const notCertified = total - certified;
    const cities = new Set(installers.map((i) => i.city).filter(Boolean)).size;
    const provinces = new Set(installers.map((i) => i.province).filter(Boolean))
      .size;
    const trainingCenters = new Set(
      installers.map((i) => i.trainingCenter).filter(Boolean)
    ).size;

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
    const cities = [
      ...new Set(installers.map((i) => i.city).filter(Boolean)),
    ].sort();
    const provinces = [
      ...new Set(installers.map((i) => i.province).filter(Boolean)),
    ].sort();
    const trainingCenters = [
      ...new Set(installers.map((i) => i.trainingCenter).filter(Boolean)),
    ].sort();
    const banks = [
      ...new Set(installers.map((i) => i.bankName).filter(Boolean)),
    ].sort();

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

  const sortedInstallers = useMemo(
    () =>
      [...filteredInstallers].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (typeof aVal === "boolean" && typeof bVal === "boolean") {
          return sortDirection === "asc"
            ? aVal === bVal
              ? 0
              : aVal
              ? 1
              : -1
            : aVal === bVal
            ? 0
            : bVal
            ? 1
            : -1;
        }

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }

        // For dates and other types, convert to string for comparison
        return sortDirection === "asc"
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      }),
    [filteredInstallers, sortField, sortDirection]
  );
  const activeColumnsLength =
    Object.values(visibleColumns).filter(Boolean).length;
  // Get paginated data
  const paginatedInstallers = sortedInstallers.slice(startIndex, endIndex);

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const refreshRelTime = useRelativeTime(lastUpdated);

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Installers"
        Icon={IconUserCog}
        description={
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage installers, view details, and add new entries
            </p>
          </>
        }
        action={
          <>
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
                {authLoading
                  ? "Authenticating..."
                  : "Authenticate Google Contacts"}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={fetchInstallers}
                  disabled={loading}
                  title="Refresh data"
                  className="gap-2"
                  // size={"icon"}
                >
                  Refresh
                  <IconRefresh2
                    duotone={false}
                    width={2}
                    className={cn("h-3.5 w-3.5", loading && "animate-spin")}
                  />
                </Button>

                <Button
                  onClick={() => router.push("/installers/bulk-register")}
                  variant="outline"
                  disabled={loading}
                  title="Bulk Register"
                  className="gap-2"
                >
                  Bulk Register
                  <IconLayer
                    duotone={false}
                    width={2}
                    className={cn("h-3.5 w-3.5")}
                  />
                </Button>
                <Button
                  onClick={() => router.push("/installers/new")}
                  disabled={loading}
                  title="Register New Installer"
                  className="gap-2"
                >
                  <IconAdd
                    duotone={false}
                    width={2}
                    className={cn("h-3.5 w-3.5")}
                  />
                  Register New Installer
                </Button>
              </>
            )}
          </>
        }
      />
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Installers
                </CardTitle>
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
                  {statistics.total > 0
                    ? Math.round(
                        (statistics.certified / statistics.total) * 100
                      )
                    : 0}
                  % of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Not Certified
                </CardTitle>
                <XCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.notCertified}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {statistics.total > 0
                    ? Math.round(
                        (statistics.notCertified / statistics.total) * 100
                      )
                    : 0}
                  % of total
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
                  {statistics.provinces} provinces, {statistics.trainingCenters}{" "}
                  training centers
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="!flex-row items-center justify-between w-full bg-muted">
              <CardTitle className="text-lg font-semibold">
                Installers Database
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadReport}
                  disabled={
                    filteredInstallers.length === 0 ||
                    downloadingReport ||
                    loading
                  }
                  className="gap-2"
                >
                  {downloadingReport ? (
                    <>
                      Downloading <Loading className="size-4" />
                    </>
                  ) : loading ? (
                    <>
                      Generating <Loading className="size-4" />
                    </>
                  ) : (
                    <>
                      Export
                      <IconSquareShareLine
                        duotone={false}
                        width={2}
                        className="h-4 w-4"
                      />
                    </>
                  )}
                </Button>
                <Dropdown>
                  <DropdownTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      Columns
                      <IconLayer
                        duotone={false}
                        width={2}
                        className="h-4 w-4"
                      />
                    </Button>
                  </DropdownTrigger>
                  <DropdownContent className="w-54 p-2 pr-0.5">
                    <div className="px-2 pb-2 text-sm text-muted-foreground">
                      Columns Visibility
                    </div>
                    <ScrollArea className="h-72 pr-2 rounded-xl">
                      <div className="space-y-1 w-[98%]">
                        {Object.entries(visibleColumns).map(([key, value]) => (
                          <label
                            key={key}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent transition-colors whitespace-nowrap",
                              value && "bg-accent"
                            )}
                          >
                            <Checkbox
                              checked={value}
                              onCheckedChange={() => toggleColumn(key)}
                              aria-label={`Toggle ${key
                                .replace(/([A-Z])/g, " $1")
                                .trim()} column`}
                            />
                            <span className="capitalize text-sm">
                              {key.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                          </label>
                        ))}
                      </div>
                    </ScrollArea>
                  </DropdownContent>
                </Dropdown>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-between gap-2">
                <Input
                  type="text"
                  placeholder="Search by name, code, CNIC, phone, WhatsApp, account, company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
                <Button
                  className="gap-2 rounded-full"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters <IconSetting4 className="size-4" duotone={false} />
                </Button>
              </div>
              {showFilters && (
                <AnimatePresence>
                  <MotionCard
                    key="filters"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="mb-4 !p-4 bg-muted/30"
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center gap-2">
                        <IconSetting4 className="size-4" duotone={false} />
                        Filters
                      </div>
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
                              onValueChange={(value) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  dateRange: value as typeof prev.dateRange,
                                  customStartDate:
                                    value !== "custom"
                                      ? ""
                                      : prev.customStartDate,
                                  customEndDate:
                                    value !== "custom"
                                      ? ""
                                      : prev.customEndDate,
                                }))
                              }
                            >
                              <div className="flex items-center gap-3">
                                <ToggleGroup
                                  type="single"
                                  defaultValue={filters.dateRange}
                                  onValueChange={(value) =>
                                    setFilters((prev) => ({
                                      ...prev,
                                      dateRange: value as typeof prev.dateRange,
                                      customStartDate:
                                        value !== "custom"
                                          ? ""
                                          : prev.customStartDate,
                                      customEndDate:
                                        value !== "custom"
                                          ? ""
                                          : prev.customEndDate,
                                    }))
                                  }
                                >
                                  <ToggleGroupItem value="all">
                                    ALL
                                  </ToggleGroupItem>
                                  <ToggleGroupItem value="today">
                                    1D
                                  </ToggleGroupItem>
                                  <ToggleGroupItem value="week">
                                    1W
                                  </ToggleGroupItem>
                                  <ToggleGroupItem value="month">
                                    1M
                                  </ToggleGroupItem>
                                  <ToggleGroupItem value="year">
                                    1Y
                                  </ToggleGroupItem>

                                  <Popover
                                  // open={isCustomDateOpen}
                                  // onOpenChange={setIsCustomDateOpen}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={cn(
                                          "hidden sm:flex gap-2 rounded-xl text-zinc-400 px-2"
                                        )}
                                      >
                                        <IconClockCircle
                                          className="h-5 w-5"
                                          duotone={false}
                                        />
                                      </Button>
                                    </PopoverTrigger>

                                    <PopoverContent
                                      className="w-80"
                                      align="end"
                                    >
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <h4 className="font-medium text-sm">
                                            Custom Date Range
                                          </h4>
                                          <p className="text-xs text-muted-foreground">
                                            Select a custom date range for
                                            filtering dashboard data
                                          </p>
                                        </div>
                                        <div className="space-y-3">
                                          <div className="space-y-1.5">
                                            <Label
                                              htmlFor="start-date"
                                              className="text-xs"
                                            >
                                              Start Date
                                            </Label>
                                            <Input
                                              id="start-date"
                                              type="date"
                                              // value={customStartDate}
                                              // onChange={(e) =>
                                              //   setCustomStartDate(
                                              //     e.target.value
                                              //   )
                                              // }
                                              // max={customEndDate || undefined}
                                            />
                                          </div>
                                          <div className="space-y-1.5">
                                            <Label
                                              htmlFor="end-date"
                                              className="text-xs"
                                            >
                                              End Date
                                            </Label>
                                            <Input
                                              id="end-date"
                                              type="date"
                                              // value={customEndDate}
                                              // onChange={(e) =>
                                              //   setCustomEndDate(e.target.value)
                                              // }
                                              // min={customStartDate || undefined}
                                              // max={
                                              //   new Date()
                                              //     .toISOString()
                                              //     .split("T")[0]
                                              // }
                                            />
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            className="flex-1"
                                            // onClick={() => {
                                            //   if (
                                            //     customStartDate &&
                                            //     customEndDate
                                            //   ) {
                                            //     setTimePeriod("custom");
                                            //     setIsCustomDateOpen(false);
                                            //   }
                                            // }}
                                            // disabled={
                                            //   !customStartDate || !customEndDate
                                            // }
                                          >
                                            Apply
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                              // setCustomStartDate("");
                                              // setCustomEndDate("");
                                              // setTimePeriod("last30days");
                                              // setIsCustomDateOpen(false);
                                            }}
                                          >
                                            Clear
                                          </Button>
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </ToggleGroup>
                              </div>
                            </Select>
                          </div>

                          {filters.dateRange === "custom" && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                Custom Date Range
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <Label
                                    htmlFor="custom-start-date"
                                    className="text-xs"
                                  >
                                    From
                                  </Label>
                                  <Input
                                    id="custom-start-date"
                                    type="date"
                                    value={filters.customStartDate}
                                    onChange={(e) =>
                                      setFilters((prev) => ({
                                        ...prev,
                                        customStartDate: e.target.value,
                                      }))
                                    }
                                    max={
                                      filters.customEndDate ||
                                      new Date().toISOString().split("T")[0]
                                    }
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label
                                    htmlFor="custom-end-date"
                                    className="text-xs"
                                  >
                                    To
                                  </Label>
                                  <Input
                                    id="custom-end-date"
                                    type="date"
                                    value={filters.customEndDate}
                                    onChange={(e) =>
                                      setFilters((prev) => ({
                                        ...prev,
                                        customEndDate: e.target.value,
                                      }))
                                    }
                                    min={filters.customStartDate}
                                    max={new Date().toISOString().split("T")[0]}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Other Filters */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">City</label>
                            <Select
                              value={filters.city || "all"}
                              onValueChange={(value) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  city: value === "all" ? "" : value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All cities" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All cities</SelectItem>
                                {uniqueValues.cities.map((city) => (
                                  <SelectItem key={city} value={city}>
                                    {city}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Province
                            </label>
                            <Select
                              value={filters.province || "all"}
                              onValueChange={(value) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  province: value === "all" ? "" : value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All provinces" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  All provinces
                                </SelectItem>
                                {uniqueValues.provinces.map((province) => (
                                  <SelectItem key={province} value={province}>
                                    {province}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Training Center
                            </label>
                            <Select
                              value={filters.trainingCenter || "all"}
                              onValueChange={(value) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  trainingCenter: value === "all" ? "" : value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All centers" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All centers</SelectItem>
                                {uniqueValues.trainingCenters.map((center) => (
                                  <SelectItem key={center} value={center}>
                                    {center}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">
                              Certification
                            </label>
                            <Select
                              value={filters.certified || "all"}
                              onValueChange={(value) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  certified: value === "all" ? "" : value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All statuses" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">
                                  All statuses
                                </SelectItem>
                                <SelectItem value="true">Certified</SelectItem>
                                <SelectItem value="false">
                                  Not Certified
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Bank</label>
                            <Select
                              value={filters.bankName || "all"}
                              onValueChange={(value) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  bankName: value === "all" ? "" : value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="All banks" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All banks</SelectItem>
                                {uniqueValues.banks.map((bank) => (
                                  <SelectItem key={bank} value={bank}>
                                    {bank}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {(filters.city ||
                        filters.province ||
                        filters.trainingCenter ||
                        filters.certified ||
                        filters.bankName ||
                        filters.dateRange !== "all") && (
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {filters.dateRange !== "all" && (
                              <Badge variant="secondary" className="gap-1">
                                {filters.dateRange === "today" && "Today"}
                                {filters.dateRange === "week" && "Last 7 days"}
                                {filters.dateRange === "month" &&
                                  "Last 30 days"}
                                {filters.dateRange === "year" && "Last year"}
                                {filters.dateRange === "custom" &&
                                  `${filters.customStartDate} to ${filters.customEndDate}`}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() =>
                                    setFilters((prev) => ({
                                      ...prev,
                                      dateRange: "all",
                                      customStartDate: "",
                                      customEndDate: "",
                                    }))
                                  }
                                />
                              </Badge>
                            )}
                            {filters.city && (
                              <Badge variant="secondary" className="gap-1">
                                City: {filters.city}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() =>
                                    setFilters((prev) => ({
                                      ...prev,
                                      city: "",
                                    }))
                                  }
                                />
                              </Badge>
                            )}
                            {filters.province && (
                              <Badge variant="secondary" className="gap-1">
                                Province: {filters.province}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() =>
                                    setFilters((prev) => ({
                                      ...prev,
                                      province: "",
                                    }))
                                  }
                                />
                              </Badge>
                            )}
                            {filters.trainingCenter && (
                              <Badge variant="secondary" className="gap-1">
                                Center: {filters.trainingCenter}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() =>
                                    setFilters((prev) => ({
                                      ...prev,
                                      trainingCenter: "",
                                    }))
                                  }
                                />
                              </Badge>
                            )}
                            {filters.certified && (
                              <Badge variant="secondary" className="gap-1">
                                {filters.certified === "true"
                                  ? "Certified"
                                  : "Not Certified"}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() =>
                                    setFilters((prev) => ({
                                      ...prev,
                                      certified: "",
                                    }))
                                  }
                                />
                              </Badge>
                            )}
                            {filters.bankName && (
                              <Badge variant="secondary" className="gap-1">
                                Bank: {filters.bankName}
                                <X
                                  className="h-3 w-3 cursor-pointer"
                                  onClick={() =>
                                    setFilters((prev) => ({
                                      ...prev,
                                      bankName: "",
                                    }))
                                  }
                                />
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setFilters({
                                city: "",
                                province: "",
                                trainingCenter: "",
                                certified: "",
                                bankName: "",
                                dateRange: "all",
                                customStartDate: "",
                                customEndDate: "",
                              })
                            }
                          >
                            Clear All
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </MotionCard>
                </AnimatePresence>
              )}

              <div className="border border-border rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow className="hover:bg-muted/50 ">
                      <TableHead className="text-center w-12">
                        <Checkbox
                          checked={
                            paginatedInstallers.length > 0 &&
                            paginatedInstallers.every((i) =>
                              selectedInstallers.has(i._id)
                            )
                          }
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all installers on this page"
                        />
                      </TableHead>
                      {visibleColumns.installerCode && (
                        <TableHead
                          className="cursor-pointer font-semibold"
                          onClick={() => handleSort("installerCode")}
                        >
                          Installer Code {getSortIcon("installerCode")}
                        </TableHead>
                      )}
                      {visibleColumns.fullName && (
                        <TableHead
                          className="cursor-pointer font-semibold"
                          onClick={() => handleSort("fullName")}
                        >
                          Name {getSortIcon("fullName")}
                        </TableHead>
                      )}
                      {visibleColumns.cnic && (
                        <TableHead
                          className="cursor-pointer font-semibold"
                          onClick={() => handleSort("cnic")}
                        >
                          CNIC {getSortIcon("cnic")}
                        </TableHead>
                      )}
                      {visibleColumns.phoneNumber && (
                        <TableHead className="font-semibold">Phone</TableHead>
                      )}
                      {visibleColumns.city && (
                        <TableHead
                          className="cursor-pointer font-semibold"
                          onClick={() => handleSort("city")}
                        >
                          City {getSortIcon("city")}
                        </TableHead>
                      )}
                      {visibleColumns.province && (
                        <TableHead
                          className="cursor-pointer font-semibold"
                          onClick={() => handleSort("province")}
                        >
                          Province {getSortIcon("province")}
                        </TableHead>
                      )}
                      {visibleColumns.trainingCenter && (
                        <TableHead className="font-semibold">
                          Training Center
                        </TableHead>
                      )}
                      {visibleColumns.companyName && (
                        <TableHead className="font-semibold">Company</TableHead>
                      )}
                      {visibleColumns.certified && (
                        <TableHead
                          className="cursor-pointer font-semibold"
                          onClick={() => handleSort("certified")}
                        >
                          Certified {getSortIcon("certified")}
                        </TableHead>
                      )}
                      {visibleColumns.bankName && (
                        <TableHead className="font-semibold">Bank</TableHead>
                      )}
                      {visibleColumns.accountNumber && (
                        <TableHead className="font-semibold">Account</TableHead>
                      )}
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <>
                        <TableSkeleton
                          rows={rowsPerPage}
                          actionIcons={[IconEye, IconEdit2, IconTrashBin2]}
                          excludeLastColumn={true}
                        />
                      </>
                    ) : filteredInstallers.length === 0 ? (
                      <TableRow className="p-4">
                        <TableCell
                          colSpan={activeColumnsLength + 2}
                          className="w-full place-items-center p-0"
                        >
                          <EmptyState
                            title="No Forms Created"
                            description="You can create a new template to add in your pages."
                            icons={[IconActivity]}
                            className="w-full border-none rounded-none bg-card"
                            action={{
                              label: (
                                <div className="flex items-center gap-2">
                                  Register Installer
                                  <IconAdd className="size-4" duotone={false} />
                                </div>
                              ),
                              onClick: () => router.push("/installers/new"),
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedInstallers.map((installer: InstallerWithId) => (
                        <TableRow
                          key={installer._id}
                          id={`installer-${installer._id}`}
                          className="transition-colors"
                        >
                          <TableCell className="text-center w-12">
                            <Checkbox
                              checked={selectedInstallers.has(installer._id)}
                              onCheckedChange={() =>
                                toggleSelection(installer._id)
                              }
                              aria-label={`Select ${installer.fullName}`}
                            />
                          </TableCell>
                          {visibleColumns.installerCode && (
                            <TableCell className="font-medium">
                              <Button
                                variant="link"
                                onClick={() =>
                                  router.push(`/installers/${installer._id}`)
                                }
                                className="font-mono p-0 h-auto"
                              >
                                {installer.installerCode}
                              </Button>
                            </TableCell>
                          )}
                          {visibleColumns.fullName && (
                            <TableCell>{installer.fullName}</TableCell>
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
                              <Badge
                                variant={
                                  installer.certified ? "default" : "secondary"
                                }
                              >
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
                                onClick={() =>
                                  router.push(`/installers/${installer._id}`)
                                }
                                title="View Details"
                              >
                                <IconEye duotone={false} className="h-4 w-4" />
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
                                <IconEdit2
                                  duotone={false}
                                  className="h-4 w-4"
                                />
                              </Button>
                              {isAdmin && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Delete"
                                      disabled={deletingId === installer._id}
                                      className="group"
                                    >
                                      <IconTrashBin2
                                        duotone={false}
                                        className="h-4.5 w-4.5 text-destructive-text group-hover:text-destructive-text-hover transition-colors duration-300"
                                      />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Installer?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete{" "}
                                        <strong>{installer.fullName}</strong> (
                                        {installer.installerCode})? This action
                                        cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDelete(
                                            installer._id,
                                            installer.fullName
                                          )
                                        }
                                        disabled={deletingId === installer._id}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        {deletingId === installer._id
                                          ? "Deleting..."
                                          : "Delete"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>

                  {/* Table Footer */}
                  <TableFooter>
                    <TableRow>
                      <TableCell
                        colSpan={activeColumnsLength + 2}
                        className="py-4"
                      >
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          {/* <div /> */}
                          <div className="flex items-center gap-2">
                            <span>Last Updated:</span>
                            <span className="capitalize">
                              {loading ? (
                                <Loading className="size-4" />
                              ) : (
                                refreshRelTime
                              )}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
              {/* Pagination Controls */}
              <div className="flex items-center justify-between px-2 pt-4 relative">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
                    Showing {startIndex + 1} to{" "}
                    <Select
                      value={rowsPerPage.toString()}
                      onValueChange={(value) => {
                        setRowsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-max gap-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    of {filteredInstallers.length} results
                    {filteredInstallers.length !== installers.length && (
                      <span className="ml-1">
                        (filtered from {installers.length} total)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm px-3">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-max h-full flex items-center justify-center">
                  {selectedInstallers.size > 0 && (
                    <AnimatePresence>
                      <motion.div
                        initial={{
                          opacity: 0,
                          y: 5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        exit={{ opacity: 0, y: 5 }}
                        className={cn(
                          "border border-border rounded-2xl p-2 flex items-center gap-2 relative"
                        )}
                      >
                        <div className="px-4 py-3 bg-background rounded-xl flex items-center justify-center leading-none select-none">
                          Selected: {selectedInstallers.size}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size={"icon"}
                              disabled={bulkDeleting}
                              className="gap-1"
                            >
                              {bulkDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <IconTrashBin2
                                  width={2}
                                  duotone={false}
                                  className="h-4 w-4"
                                />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete {selectedInstallers.size} Installer(s)?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete the selected installers and
                                their Google Contacts.
                                <br />
                                <br />
                                <strong>Note:</strong> Installers with existing
                                rewards cannot be deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleBulkDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete {selectedInstallers.size} Installer(s)
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
              </div>
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
