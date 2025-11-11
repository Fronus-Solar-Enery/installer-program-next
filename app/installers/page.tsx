"use client";
import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  memo,
  Activity,
} from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LazyInstallerEditModal } from "@/components/installers/LazyModals";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { TeamRole } from "@/types/roles";
import PageHeader from "@/components/PageHeader";
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
  IconCheck,
  IconCity,
  IconClock,
  IconClockCircle,
  IconClose,
  IconEdit2,
  IconInstaller,
  IconInstallerCode,
  IconRefresh2,
  IconSearchNormal,
  IconSetting4,
  IconSortFromBottomToTop,
  IconSortFromTopToBottom,
  IconSquareArrowRightUp,
  IconSquareShareLine,
  IconTrainingCenter,
} from "@/components/icons";
import IconTrashBin2 from "@/components/icons/TrashBin2";
import { EmptyState } from "@/components/EmptyState";
import Loading from "@/components/ui/loading";
import { motion, AnimatePresence } from "framer-motion";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { BulkDeleteResultDialog } from "@/components/BulkDeleteResultDialog";
import { BulkDeleteConfirmationDialog } from "@/components/BulkDeleteConfirmationDialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CopyButton } from "@/components/CopyButton";
import Link from "next/link";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import IconDocumentFilter from "@/components/icons/DocumentFilter";
import { Label } from "@/components/ui/label";
import IconRestart from "@/components/icons/Restart";
import IconSortVertical from "@/components/icons/SortVertical";

// Optimization imports
import { useInstallers, type InstallerWithId } from "@/hooks/useInstallers";
import { useDebounce } from "@/hooks/useDebounce";
import { useOptimizedInstallerFilter } from "@/hooks/useOptimizedInstallerFilter";
import { StatisticsCards } from "@/components/installers/StatisticsCards";
import IconSort from "@/components/icons/Sort";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  SearchableSelect,
  SearchableSelectGroup,
} from "@/components/ui/searchable-select";
import { CITIES, CITY_TO_PROVINCE, PROVINCES } from "@/lib/constants";
import IconExcel from "@/components/icons/Excel";

// Memoized constants - defined outside component to prevent re-creation on each render
const SORT_FIELD_OPTIONS = [
  {
    label: "Installer Code",
    field: "installerCode" as keyof InstallerWithId,
    icon: IconInstallerCode,
  },
  {
    label: "Name",
    field: "fullName" as keyof InstallerWithId,
    icon: IconInstaller,
  },
  {
    label: "Date Joined",
    field: "createdAt" as keyof InstallerWithId,
    icon: IconClock,
  },
  {
    label: "Training Center",
    field: "trainingCenter" as keyof InstallerWithId,
    icon: IconTrainingCenter,
  },
  {
    label: "City",
    field: "city" as keyof InstallerWithId,
    icon: IconCity,
  },
  {
    label: "Province",
    field: "province" as keyof InstallerWithId,
    icon: IconCity,
  },
] as const;

