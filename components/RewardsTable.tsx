import React, {
  Activity,
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion, AnimatePresence } from "motion/react";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import Dropdown, {
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/CopyButton";
import {
  IconEdit2,
  IconTrashBin2,
  IconLayer,
  IconActivity,
  IconAdd,
  IconInfoCircle,
  IconClose,
  IconSortFromTopToBottom,
  IconSortFromBottomToTop,
  IconSetting4,
  IconCheck,
} from "@/components/icons";
import { EmptyState } from "@/components/EmptyState";
import Loading from "@/components/ui/loading";
import { RewardsTableRow } from "./RewardsTableRow";
import type { RewardWithId } from "@/hooks/useOptimizedRewardsFilter";
import type { ColumnVisibility, Filters } from "@/hooks/useRewardsState";
import IconSortVertical from "./icons/SortVertical";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InstallerAvatar } from "./UserAvatar";
import Unavailable from "./ui/not-avaiable";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
}

interface RewardsTableProps {
  rewards: RewardWithId[];
  totalRewards: number;
  totalUnfilteredRewards: number;
  loading: boolean;
  visibleColumns: ColumnVisibility;
  selectedRewards: Set<string>;
  currentPage: number;
  itemsPerPage: number;
  sortField: string;
  sortDirection: "asc" | "desc";
  bulkDeleting: boolean;
  showFilters: boolean;
  lastUpdatedText: string;
  filters?: {
    search?: string;
    rewardStatus?: string;
    sendingDate?: string;
    paymentMethod?: string;
    installationDate?: string;
    productModel?: string;
    teamMember?: string;
    dateRange?: "all" | "today" | "week" | "month" | "year" | "custom";
    customStartDate?: string;
    customEndDate?: string;
    updatedAt?: string;
  };
  teamMembers?: TeamMember[];
  uniqueValues?: {
    paymentMethods: string[];
    productModels: string[];
  };
  onToggleColumn: (column: keyof ColumnVisibility) => void;
  onToggleSort: (field: string) => void;
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: () => void;
  onEditClick: (id: string) => void;
  onDeleteClick: (id: string, serialNumber: string) => void;
  onBulkDelete: () => void;
  onOpenBulkDeleteDialog: () => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  onClearFilter?: (key: string) => void;
  onFilterChange?: (key: string, value: string) => void;
  onClearAllFilters?: () => void;
}