// Memoized table row component to prevent unnecessary re-renders
interface InstallerTableRowProps {
  installer: InstallerWithId;
  isSelected: boolean;
  visibleColumns: {
    installerCode: boolean;
    fullName: boolean;
    cnic: boolean;
    phoneNumber: boolean;
    city: boolean;
    province: boolean;
    trainingCenter: boolean;
    companyName: boolean;
    certified: boolean;
    bankName: boolean;
    accountNumber: boolean;
  };
  isAdmin: boolean;
  deletingId: string | null;
  onToggleSelection: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

const InstallerTableRow = memo(function InstallerTableRow({
  installer,
  isSelected,
  visibleColumns,
  isAdmin,
  deletingId,
  onToggleSelection,
  onEdit,
  onDelete,
}: InstallerTableRowProps) {
  return (
    <TableRow id={`installer-${installer._id}`} className="transition-colors">
      <TableCell className="text-center w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(installer._id)}
          aria-label={`Select ${installer.fullName}`}
        />
      </TableCell>
      {visibleColumns.installerCode && (
        <TableCell className="font-medium">
          <div className="font-mono flex items-center">
            <Link href={`/installers/${installer.installerCode}`}>
              {installer.installerCode}
            </Link>
            <CopyButton text={installer.installerCode} label="Installer Code" />
          </div>
        </TableCell>
      )}
      {visibleColumns.fullName && <TableCell>{installer.fullName}</TableCell>}
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
            onClick={() => onEdit(installer._id)}
            title="Edit"
          >
            <IconEdit2 />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            title="Delete"
            disabled={!isAdmin || deletingId === installer._id}
            className="group"
            onClick={() => onDelete(installer._id, installer.fullName)}
          >
            <IconTrashBin2 className="h-4.5 w-4.5 text-destructive-text group-hover:text-destructive-text-hover transition-colors duration-300" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

export default function InstallersPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // React Query for data fetching
  const {
    data: queryData,
    isLoading,
    isFetching,
    refetch: fetchInstallers,
    dataUpdatedAt,
  } = useInstallers();
  const loading = isLoading || isFetching;
  const installers = useMemo(
    () => queryData?.installers || [],
    [queryData?.installers]
  );

  // Debounced search
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [googleAuthStatus, setGoogleAuthStatus] = useState<{
    isAuthenticated: boolean;
    hasRefreshToken: boolean;
    accountEmail: string | null;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogState, setDeleteDialogState] = useState<{
    open: boolean;
    status: "confirm" | "deleting" | "success" | "error";
    message?: string;
    installerId?: string;
    installerName?: string;
  }>({
    open: false,
    status: "confirm",
  });

  const [bulkDeleteResultState, setBulkDeleteResultState] = useState<{
    open: boolean;
    successCount: number;
    failCount: number;
    failures: Array<{ name: string; reason: string }>;
  }>({
    open: false,
    successCount: 0,
    failCount: 0,
    failures: [],
  });

  // Bulk selection state
  const [selectedInstallers, setSelectedInstallers] = useState<Set<string>>(
    new Set()
  );
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

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
    dateRange: "all" as "all" | "today" | "week" | "month" | "year" | "custom",
    customStartDate: "",
    customEndDate: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Sync dateRange with filters when popover opens
  useEffect(() => {
    if (isCustomDateOpen && filters.customStartDate && filters.customEndDate) {
      setDateRange({
        from: new Date(filters.customStartDate),
        to: new Date(filters.customEndDate),
      });
    } else if (!isCustomDateOpen) {
      // Reset when popover closes
      if (filters.dateRange !== "custom") {
        setDateRange(undefined);
      }
    }
  }, [
    isCustomDateOpen,
    filters.customStartDate,
    filters.customEndDate,
    filters.dateRange,
  ]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [downloadingReport, setDownloadingReport] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const timeoutIds: NodeJS.Timeout[] = [];

    // Wrapper to check if component is still mounted before updating state
    const checkAuthIfMounted = async () => {
      try {
        const response = await fetch("/api/google-auth/status");
        const data = await response.json();
        if (isMounted) {
          setGoogleAuthStatus(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to check Google auth status:", err);
        }
      }
    };

    checkAuthIfMounted();

    // Check for auth callback success
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth_success")) {
      checkAuthIfMounted(); // Refresh status
      window.history.replaceState({}, "", "/installers");
    }

    // Check for search result ID from navbar
    const searchId = params.get("id");
    if (searchId) {
      setSelectedInstallerId(searchId);
      // Scroll to the row after a short delay
      const scrollTimeout = setTimeout(() => {
        const element = document.getElementById(`installer-${searchId}`);
        if (element && isMounted) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("bg-primary/10");
          const highlightTimeout = setTimeout(() => {
            if (isMounted) {
              element.classList.remove("bg-primary/10");
            }
          }, 2000);
          timeoutIds.push(highlightTimeout);
        }
      }, 500);
      timeoutIds.push(scrollTimeout);
    }

    // Cleanup function
    return () => {
      isMounted = false;
      timeoutIds.forEach(clearTimeout);
    };
  }, []);

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

  const handleDelete = useCallback(
    async (installerId: string, installerName: string) => {
      // Set deleting state
      setDeleteDialogState({
        open: true,
        status: "deleting",
        installerId,
        installerName,
      });

      setDeletingId(installerId);
      try {
        const response = await fetch(`/api/installers/${installerId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (response.ok) {
          // React Query will auto-refetch, just update UI state
          await fetchInstallers();

          // Remove from selection if selected
          setSelectedInstallers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(installerId);
            return newSet;
          });

          // Show success in dialog
          setDeleteDialogState({
            open: true,
            status: "success",
            message: `Installer "${installerName}" has been deleted successfully!`,
            installerName,
          });
        } else {
          // Show error in dialog
          setDeleteDialogState({
            open: true,
            status: "error",
            message: data.message || "Failed to delete installer",
            installerName,
          });
        }
      } catch (error) {
        console.error("Failed to delete installer:", error);
        // Show error in dialog
        setDeleteDialogState({
          open: true,
          status: "error",
          message: "An error occurred while deleting the installer",
          installerName,
        });
      } finally {
        setDeletingId(null);
      }
    },
    [fetchInstallers]
  );

  // Bulk delete handler
  const handleBulkDelete = useCallback(async () => {
    if (selectedInstallers.size === 0) return;

    setBulkDeleting(true);
    const toastId = toast.loading(
      `Deleting ${selectedInstallers.size} installer(s)...`
    );

    try {
      let successCount = 0;
      let failCount = 0;
      const failures: Array<{ name: string; reason: string }> = [];

      // Delete installers one by one
      for (const installerId of selectedInstallers) {
        try {
          const installer = installers.find((i) => i._id === installerId);
          const installerName = installer?.fullName || "Unknown";

          const response = await fetch(`/api/installers/${installerId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            const data = await response.json();
            failures.push({
              name: installerName,
              reason: data.message || "Unknown error",
            });
          }
        } catch (error) {
          failCount++;
          const installer = installers.find((i) => i._id === installerId);
          failures.push({
            name: installer?.fullName || "Unknown",
            reason: "Network error",
          });
        }
      }

      // React Query will auto-refetch
      await fetchInstallers();

      // Clear selection
      setSelectedInstallers(new Set());

      // Show results
      toast.dismiss(toastId);

      // Show result dialog
      setBulkDeleteResultState({
        open: true,
        successCount,
        failCount,
        failures,
      });
    } catch (error) {
      toast.dismiss(toastId);
      console.error("Bulk delete error:", error);
      toast.error("An error occurred during bulk delete");
    } finally {
      setBulkDeleting(false);
    }
  }, [selectedInstallers, installers, fetchInstallers]);

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
      // Clicking the same field: cycle through asc -> desc -> reset to default
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        // Reset to default sort (createdAt desc)
        setSortField("createdAt");
        setSortDirection("desc");
      }
    } else {
      // Clicking a new field: start with ascending
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
      return (
        <IconSortVertical className="size-4 ml-1 inline text-muted-foreground/50" />
      );
    }
    return sortDirection === "asc" ? (
      <IconSortVertical duotone className="size-4 ml-1 inline text-primary" />
    ) : (
      <IconSortVertical
        duotone
        className="size-4 ml-1 inline rotate-180 text-primary"
      />
    );
  };

  // Check if user is admin
  const isAdmin =
    session?.user?.role === TeamRole.ADMIN ||
    session?.user?.role === TeamRole.MANAGER;

  // Optimized filtering, sorting, and statistics (single pass)
  const {
    filtered: filteredInstallers,
    statistics,
    uniqueValues,
  } = useOptimizedInstallerFilter({
    installers,
    search: debouncedSearch,
    filters,
    sortField,
    sortDirection,
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredInstallers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  // Reset to first page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, debouncedSearch]);

  const activeColumnsLength =
    Object.values(visibleColumns).filter(Boolean).length;

  // Get paginated data (filteredInstallers is already sorted)
  const paginatedInstallers = filteredInstallers.slice(startIndex, endIndex);

  // Use React Query's dataUpdatedAt for last update time
  const refreshRelTime = useRelativeTime(new Date(dataUpdatedAt));

  // Animated container variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  const cityGroups: SearchableSelectGroup[] = useMemo(() => {
    const groups = PROVINCES.map((province) => {
      const citiesInProvince = uniqueValues.cities
        .filter((c) => CITY_TO_PROVINCE[c] === province)
        .sort();

      if (citiesInProvince.length === 0) return null;

      return {
        label: province,
        options: citiesInProvince.map((c) => ({
          value: c,
          label: (
            <div className="flex items-end gap-2">
              {c}
              {!province.includes(c) && (
                <p className="text-muted-foreground text-[10px]">{province}</p>
              )}
            </div>
          ),
        })),
      } as SearchableSelectGroup;
    });

    return groups.filter((g): g is SearchableSelectGroup => g !== null);
  }, [uniqueValues.cities]);

  return (
    <div className="flex-1 overflow-auto space-y-4">
      <PageHeader
        title="Installers"
        // iconFill
        Icon={IconInstaller}
        description={
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage installers, view details, and add new entries
            </p>
          </>
        }
        action={
          <>
            <Button
              onClick={() => router.push("/installers/bulk-register")}
              variant="outline"
              disabled={loading || !googleAuthStatus?.isAuthenticated}
              title={
                !googleAuthStatus?.isAuthenticated
                  ? "Google Contacts authentication required"
                  : "Bulk Register"
              }
              className="gap-2"
            >
              Bulk Register
              <IconLayer width={2} className="h-3.5 w-3.5" />
            </Button>

            {/* Register New Installer OR Authenticate Google Contacts */}
            {googleAuthStatus?.isAuthenticated ? (
              <Button
                onClick={() => router.push("/installers/register")}
                disabled={loading}
                title="Register New Installer"
                className="gap-2 pl-2"
              >
                <IconAdd width={2} className="h-3.5 w-3.5" />
                Register Installer
              </Button>
            ) : (
              <Button
                onClick={isAdmin ? handleAuthenticateGoogle : undefined}
                disabled={!isAdmin || authLoading || loading}
                variant="warning"
                title={
                  !isAdmin
                    ? "Only administrators can authenticate Google Contacts"
                    : "Authenticate Google Contacts to enable registration"
                }
              >
                {authLoading
                  ? "Authenticating..."
                  : "Authenticate Google Contacts"}
                <IconSquareArrowRightUp className="h-5 w-5 ml-2" />
              </Button>
            )}
          </>
        }
      />

      {/* Google Account Status Indicator */}
      {googleAuthStatus?.isAuthenticated && googleAuthStatus.accountEmail ? (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">
                Google Contacts authenticated as:
              </span>
              <Badge variant="secondary" className="font-mono">
                {googleAuthStatus.accountEmail}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : (
        googleAuthStatus &&
        !googleAuthStatus.isAuthenticated && (
          <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-muted-foreground">
                  {isAdmin
                    ? "Google Contacts authentication required to register installers. Click the 'Authenticate Google Contacts' button above."
                    : "Google Contacts not authenticated. Please contact an administrator to enable installer registration."}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Statistics Cards - Optimized Component */}
      <StatisticsCards statistics={statistics} />

      <Card className="bg-transparent">
        <CardHeader className="flex-row items-center justify-between w-full bg-muted dark:bg-muted/50 border-b border-border">
          <CardTitle className="text-lg font-semibold">
            Installers Database
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Last Updated:</span>
              <span>{loading ? <Loading /> : refreshRelTime}</span>
            </div>
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* DATE RANGE FILTER */}
            <ToggleGroup
              type="single"
              value={filters.dateRange}
              onValueChange={(value) => {
                if (!value) return;
                setFilters((prev) => ({
                  ...prev,
                  dateRange: value as typeof prev.dateRange,
                  customStartDate:
                    value !== "custom" ? "" : prev.customStartDate,
                  customEndDate: value !== "custom" ? "" : prev.customEndDate,
                }));
              }}
              className={cn("h-9 bg-background", loading && "opacity-50")}
              disabled={loading}
            >
              <ToggleGroupItem className="h-max p-2" value="all">
                ALL
              </ToggleGroupItem>
              <ToggleGroupItem className="h-max p-2" value="today">
                1D
              </ToggleGroupItem>
              <ToggleGroupItem className="h-max p-2" value="week">
                1W
              </ToggleGroupItem>
              <ToggleGroupItem className="h-max p-2" value="month">
                1M
              </ToggleGroupItem>
              <ToggleGroupItem className="h-max p-2" value="year">
                1Y
              </ToggleGroupItem>

              <Popover
                open={isCustomDateOpen}
                onOpenChange={setIsCustomDateOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "hidden sm:flex gap-2 rounded-xl py-1.5 px-2 h-max",
                      filters.dateRange === "custom"
                        ? "text-primary bg-muted"
                        : "text-muted-foreground"
                    )}
                    disabled={loading}
                  >
                    <IconClockCircle className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  className="w-full max-w-lg p-0 bg-card dark:bg-background overflow-hidden shadow-2xl"
                  align="end"
                >
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-between p-4 border-b border-border w-full">
                      <div>
                        <h4 className="font-medium text-sm">
                          Select Date Range
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Custom date range for filtering installers
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="rounded-xl"
                          variant="outline"
                          onClick={() => {
                            setDateRange(undefined);
                            setFilters((prev) => ({
                              ...prev,
                              dateRange: "all",
                              customStartDate: "",
                              customEndDate: "",
                            }));
                            setIsCustomDateOpen(false);
                          }}
                        >
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-xl"
                          onClick={() => {
                            if (dateRange?.from && dateRange?.to) {
                              // Convert dates to local date strings (YYYY-MM-DD)
                              const fromDate = new Date(
                                dateRange.from.getTime() -
                                  dateRange.from.getTimezoneOffset() * 60000
                              );
                              const toDate = new Date(
                                dateRange.to.getTime() -
                                  dateRange.to.getTimezoneOffset() * 60000
                              );

                              setFilters((prev) => ({
                                ...prev,
                                dateRange: "custom",
                                customStartDate: fromDate
                                  .toISOString()
                                  .split("T")[0],
                                customEndDate: toDate
                                  .toISOString()
                                  .split("T")[0],
                              }));
                              setIsCustomDateOpen(false);
                            }
                          }}
                          disabled={!dateRange?.from || !dateRange?.to}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                    <CalendarComponent
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      startMonth={new Date(2023, 0, 1)}
                      disabled={(date) =>
                        date > new Date() || date < new Date("2023-01-01")
                      }
                      excludeDisabled
                      captionLayout="dropdown"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </ToggleGroup>
            <Button
              variant="outline"
              onClick={() => fetchInstallers()}
              disabled={loading}
              title="Refresh data"
              size="sm"
              className="gap-2 rounded-2xl"
            >
              Refresh
              <IconRefresh2
                width={2}
                className={cn("h-3.5 w-3.5", loading && "animate-spin")}
              />
            </Button>

            <Dropdown>
              <TooltipProvider>
                <Tooltip>
                  <DropdownTrigger asChild>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" disabled={loading}>
                        <IconLayer />
                      </Button>
                    </TooltipTrigger>
                  </DropdownTrigger>
                  <TooltipContent side="top">Export</TooltipContent>

                  <DropdownContent className="min-w-32 p-2">
                    <div className="px-2 pb-2 text-sm text-muted-foreground">
                      Export Data
                    </div>
                    <ScrollArea className="max-h-40">
                      <div className="space-y-1 w-full">
                        {[
                          { value: "Excel", Icon: IconExcel },
                          { value: "PDF", Icon: IconExcel },
                          { value: "Print", Icon: IconExcel },
                        ].map(({ value, Icon }, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="w-full flex flex-start gap-2 px-3 py-2 whitespace-nowrap"
                          >
                            <Icon />
                            <span className="text-sm">{value}</span>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </DropdownContent>
                </Tooltip>
              </TooltipProvider>
            </Dropdown>
            <Button
              variant="outline"
              onClick={handleDownloadReport}
              disabled={
                filteredInstallers.length === 0 || downloadingReport || loading
              }
              size="sm"
              className="gap-2 rounded-2xl"
            >
              {downloadingReport ? (
                <>
                  Downloading <Loading />
                </>
              ) : (
                <>
                  Export
                  <IconSquareShareLine width={2} />
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0! light:bg-muted/50">
          {/* TABLE */}
          <div>
            <div className="flex justify-between p-4 dark:bg-muted/30">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm leading-none">Filters Applied:</p>

                  {/* Sort - Always Show */}
                  <div className="text-xs flex items-center gap-1 text-muted-foreground">
                    Sort:
                    <Badge
                      variant="outline"
                      className="gap-1 [&>svg]:pointer-events-auto h-5.5"
                    >
                      {sortDirection === "asc" ? (
                        <IconSortFromTopToBottom duotone />
                      ) : (
                        <IconSortFromBottomToTop duotone />
                      )}
                      {sortField === "installerCode" && "Installer Code"}
                      {sortField === "fullName" && "Name"}
                      {sortField === "cnic" && "CNIC"}
                      {sortField === "trainingCenter" && "Training Center"}
                      {sortField === "city" && "City"}
                      {sortField === "province" && "Province"}
                      {sortField === "certified" && "Certified"}
                      {sortField === "createdAt" && "Date"}
                      <IconClose
                        className={cn(
                          "size-4!",
                          sortField === "createdAt" && sortDirection === "desc"
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        )}
                        onClick={() => {
                          if (
                            sortField !== "createdAt" ||
                            sortDirection !== "desc"
                          ) {
                            setSortField("createdAt");
                            setSortDirection("desc");
                          }
                        }}
                      />
                    </Badge>
                  </div>

                  {/* Date Range - Always Show */}
                  <div className="text-xs flex items-center gap-1 text-muted-foreground">
                    Date Range:
                    <Badge
                      variant="outline"
                      className="gap-1 [&>svg]:pointer-events-auto h-5.5"
                    >
                      {filters.dateRange === "all" && "All Time"}
                      {filters.dateRange === "today" && "Today"}
                      {filters.dateRange === "week" && "Last 7 days"}
                      {filters.dateRange === "month" && "Last 30 days"}
                      {filters.dateRange === "year" && "Last year"}
                      {filters.dateRange === "custom" &&
                        `${filters.customStartDate} to ${filters.customEndDate}`}
                      <IconClose
                        className={cn(
                          "size-4!",
                          filters.dateRange === "all"
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        )}
                        onClick={() => {
                          if (filters.dateRange !== "all") {
                            setFilters((prev) => ({
                              ...prev,
                              dateRange: "all",
                              customStartDate: "",
                              customEndDate: "",
                            }));
                          }
                        }}
                      />
                    </Badge>
                  </div>
                  {/* CITY FILTER */}
                  {filters.city && (
                    <div className="text-xs flex items-center gap-1 text-muted-foreground">
                      City:
                      <Badge
                        variant="outline"
                        className="gap-1 [&>svg]:pointer-events-auto h-5.5"
                      >
                        {filters.city}
                        <IconClose
                          className={"size-4! cursor-pointer"}
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              city: "",
                            }))
                          }
                        />
                      </Badge>
                    </div>
                  )}
                  {/* PROVINCE FILTER */}
                  {filters.province && (
                    <div className="text-xs flex items-center gap-1 text-muted-foreground">
                      Province:
                      <Badge
                        variant="outline"
                        className="gap-1 [&>svg]:pointer-events-auto h-5.5"
                      >
                        {filters.province}
                        <IconClose
                          className={"size-4! cursor-pointer"}
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              province: "",
                            }))
                          }
                        />
                      </Badge>
                    </div>
                  )}
                  {/* TRAINIG CENTER FILTER */}
                  {filters.trainingCenter && (
                    <div className="text-xs flex items-center gap-1 text-muted-foreground">
                      Training Center:
                      <Badge
                        variant="outline"
                        className="gap-1 [&>svg]:pointer-events-auto h-5.5"
                      >
                        {filters.trainingCenter}
                        <IconClose
                          className={"size-4! cursor-pointer"}
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              trainingCenter: "",
                            }))
                          }
                        />
                      </Badge>
                    </div>
                  )}
                  {/* CER */}
                  {filters.certified && (
                    <div className="text-xs flex items-center gap-1 text-muted-foreground">
                      Certification:
                      <Badge
                        variant="outline"
                        className="gap-1 [&>svg]:pointer-events-auto h-5.5"
                      >
                        {filters.certified === "true"
                          ? "Certified"
                          : "Non Certified"}
                        <IconClose
                          className={"size-4! cursor-pointer"}
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              certified: "",
                            }))
                          }
                        />
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="text-sm text-muted-foreground inline-flex items-center gap-1">
                  Show
                  <Select
                    value={rowsPerPage.toString()}
                    onValueChange={(value) => {
                      setRowsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-6 w-max gap-1 px-1 pl-2 rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="p-0!">
                      <SelectItem className="h-6" value="10">
                        10
                      </SelectItem>
                      <SelectItem className="h-6" value="25">
                        25
                      </SelectItem>
                      <SelectItem className="h-6" value="50">
                        50
                      </SelectItem>
                      <SelectItem className="h-6" value="100">
                        100
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  rows per page
                </div>
              </div>
              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowFilters((prev) => !prev)}
                        disabled={loading}
                      >
                        <IconSetting4 />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {showFilters ? "Show" : "Hide"} Filters
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {/* COLUMN VISIBILITY */}
                <Dropdown>
                  <TooltipProvider>
                    <Tooltip>
                      <DropdownTrigger asChild>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={loading}
                          >
                            <IconLayer />
                          </Button>
                        </TooltipTrigger>
                      </DropdownTrigger>
                      <TooltipContent side="top">
                        Column Visibility
                      </TooltipContent>

                      <DropdownContent className="w-54 p-2 pr-0.5">
                        <div className="px-2 pb-2 text-sm text-muted-foreground">
                          Columns Visibility
                        </div>
                        <ScrollArea className="h-72 pr-2 rounded-xl">
                          <div className="space-y-1 w-[98%] bg-background p-1">
                            {Object.entries(visibleColumns).map(
                              ([key, value]) => (
                                <Label
                                  key={key}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-card transition-colors whitespace-nowrap text-muted-foreground",
                                    value && "bg-card text-primary"
                                  )}
                                >
                                  <Checkbox
                                    checked={value}
                                    className="border border-primary/20"
                                    onCheckedChange={() => toggleColumn(key)}
                                    aria-label={`Toggle ${key
                                      .replace(/([A-Z])/g, " $1")
                                      .trim()} column`}
                                  />
                                  <span className="capitalize text-sm">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </span>
                                </Label>
                              )
                            )}
                          </div>
                        </ScrollArea>
                      </DropdownContent>
                    </Tooltip>
                  </TooltipProvider>
                </Dropdown>
              </div>
            </div>

            {/* FILTERS */}
            <Activity mode={showFilters ? "visible" : "hidden"}>
              <CardContent className="p-4 flex items-center gap-2 ">
                {/* CITIES FILTER */}
                <div className="space-y-2 w-full">
                  <span className="text-sm px-2">City</span>

                  <SearchableSelect
                    value={filters.city || "all"}
                    id={"city-select-installer-filter"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        city: value === "all" ? "" : value,
                      }))
                    }
                    groups={cityGroups}
                    placeholder={filters.city || "All Cities"}
                    searchPlaceholder={"Search city ..."}
                    emptyMessage={"No results found."}
                    disabled={loading}
                    className="rounded-2xl"
                  />
                </div>
                {/* PROVINCES FILTER */}
                <div className="space-y-2 w-full">
                  <span className="text-sm px-2">Province</span>
                  <Select
                    value={filters.province || "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        province: value === "all" ? "" : value,
                      }))
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-muted/40 hover:bg-muted/60 transition-colors data-[state=open]:bg-muted/80">
                      <SelectValue placeholder="All provinces" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All provinces</SelectItem>
                      {uniqueValues.provinces.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* TRAINING CENTERS FILTER */}
                <div className="space-y-2 w-full">
                  <span className="text-sm px-2">Training Center</span>
                  <Select
                    value={filters.trainingCenter || "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        trainingCenter: value === "all" ? "" : value,
                      }))
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-muted/40 hover:bg-muted/60 transition-colors data-[state=open]:bg-muted/80">
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

                {/* CERTIFICATION FILTER */}
                <div className="space-y-2 w-full">
                  <span className="text-sm px-2">Certification</span>
                  <Select
                    value={filters.certified || "all"}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        certified: value === "all" ? "" : value,
                      }))
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="bg-muted/40 hover:bg-muted/60 transition-colors data-[state=open]:bg-muted/80">
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
                  <span className="text-sm px-2">Reset Filters</span>
                  {/* FILTER CLEAR BUTTON */}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({
                        city: "",
                        province: "",
                        trainingCenter: "",
                        certified: "",
                        dateRange: "all",
                        customStartDate: "",
                        customEndDate: "",
                      });
                      setSortField("createdAt");
                      setSortDirection("desc");
                    }}
                    disabled={
                      (!filters.city &&
                        !filters.province &&
                        !filters.trainingCenter &&
                        !filters.certified &&
                        sortField === "createdAt" &&
                        sortDirection === "desc" &&
                        filters.dateRange === "all") ||
                      loading
                    }
                    className="min-w-fit rounded-3xl gap-1.5 pl-2"
                  >
                    <IconClose />
                    Reset All
                  </Button>
                </div>
              </CardContent>
            </Activity>
            <Table>
              <TableHeader>
                <TableRow className="light:bg-muted light:hover:bg-muted dark:bg-muted/50">
                  <TableHead className="text-center w-12">
                    <Checkbox
                      checked={
                        paginatedInstallers.length > 0 &&
                        paginatedInstallers.every((i) =>
                          selectedInstallers.has(i._id)
                        )
                          ? true
                          : paginatedInstallers.some((i) =>
                              selectedInstallers.has(i._id)
                            )
                          ? "indeterminate"
                          : false
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
                    <TableHead className="cursor-pointer font-semibold">
                      Province {getSortIcon("province")}
                    </TableHead>
                  )}
                  {visibleColumns.trainingCenter && (
                    <TableHead
                      className="cursor-pointer font-semibold"
                      onClick={() => handleSort("trainingCenter")}
                    >
                      Training Center {getSortIcon("trainingCenter")}
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
                      actionIcons={[IconEdit2, IconTrashBin2]}
                      excludeLastColumn={true}
                    />
                  </>
                ) : filteredInstallers.length === 0 ? (
                  <TableRow className="p-4 hover:bg-transparent">
                    <TableCell
                      colSpan={activeColumnsLength + 2}
                      className="w-full place-items-center p-0"
                    >
                      <EmptyState
                        title="Not Found Installers"
                        description="You can register a new Installer by clicking below button."
                        icons={[IconActivity]}
                        className="w-full"
                        action={{
                          label: (
                            <div className="flex items-center gap-2">
                              Register Installer
                              <IconAdd />
                            </div>
                          ),
                          onClick: () => router.push("/installers/register"),
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInstallers.map((installer: InstallerWithId) => (
                    <InstallerTableRow
                      key={installer._id}
                      installer={installer}
                      isSelected={selectedInstallers.has(installer._id)}
                      visibleColumns={visibleColumns}
                      isAdmin={isAdmin}
                      deletingId={deletingId}
                      onToggleSelection={toggleSelection}
                      onEdit={(id) => {
                        setSelectedInstallerId(id);
                        setEditModalOpen(true);
                      }}
                      onDelete={(id, name) => {
                        setDeleteDialogState({
                          open: true,
                          status: "confirm",
                          installerId: id,
                          installerName: name,
                        });
                      }}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4 relative bg-muted dark:bg-muted/50 text-xs text-muted-foreground">
          {/* PAGINATION */}

          <div className="text-sm text-muted-foreground inline-flex items-center gap-1">
            Show
            <Select
              value={rowsPerPage.toString()}
              onValueChange={(value) => {
                setRowsPerPage(Number(value));
                setCurrentPage(1);
              }}
              disabled={loading}
            >
              <SelectTrigger className="h-6 w-max gap-1 px-1 pl-2 rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="p-0!">
                <SelectItem className="h-6" value="10">
                  10
                </SelectItem>
                <SelectItem className="h-6" value="25">
                  25
                </SelectItem>
                <SelectItem className="h-6" value="50">
                  50
                </SelectItem>
                <SelectItem className="h-6" value="100">
                  100
                </SelectItem>
              </SelectContent>
            </Select>
            rows per page
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || loading}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || loading}
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
                disabled={currentPage === totalPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || loading}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
            Showing {startIndex > 0 && "0"}
            {startIndex + 1}-{rowsPerPage + startIndex} of{" "}
            {filteredInstallers.length} results
            {filteredInstallers.length !== installers.length && (
              <span className="ml-1">
                (filtered from {installers.length} total)
              </span>
            )}
          </div>
          <div className="absolute pb-4 inset-0 w-full h-full flex items-center justify-center pointer-events-none">
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
                    "border border-border rounded-2xl p-2 flex items-center gap-2 relative bg-background/40 backdrop-blur-xs pointer-events-auto"
                  )}
                >
                  <div className="px-4 py-3 bg-background rounded-xl flex items-center justify-center leading-none select-none">
                    Selected: {selectedInstallers.size}
                  </div>
                  <Button
                    variant="destructive"
                    size={"icon"}
                    disabled={bulkDeleting || !isAdmin}
                    className="gap-1"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                  >
                    {bulkDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <IconTrashBin2 width={2} />
                    )}
                  </Button>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </CardFooter>
      </Card>
      {/* Edit Modal */}
      <LazyInstallerEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        installerId={selectedInstallerId}
        onSuccess={() => fetchInstallers()}
      />

      {/* Delete Confirmation/Result Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogState.open}
        status={deleteDialogState.status}
        itemName={deleteDialogState.installerName}
        message={deleteDialogState.message}
        entityType="installer"
        warningMessage="Installer with rewards cannot be deleted."
        onConfirm={() => {
          if (
            deleteDialogState.installerId &&
            deleteDialogState.installerName
          ) {
            handleDelete(
              deleteDialogState.installerId,
              deleteDialogState.installerName
            );
          }
        }}
        onClose={() =>
          setDeleteDialogState({
            open: false,
            status: "confirm",
          })
        }
      />

      {/* Bulk Delete Confirmation Dialog */}
      <BulkDeleteConfirmationDialog
        open={bulkDeleteDialogOpen}
        deleting={bulkDeleting}
        count={selectedInstallers.size}
        entityType="installer"
        warningMessage="Installers with rewards cannot be deleted."
        onConfirm={() => {
          setBulkDeleteDialogOpen(false);
          handleBulkDelete();
        }}
        onClose={() => setBulkDeleteDialogOpen(false)}
      />

      {/* Bulk Delete Result Dialog */}
      <BulkDeleteResultDialog
        open={bulkDeleteResultState.open}
        successCount={bulkDeleteResultState.successCount}
        failCount={bulkDeleteResultState.failCount}
        failures={bulkDeleteResultState.failures}
        entityType="installer"
        onClose={() =>
          setBulkDeleteResultState({
            open: false,
            successCount: 0,
            failCount: 0,
            failures: [],
          })
        }
      />
    </div>
  );
}