export const RewardsTable = React.memo<RewardsTableProps>(
  ({
    rewards,
    totalRewards,
    totalUnfilteredRewards,
    loading,
    visibleColumns,
    selectedRewards,
    currentPage,
    itemsPerPage,
    sortField,
    sortDirection,
    bulkDeleting,
    showFilters,
    lastUpdatedText,
    filters,
    teamMembers,
    uniqueValues,
    onToggleColumn,
    onToggleSort,
    onToggleSelection,
    onToggleSelectAll,
    onEditClick,
    onDeleteClick,
    onBulkDelete,
    onOpenBulkDeleteDialog,
    onPageChange,
    onItemsPerPageChange,
    onClearFilter,
    onFilterChange,
    onClearAllFilters,
  }) => {
    const router = useRouter();

    // Virtual scrolling ref for large datasets
    const parentRef = useRef<HTMLDivElement>(null);
    // Column width calculation refs
    const measureRef = useRef<HTMLDivElement>(null);
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
      {},
    );

    // Virtual scrolling setup
    const rowVirtualizer = useVirtualizer({
      count: rewards.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 65, // Estimated row height in pixels
      overscan: 5, // Number of items to render outside of visible area
    });

    // Calculate column widths based on content
    useEffect(() => {
      if (!measureRef.current || rewards.length === 0 || loading) return;

      const calculateColumnWidths = () => {
        const container = measureRef.current;
        if (!container) return;

        const newWidths: Record<string, number> = {};

        // Get all columns with data-column attribute
        const allColumns = container.querySelectorAll("[data-column]");

        // Neutralize flex-grow while measuring so scrollWidth reflects true
        // content width, not the width the cell was already stretched to.
        // (Measuring stretched cells feeds back and inflates minWidth, which
        //  then forces a false horizontal scrollbar.) React reapplies the
        //  grow styles on the next render.
        allColumns.forEach((cell) => {
          const el = cell as HTMLElement;
          el.style.flexGrow = "0";
          el.style.flexBasis = "auto";
        });

        // Group cells by column
        const columnGroups: Record<string, HTMLElement[]> = {};
        allColumns.forEach((cell) => {
          const columnName = cell.getAttribute("data-column");
          if (columnName) {
            if (!columnGroups[columnName]) {
              columnGroups[columnName] = [];
            }
            columnGroups[columnName].push(cell as HTMLElement);
          }
        });

        // Calculate max width for each column
        Object.entries(columnGroups).forEach(([columnName, cells]) => {
          let maxWidth = 0;
          cells.forEach((cell) => {
            const width = cell.scrollWidth;
            if (width > maxWidth) {
              maxWidth = width;
            }
          });
          newWidths[columnName] = maxWidth;
        });

        // Restore grow so columns fill again. React won't rewrite these on the
        // next render (its vdom already has flexGrow:1, unchanged), so we must
        // set them back to match getColumnStyle explicitly.
        allColumns.forEach((cell) => {
          const el = cell as HTMLElement;
          el.style.flexGrow = "1";
          el.style.flexBasis = "0";
        });

        setColumnWidths(newWidths);
      };

      // Use requestAnimationFrame for better performance
      const rafId = requestAnimationFrame(() => {
        calculateColumnWidths();
      });

      return () => cancelAnimationFrame(rafId);
    }, [rewards, loading]);

    // Get team member name by ID
    const getTeamMemberName = useCallback(
      (teamMemberId: string) => {
        const member = teamMembers?.find((m) => m._id === teamMemberId);
        return member ? `${member.name} (${member.email})` : "Team Member";
      },
      [teamMembers],
    );

    const activeColumnsLength = useMemo(
      () => Object.values(visibleColumns).filter(Boolean).length,
      [visibleColumns],
    );

    // Sum of measured column widths + fixed checkbox (48px) / actions (128px).
    // Used as an explicit min-width on the table wrapper so it scrolls only
    // when real content exceeds the container, and lets columns flex-grow to
    // fill otherwise. Avoids CSS max-content/fit-content, which inflate here
    // because they count flex-grow. ponytail: 48/128 mirror w-12/w-32.
    const measuredColumnCount = Object.keys(columnWidths).length;
    const totalColumnsWidth = useMemo(
      () =>
        Object.values(columnWidths).reduce((sum, w) => sum + w, 0) + 48 + 128,
      [columnWidths],
    );

    const allSelected = useMemo(
      () =>
        rewards.length > 0 && rewards.every((r) => selectedRewards.has(r._id)),
      [rewards, selectedRewards],
    );

    // Pagination calculations
    const totalPages = useMemo(
      () => Math.ceil(totalRewards / itemsPerPage),
      [totalRewards, itemsPerPage],
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Pagination handlers
    const handleItemsPerPageChange = useCallback(
      (value: string) => {
        onItemsPerPageChange(Number(value));
      },
      [onItemsPerPageChange],
    );

    const handleFirstPage = useCallback(() => {
      onPageChange(1);
    }, [onPageChange]);

    const handlePreviousPage = useCallback(() => {
      onPageChange(currentPage - 1);
    }, [onPageChange, currentPage]);

    const handleNextPage = useCallback(() => {
      onPageChange(currentPage + 1);
    }, [onPageChange, currentPage]);

    const handleLastPage = useCallback(() => {
      onPageChange(totalPages);
    }, [onPageChange, totalPages]);

    const getSortIcon = useCallback(
      (field: string) => {
        if (sortField !== field) {
          return (
            <IconSortVertical className="size-4 ml-1 inline text-muted-foreground/50" />
          );
        }
        return sortDirection === "asc" ? (
          <IconSortVertical
            duotone
            className="size-4 ml-1 inline text-primary"
          />
        ) : (
          <IconSortVertical
            duotone
            className="size-4 ml-1 inline rotate-180 text-primary"
          />
        );
      },
      [sortField, sortDirection],
    );

    // Helper function to get column style with memoized width.
    // flexGrow/flexBasis let columns expand to fill available table width;
    // minWidth (measured content) forces horizontal scroll when space is tight.
    const getColumnStyle = useCallback(
      (columnName: string) => ({
        flexGrow: 1,
        flexBasis: 0,
        minWidth: columnWidths[columnName]
          ? `${columnWidths[columnName]}px`
          : undefined,
      }),
      [columnWidths],
    );

    return (
      <>
        <CardContent className="p-0! light:bg-muted/50">
          {/* Filters Display Section */}
          <div className="flex justify-between p-4 bg-background dark:bg-muted/30">
            <div className="flex items-center gap-2 *:font-mono">
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
                  {sortField === "serialNumber" && "Serial Number"}
                  {sortField === "installerCode" && "Installer Code"}
                  {sortField === "installer" && "Installer Name"}
                  {sortField === "productModel" && "Product Model"}
                  {sortField === "cityOfInstallation" && "City"}
                  {sortField === "rewardAmount" && "Amount"}
                  {sortField === "rewardStatus" && "Status"}
                  {sortField === "sendingDate" && "Sending Date"}
                  {sortField === "referrerRewardAmount" && "Referrer Reward"}
                  {sortField === "createdAt" && "Registered"}
                  {sortField === "updatedAt" && "Updated"}
                  <IconClose
                    className={cn(
                      "size-4!",
                      sortField === "createdAt" && sortDirection === "desc"
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer",
                    )}
                    onClick={() => {
                      if (
                        sortField !== "createdAt" ||
                        sortDirection !== "desc"
                      ) {
                        onToggleSort("createdAt");
                      }
                    }}
                  />
                </Badge>
              </div>

              {/* Date Range - Always Show */}
              {filters?.dateRange && (
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
                          : "cursor-pointer",
                      )}
                      onClick={() => {
                        if (filters.dateRange !== "all") {
                          onClearFilter?.("dateRange");
                        }
                      }}
                    />
                  </Badge>
                </div>
              )}

              {/* Reward Status Filter */}
              {filters?.rewardStatus && filters.rewardStatus !== "ALL" && (
                <div className="text-xs flex items-center gap-1 text-muted-foreground">
                  Reward Status:
                  <Badge
                    variant="outline"
                    className="gap-1 [&>svg]:pointer-events-auto h-5.5"
                    id="filtersRewardStatus"
                  >
                    {filters.rewardStatus}
                    <IconClose
                      className="size-4! cursor-pointer"
                      onClick={() => onClearFilter?.("rewardStatus")}
                    />
                  </Badge>
                </div>
              )}

              {/* Payment Method Filter */}
              {filters?.paymentMethod && filters.paymentMethod !== "all" && (
                <div className="text-xs flex items-center gap-1 text-muted-foreground">
                  Payment Method:
                  <Badge
                    variant="outline"
                    className="gap-1 [&>svg]:pointer-events-auto h-5.5"
                    id="filtersPaymentMethod"
                  >
                    {filters.paymentMethod}
                    <IconClose
                      className="size-4! cursor-pointer"
                      onClick={() => onClearFilter?.("paymentMethod")}
                    />
                  </Badge>
                </div>
              )}

              {/* Product Model Filter */}
              {filters?.productModel && filters.productModel !== "all" && (
                <div className="text-xs flex items-center gap-1 text-muted-foreground">
                  Product Model:
                  <Badge
                    variant="outline"
                    className="gap-1 [&>svg]:pointer-events-auto h-5.5"
                    id="filtersProductModel"
                  >
                    {filters.productModel}
                    <IconClose
                      className="size-4! cursor-pointer"
                      onClick={() => onClearFilter?.("productModel")}
                    />
                  </Badge>
                </div>
              )}

              {/* Team Member Filter */}
              {filters?.teamMember && filters.teamMember !== "all" && (
                <div className="text-xs flex items-center gap-1 text-muted-foreground">
                  Registered By:
                  <Badge
                    variant="outline"
                    className="gap-1 [&>svg]:pointer-events-auto h-5.5"
                    id="filtersTeamMember"
                  >
                    {getTeamMemberName(filters.teamMember)}
                    <IconClose
                      className="size-4! cursor-pointer"
                      onClick={() => onClearFilter?.("teamMember")}
                    />
                  </Badge>
                </div>
              )}

              {/* Team Member Filter */}
              {filters?.teamMember && filters.teamMember !== "all" && (
                <div className="text-xs flex items-center gap-1 text-muted-foreground">
                  Registered By:
                  <Badge
                    variant="outline"
                    className="gap-1 [&>svg]:pointer-events-auto h-5.5"
                    id="filtersTeamMember"
                  >
                    {getTeamMemberName(filters.teamMember)}
                    <IconClose
                      className="size-4! cursor-pointer"
                      onClick={() => onClearFilter?.("teamMember")}
                    />
                  </Badge>
                </div>
              )}

              {/* Sending Date Filter */}
              {filters?.sendingDate && (
                <div className="text-xs flex items-center gap-1 text-muted-foreground">
                  Sending Date:
                  <Badge
                    variant="outline"
                    className="gap-1 [&>svg]:pointer-events-auto h-5.5"
                    id="filtersSendingDate"
                  >
                    {new Date(filters.sendingDate).toLocaleDateString()}
                    <IconClose
                      className="size-4! cursor-pointer"
                      onClick={() => onClearFilter?.("sendingDate")}
                    />
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* FILTERS */}
          <Activity mode={showFilters ? "visible" : "hidden"}>
            <CardContent className="p-4 flex items-center gap-2 ">
              {/* Reward Status Filter */}
              <div className="space-y-2 w-full">
                <span className="text-sm px-2">Reward Status</span>
                <Select
                  value={filters?.rewardStatus || "ALL"}
                  onValueChange={(value) =>
                    onFilterChange?.("rewardStatus", value)
                  }
                  name="rewardStatusSelect"
                  disabled={loading}
                >
                  <SelectTrigger className="h-9 bg-muted/40 hover:bg-muted/60 transition-colors data-[state=open]:bg-muted/80">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Installation Date Filter */}
              <div className="space-y-2 w-full">
                <span className="text-sm px-2">Installation Date</span>
                <Input
                  type="month"
                  value={filters?.installationDate || ""}
                  onChange={(e) =>
                    onFilterChange?.("installationDate", e.target.value)
                  }
                  className="h-9 bg-muted/40 hover:bg-muted/60 transition-colors"
                  disabled={loading}
                />
              </div>

              {/* Product Model Filter */}
              <div className="space-y-2 w-full">
                <span className="text-sm px-2">Product Model</span>
                <Select
                  value={filters?.productModel || "all"}
                  onValueChange={(value) =>
                    onFilterChange?.("productModel", value)
                  }
                  name="productModelSelect"
                  disabled={loading}
                >
                  <SelectTrigger className="h-9 bg-muted/40 hover:bg-muted/60 transition-colors data-[state=open]:bg-muted/80">
                    <SelectValue placeholder="All Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {uniqueValues?.productModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Team Member Filter */}
              <div className="space-y-2 w-full">
                <span className="text-sm px-2">Registered By</span>
                <Select
                  value={filters?.teamMember || "all"}
                  onValueChange={(value) =>
                    onFilterChange?.("teamMember", value)
                  }
                  name="teamMemberSelect"
                  disabled={loading}
                >
                  <SelectTrigger className="h-9 bg-muted/40 hover:bg-muted/60 transition-colors data-[state=open]:bg-muted/80">
                    <SelectValue placeholder="All Team Members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Team Members</SelectItem>
                    {teamMembers?.map((member) => (
                      <SelectItem key={member._id} value={member._id}>
                        {member.name}{" "}
                        <span className="text-xs text-muted-foreground">
                          {member.email}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <span className="text-sm px-2">Reset Filters</span>
                {/* FILTER CLEAR BUTTON */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearAllFilters}
                  disabled={
                    (filters?.rewardStatus === "ALL" &&
                      filters?.paymentMethod === "all" &&
                      filters?.installationDate === "" &&
                      filters?.productModel === "all" &&
                      filters?.teamMember === "all" &&
                      filters?.dateRange === "all" &&
                      sortField === "createdAt" &&
                      sortDirection === "desc") ||
                    loading
                  }
                  className="min-w-fit gap-1.5 pl-1"
                >
                  <IconClose />
                  Reset All
                </Button>
              </div>
            </CardContent>
          </Activity>

          {/* REWARDS DATATABLE with Virtual Scrolling */}
          <div
            className="overflow-auto"
            style={{ maxHeight: "715px" }}
            ref={parentRef}
          >
            <div
              ref={measureRef}
              className="w-full"
              style={
                !loading && measuredColumnCount > 0
                  ? { minWidth: `${totalColumnsWidth}px` }
                  : undefined
              }
            >
              {/* Sticky Header */}
              <div className="sticky top-0 z-10">
                <div
                  className={cn(
                    "flex w-full bg-background dark:bg-muted/50 text-muted-foreground backdrop-blur-xl border-b border-border relative font-mono",
                    loading && "overflow-hidden",
                    !loading && "w-full",
                  )}
                >
                  <div className="w-12 px-4 py-3 text-sm font-medium flex items-center justify-center shrink-0">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={onToggleSelectAll}
                      aria-label="Select all rewards on this page"
                    />
                  </div>
                  <div
                    data-column="installer"
                    className="px-4 py-3 text-sm font-medium cursor-pointer whitespace-nowrap select-none hover:text-foreground transition-colors"
                    onClick={() => onToggleSort("installer")}
                    style={getColumnStyle("installer")}
                  >
                    Installer{getSortIcon("installer")}
                  </div>
                  <div
                    data-column="product"
                    className="px-4 py-3 text-sm font-medium whitespace-nowrap select-none"
                    style={getColumnStyle("product")}
                  >
                    Product
                  </div>
                  <div
                    data-column="location"
                    className="px-4 py-3 text-sm font-medium cursor-pointer whitespace-nowrap select-none transition-colors hover:text-foreground"
                    onClick={() => onToggleSort("cityOfInstallation")}
                    style={getColumnStyle("location")}
                  >
                    Location{getSortIcon("cityOfInstallation")}
                  </div>
                  <div
                    data-column="installerReward"
                    className="px-4 py-3 text-sm font-medium whitespace-nowrap select-none"
                    style={getColumnStyle("installerReward")}
                  >
                    Reward
                  </div>
                  <div
                    data-column="rewardStatus"
                    className="px-4 py-3 text-sm font-medium cursor-pointer whitespace-nowrap select-none transition-colors hover:text-foreground"
                    onClick={() => onToggleSort("rewardStatus")}
                    style={getColumnStyle("rewardStatus")}
                  >
                    Status{getSortIcon("rewardStatus")}
                  </div>
                  {/* <div
                    data-column="payment"
                    className="px-4 py-3 text-sm font-medium whitespace-nowrap select-none"
                    style={getColumnStyle("payment")}
                  >
                    Payment
                  </div> */}
                  {/* <div
                    data-column="referrer"
                    className="px-4 py-3 text-sm font-medium whitespace-nowrap select-none"
                    style={getColumnStyle("referrer")}
                  >
                    Referrer
                  </div>
                  <div
                    data-column="referrerReward"
                    className="px-4 py-3 text-sm font-medium whitespace-nowrap select-none"
                    style={getColumnStyle("referrerReward")}
                  >
                    Referrer Reward
                  </div> */}
                  <div
                    data-column="registeredBy"
                    className="px-4 py-3 text-sm font-medium cursor-pointer whitespace-nowrap select-none transition-colors hover:text-foreground"
                    style={getColumnStyle("registeredBy")}
                    onClick={() => onToggleSort("createdAt")}
                  >
                    Registered{getSortIcon("createdAt")}
                  </div>
                  {/* <div
                    data-column="updatedBy"
                    className="px-4 py-3 text-sm font-medium cursor-pointer whitespace-nowrap select-none transition-colors hover:text-foreground"
                    style={getColumnStyle("updatedBy")}
                    onClick={() => onToggleSort("updatedAt")}
                  >
                    Updated{getSortIcon("updatedAt")}
                  </div> */}
                  <div
                    className={cn(
                      "px-4 py-3 text-sm font-medium whitespace-nowrap select-none",
                      loading ? "flex-1" : "w-32 shrink-0",
                    )}
                  >
                    Actions
                  </div>
                </div>
              </div>

              {/* Virtual Scrolling Container */}
              {loading ? (
                <div style={{ height: "400px", position: "relative" }}>
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex w-full border-b border-border"
                      style={{ height: "65px" }}
                    >
                      {/* Checkbox */}
                      <div className="w-12 px-4 py-3 flex items-center justify-center shrink-0">
                        <div className="h-4 w-4 bg-muted rounded-sm animate-pulse" />
                      </div>

                      {/* Installer */}
                      <div
                        className="px-4 py-3 text-sm flex items-center whitespace-nowrap gap-2"
                        style={getColumnStyle("installer")}
                      >
                        <div className="h-8 w-8 bg-muted rounded-full animate-pulse shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-16 animate-pulse" />
                        </div>
                      </div>

                      {/* Product */}
                      <div
                        className="px-4 py-3 text-sm flex items-center whitespace-nowrap"
                        style={getColumnStyle("product")}
                      >
                        <div className="space-y-1.5">
                          <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-24 animate-pulse" />
                        </div>
                      </div>

                      {/* Location */}
                      <div
                        className="px-4 py-3 text-sm flex items-center whitespace-nowrap"
                        style={getColumnStyle("location")}
                      >
                        <div className="space-y-1.5">
                          <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-16 animate-pulse" />
                        </div>
                      </div>

                      {/* Installer Reward */}
                      <div
                        className="px-4 py-3 text-sm flex items-center whitespace-nowrap"
                        style={getColumnStyle("installerReward")}
                      >
                        <div className="space-y-1.5">
                          <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-24 animate-pulse" />
                        </div>
                      </div>

                      {/* Reward Status */}
                      <div
                        className="px-4 py-3 items-center"
                        style={getColumnStyle("rewardStatus")}
                      >
                        <div className="h-5 bg-muted rounded-full w-16 animate-pulse" />
                      </div>

                      {/* Payment */}
                      {/* <div
                        className="px-4 py-3 text-sm flex items-center whitespace-nowrap"
                        style={getColumnStyle("payment")}
                      >
                        <div className="space-y-1.5">
                          <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-16 animate-pulse" />
                        </div>
                      </div> */}

                      {/* Referrer */}
                      {/* <div
                        className="px-4 py-3 text-sm flex items-center whitespace-nowrap gap-2"
                        style={getColumnStyle("referrer")}
                      >
                        <div className="h-8 w-8 bg-muted rounded-full animate-pulse shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-16 animate-pulse" />
                        </div>
                      </div> */}

                      {/* Referrer Reward */}
                      {/* <div
                        className="px-4 py-3 text-sm flex items-center whitespace-nowrap"
                        style={getColumnStyle("referrerReward")}
                      >
                        <div className="space-y-1.5">
                          <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-24 animate-pulse" />
                        </div>
                      </div> */}

                      {/* Registered By */}
                      <div
                        className="px-4 py-3 text-sm flex items-center whitespace-nowrap"
                        style={getColumnStyle("registeredBy")}
                      >
                        <div className="space-y-1.5">
                          <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-20 animate-pulse" />
                        </div>
                      </div>

                      {/* Updated By */}
                      {/* <div
                        className="px-4 py-3 text-sm flex items-center whitespace-nowrap"
                        style={getColumnStyle("updatedBy")}
                      >
                        <div className="space-y-1.5">
                          <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-20 animate-pulse" />
                        </div>
                      </div> */}

                      {/* Actions */}
                      <div className="flex-1 px-4 py-3 text-sm flex items-center gap-4">
                        <div className="size-5 bg-muted rounded animate-pulse" />
                        <div className="size-5 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : totalRewards === 0 ? (
                <div className="w-full h-[400px] flex items-center justify-between p-0">
                  <div className="w-full place-items-center p-0">
                    <EmptyState
                      title="No Products Registered"
                      description="You can register a new product to add in rewards."
                      icons={[IconActivity]}
                      className="w-full border-none rounded-none"
                      action={{
                        label: (
                          <div className="flex items-center gap-2">
                            Register Product
                            <IconAdd />
                          </div>
                        ),
                        onClick: () => router.push("/rewards/register"),
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    position: "relative",
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const reward = rewards[virtualRow.index];
                    const isSelected = selectedRewards.has(reward._id);

                    return (
                      <div
                        key={virtualRow.key}
                        id={`reward-${reward._id}`}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="flex items-center w-full border-b border-border transition-colors hover:bg-muted/30"
                      >
                        <div className="w-12 px-4 py-3 text-sm flex items-center justify-center shrink-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              onToggleSelection(reward._id)
                            }
                            aria-label={`Select ${reward.serialNumber}`}
                          />
                        </div>
                        <div
                          data-column="installer"
                          className="px-4 py-3 text-sm flex items-center whitespace-nowrap gap-2"
                          style={getColumnStyle("installer")}
                        >
                          <InstallerAvatar user={reward.installer?.fullName} />
                          <div>
                            <div>
                              {reward.installer?.fullName || <Unavailable />}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center font-mono">
                              {reward.installerCode}
                              <CopyButton
                                text={reward.installerCode}
                                label="Installer Code"
                                className="size-3.5! ml-1.5"
                              />
                            </div>
                          </div>
                        </div>
                        <div
                          data-column="product"
                          className="px-4 py-3 text-sm flex items-center whitespace-nowrap"
                          style={getColumnStyle("product")}
                        >
                          <div>
                            <div
                              className="flex items-center cursor-pointer font-medium font-mono"
                              onClick={() =>
                                router.push(`/rewards/${reward._id}`)
                              }
                            >
                              {reward.serialNumber}
                              <CopyButton
                                text={reward.serialNumber}
                                label="Serial Number"
                                className="size-3.5! ml-1.5"
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {reward.productModel || <Unavailable />}
                            </div>
                          </div>
                        </div>
                        <div
                          data-column="location"
                          className="px-4 py-3 text-sm flex items-center whitespace-nowrap"
                          style={getColumnStyle("location")}
                        >
                          <div>
                            <div>{reward.cityOfInstallation}</div>
                            <div className="text-xs text-muted-foreground">
                              {reward.installer?.district}
                            </div>
                          </div>
                        </div>
                        <div
                          data-column="installerReward"
                          className="px-4 py-3 text-sm flex items-center whitespace-nowrap"
                          style={getColumnStyle("installerReward")}
                        >
                          <div>
                            <div className="font-mono">
                              <span className="text-xs">Rs.</span>{" "}
                              {reward.rewardAmount.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {reward.transactionId ? (
                                <div className="flex items-center">
                                  {reward.transactionId}
                                  <CopyButton
                                    text={reward.transactionId}
                                    label="Transaction ID"
                                    className="size-3.5! ml-1.5"
                                  />
                                </div>
                              ) : (
                                <Unavailable prefix="TID: " />
                              )}
                            </div>
                          </div>
                        </div>
                        <div
                          data-column="rewardStatus"
                          className="px-4 py-3 items-center"
                          style={getColumnStyle("rewardStatus")}
                        >
                          <Badge
                            variant={
                              reward.rewardStatus === "PAID"
                                ? "success"
                                : reward.rewardStatus === "PENDING"
                                  ? "warning"
                                  : "destructive"
                            }
                          >
                            {reward.rewardStatus}
                          </Badge>
                        </div>
                        {/* <div
                          data-column="payment"
                          className="px-4 py-3 text-sm flex items-center whitespace-nowrap"
                          style={getColumnStyle("payment")}
                        >
                          <div>
                            <div>{reward.paymentMethod || <Unavailable />}</div>
                            <div className="text-xs text-muted-foreground">
                              {reward.sendingDate ? (
                                new Date(
                                  reward.sendingDate,
                                ).toLocaleDateString()
                              ) : (
                                <Unavailable />
                              )}
                            </div>
                          </div>
                        </div> */}
                        {/* <div
                          data-column="referrer"
                          className="px-4 py-3 text-sm flex items-center whitespace-nowrap gap-2"
                          style={getColumnStyle("referrer")}
                        >
                          {reward.referrer ? (
                            <>
                              <InstallerAvatar
                                user={reward.referrer?.fullName}
                              />
                              <div>
                                <div>
                                  {reward.referrer?.fullName || <Unavailable />}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center">
                                  {reward.referrer?.installerCode}
                                  <CopyButton
                                    text={reward.referrer?.installerCode}
                                    label="Installer Code"
                                    className="size-3.5! ml-1.5"
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            <Unavailable title="No Referrer" />
                          )}
                        </div>
                        <div
                          data-column="referrerReward"
                          className="px-4 py-3 text-sm flex items-center whitespace-nowrap"
                          style={getColumnStyle("referrerReward")}
                        >
                          {reward.referrer ? (
                            <div>
                              <div>
                                {reward.referrerRewardAmount
                                  ? `Rs. ${reward.referrerRewardAmount.toLocaleString()}`
                                  : "N/A"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {reward.referrerTransactionId ? (
                                  <div className="flex items-center">
                                    {reward.referrerTransactionId}
                                    <CopyButton
                                      text={reward.referrerTransactionId}
                                      label="Referrer Transaction ID"
                                    />
                                  </div>
                                ) : (
                                  "N/A"
                                )}
                              </div>
                            </div>
                          ) : (
                            <Unavailable title="No Referrer" />
                          )}
                        </div> */}

                        <div
                          data-column="registeredBy"
                          className="px-4 py-3 text-sm flex items-center whitespace-nowrap"
                          style={getColumnStyle("registeredBy")}
                        >
                          <div>
                            <div>
                              {reward.registeredBy?.name || "Unavailable"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(reward.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {/* <div
                          data-column="updatedBy"
                          className="px-4 py-3 text-sm flex items-center whitespace-nowrap"
                          style={getColumnStyle("updatedBy")}
                        >
                          {reward.updatedAt !== reward.createdAt ? (
                            <div>
                              <div>
                                {reward.updatedBy?.name || <Unavailable />}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {reward.updatedAt ? (
                                  new Date(
                                    reward.updatedAt,
                                  ).toLocaleDateString()
                                ) : (
                                  <Unavailable />
                                )}
                              </div>
                            </div>
                          ) : (
                            <Unavailable title="Never Updated" />
                          )}
                        </div> */}
                        <div className="w-32 px-4 py-3 text-sm flex items-center gap-4 shrink-0">
                          <button
                            onClick={() => onEditClick(reward._id)}
                            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <IconEdit2 className="size-5" />
                          </button>
                          <button
                            onClick={() =>
                              onDeleteClick(reward._id, reward.serialNumber)
                            }
                            className="text-destructive-text hover:text-destructive-text-hover transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <IconTrashBin2 className="size-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4 relative bg-background dark:bg-muted/50 text-xs text-muted-foreground">
          {/* Pagination Controls */}
          <div className="text-sm text-muted-foreground inline-flex items-center gap-1">
            Show
            <Select
              value={String(itemsPerPage)}
              onValueChange={handleItemsPerPageChange}
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
                <SelectItem className="h-6" value="500">
                  500
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
                onClick={handleFirstPage}
                disabled={currentPage === 1 || loading || totalRewards === 0}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || loading || totalRewards === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPage}
                disabled={
                  currentPage === totalPages || loading || totalRewards === 0
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLastPage}
                disabled={
                  currentPage === totalPages || loading || totalRewards === 0
                }
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
            Showing {startIndex > 0 ? startIndex + 1 : totalRewards > 0 ? 1 : 0}
            -{Math.min(endIndex, totalRewards)} of {totalRewards} results
            {totalRewards !== totalUnfilteredRewards && (
              <span className="ml-1">
                (filtered from {totalUnfilteredRewards} total)
              </span>
            )}
          </div>
        </CardFooter>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-20 flex items-center justify-center pointer-events-none">
          {selectedRewards.size > 0 && (
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
                  "border border-border rounded-2xl p-2 flex items-center gap-2 relative bg-background/40 backdrop-blur-xs pointer-events-auto",
                )}
              >
                <div className="px-4 py-3 bg-background rounded-xl flex items-center justify-center leading-none select-none">
                  Selected: {selectedRewards.size}
                </div>
                <Button
                  variant="destructive"
                  size={"icon"}
                  disabled={bulkDeleting}
                  className="gap-1"
                  onClick={onOpenBulkDeleteDialog}
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
      </>
    );
  },
);

RewardsTable.displayName = "RewardsTable";
