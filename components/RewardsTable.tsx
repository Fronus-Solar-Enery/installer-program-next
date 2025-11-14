import React, { Activity, useCallback, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion, AnimatePresence } from "framer-motion";
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
  lastUpdatedText: string;
  filters?: {
    search?: string;
    rewardStatus?: string;
    sendingDate?: string;
    paymentMethod?: string;
    serialNumberStatus?: string;
    productModel?: string;
    teamMember?: string;
    dateRange?: "all" | "today" | "week" | "month" | "year" | "custom";
    customStartDate?: string;
    customEndDate?: string;
  };
  teamMembers?: TeamMember[];
  uniqueValues?: {
    paymentMethods: string[];
    serialNumberStatuses: string[];
    productModels: string[];
  };
  onToggleColumn: (column: keyof ColumnVisibility) => void;
  onToggleSort: (field: string) => void;
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: () => void;
  onEditClick: (id: string) => void;
  onDeleteClick: (id: string, serialNumber: string) => void;
  onBulkDelete: () => void;
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
    onPageChange,
    onItemsPerPageChange,
    onClearFilter,
    onFilterChange,
    onClearAllFilters,
  }) => {
    const router = useRouter();
    const [showFilters, setShowFilters] = useState(false);

    // Virtual scrolling ref for large datasets
    const parentRef = useRef<HTMLDivElement>(null);

    // Virtual scrolling setup
    const rowVirtualizer = useVirtualizer({
      count: rewards.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 65, // Estimated row height in pixels
      overscan: 5, // Number of items to render outside of visible area
    });

    // Get team member name by ID
    const getTeamMemberName = useCallback(
      (teamMemberId: string) => {
        const member = teamMembers?.find((m) => m._id === teamMemberId);
        return member ? `${member.name} (${member.email})` : "Team Member";
      },
      [teamMembers]
    );

    const activeColumnsLength = useMemo(
      () => Object.values(visibleColumns).filter(Boolean).length,
      [visibleColumns]
    );

    const allSelected = useMemo(
      () =>
        rewards.length > 0 && rewards.every((r) => selectedRewards.has(r._id)),
      [rewards, selectedRewards]
    );

    // Pagination calculations
    const totalPages = useMemo(
      () => Math.ceil(totalRewards / itemsPerPage),
      [totalRewards, itemsPerPage]
    );

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Pagination handlers
    const handleItemsPerPageChange = useCallback(
      (value: string) => {
        onItemsPerPageChange(Number(value));
      },
      [onItemsPerPageChange]
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
      [sortField, sortDirection]
    );

    return (
      <>
        <CardContent className="p-0! light:bg-muted/50">
          {/* Filters Display Section */}
          <div className="flex justify-between p-4 bg-muted/30">
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
                    {sortField === "serialNumber" && "Serial Number"}
                    {sortField === "installerCode" && "Installer Code"}
                    {sortField === "installer" && "Installer Name"}
                    {sortField === "productModel" && "Product Model"}
                    {sortField === "cityOfInstallation" && "City"}
                    {sortField === "rewardAmount" && "Amount"}
                    {sortField === "rewardStatus" && "Status"}
                    {sortField === "sendingDate" && "Sending Date"}
                    {sortField === "referrerRewardAmount" && "Referrer Reward"}
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
                            : "cursor-pointer"
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
                    >
                      {filters.paymentMethod}
                      <IconClose
                        className="size-4! cursor-pointer"
                        onClick={() => onClearFilter?.("paymentMethod")}
                      />
                    </Badge>
                  </div>
                )}

                {/* Serial Number Status Filter */}
                {filters?.serialNumberStatus &&
                  filters.serialNumberStatus !== "all" && (
                    <div className="text-xs flex items-center gap-1 text-muted-foreground">
                      Serial Status:
                      <Badge
                        variant="outline"
                        className="gap-1 [&>svg]:pointer-events-auto h-5.5"
                      >
                        {filters.serialNumberStatus}
                        <IconClose
                          className="size-4! cursor-pointer"
                          onClick={() => onClearFilter?.("serialNumberStatus")}
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
                    {showFilters ? "Hide" : "Show"} Filters
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
                      <div className="flex items-center justify-between pl-2 pr-4 pb-2 text-sm text-muted-foreground">
                        Columns Visibility
                        {/* Toggle All Checkbox */}
                        <Checkbox
                          checked={
                            Object.values(visibleColumns).every(Boolean)
                              ? true
                              : Object.values(visibleColumns).some(Boolean)
                              ? "indeterminate"
                              : false
                          }
                          onCheckedChange={(checked) => {
                            // Convert Radix `CheckedState` ("indeterminate" | boolean) to boolean
                            const isChecked = checked === true;

                            if (isChecked) {
                              // ✅ Turn ON all columns
                              Object.entries(visibleColumns).forEach(
                                ([key, value]) => {
                                  if (!value)
                                    onToggleColumn(
                                      key as keyof ColumnVisibility
                                    );
                                }
                              );
                            } else {
                              // 🔄 Restore default columns instead of unchecking all
                              const defaultColumns: Partial<ColumnVisibility> =
                                {
                                  installer: true,
                                  serialNumber: true,
                                  productModel: true,
                                  rewardAmount: true,
                                  rewardStatus: true,
                                  sendingDate: true,
                                };

                              Object.entries(visibleColumns).forEach(
                                ([key, value]) => {
                                  const shouldBeVisible =
                                    key in defaultColumns
                                      ? defaultColumns[
                                          key as keyof ColumnVisibility
                                        ]
                                      : false;

                                  if (value !== shouldBeVisible) {
                                    onToggleColumn(
                                      key as keyof ColumnVisibility
                                    );
                                  }
                                }
                              );
                            }
                          }}
                        />
                      </div>
                      <ScrollArea className="h-72 pr-2 rounded-xl">
                        <div className="space-y-1 w-[98%] bg-background p-1">
                          {Object.entries(visibleColumns).map(
                            ([key, value]) => (
                              <Label
                                key={key}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent transition-colors whitespace-nowrap",
                                  value && "bg-accent"
                                )}
                              >
                                <Checkbox
                                  checked={value}
                                  onCheckedChange={() =>
                                    onToggleColumn(
                                      key as keyof ColumnVisibility
                                    )
                                  }
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
              {/* Reward Status Filter */}
              <div className="space-y-2 w-full">
                <span className="text-sm px-2">Reward Status</span>
                <Select
                  value={filters?.rewardStatus || "ALL"}
                  onValueChange={(value) =>
                    onFilterChange?.("rewardStatus", value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="bg-muted/40 hover:bg-muted/60 transition-colors data-[state=open]:bg-muted/80">
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

              {/* Payment Method Filter */}
              <div className="space-y-2 w-full">
                <span className="text-sm px-2">Payment Method</span>
                <Select
                  value={filters?.paymentMethod || "all"}
                  onValueChange={(value) =>
                    onFilterChange?.("paymentMethod", value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="bg-muted/40 hover:bg-muted/60 transition-colors data-[state=open]:bg-muted/80">
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    {uniqueValues?.paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Serial Number Status Filter */}
              <div className="space-y-2 w-full">
                <span className="text-sm px-2">Serial Number Status</span>
                <Select
                  value={filters?.serialNumberStatus || "all"}
                  onValueChange={(value) =>
                    onFilterChange?.("serialNumberStatus", value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="bg-muted/40 hover:bg-muted/60 transition-colors data-[state=open]:bg-muted/80">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {uniqueValues?.serialNumberStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product Model Filter */}
              <div className="space-y-2 w-full">
                <span className="text-sm px-2">Product Model</span>
                <Select
                  value={filters?.productModel || "all"}
                  onValueChange={(value) =>
                    onFilterChange?.("productModel", value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="bg-muted/40 hover:bg-muted/60 transition-colors data-[state=open]:bg-muted/80">
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
                  disabled={loading}
                >
                  <SelectTrigger className="bg-muted/40 hover:bg-muted/60 transition-colors data-[state=open]:bg-muted/80">
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
                  onClick={onClearAllFilters}
                  disabled={
                    (filters?.rewardStatus === "ALL" &&
                      filters?.paymentMethod === "all" &&
                      filters?.serialNumberStatus === "all" &&
                      filters?.productModel === "all" &&
                      filters?.teamMember === "all" &&
                      filters?.dateRange === "all" &&
                      sortField === "createdAt" &&
                      sortDirection === "desc") ||
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
          {/* REWARDS DATATABLE with Virtual Scrolling */}
          <div className="overflow-hidden">
            {/* Table Header - Fixed */}
            <div className="bg-muted/50 border-b border-border sticky top-0 z-10">
              <div className="flex w-full">
                <div className="w-12 px-4 py-3 text-sm font-semibold flex items-center justify-center flex-shrink-0">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={onToggleSelectAll}
                    aria-label="Select all rewards on this page"
                  />
                </div>
                {visibleColumns.installerCode && (
                  <div
                    className="flex-1 min-w-[140px] px-4 py-3 text-sm font-semibold cursor-pointer"
                    onClick={() => onToggleSort("installerCode")}
                  >
                    Installer Code {getSortIcon("installerCode")}
                  </div>
                )}
                {visibleColumns.installer && (
                  <div
                    className="flex-1 min-w-[160px] px-4 py-3 text-sm font-semibold cursor-pointer"
                    onClick={() => onToggleSort("installer")}
                  >
                    Installer Name {getSortIcon("installer")}
                  </div>
                )}
                {visibleColumns.serialNumber && (
                  <div
                    className="flex-1 min-w-[140px] px-4 py-3 text-sm font-semibold cursor-pointer"
                    onClick={() => onToggleSort("serialNumber")}
                  >
                    Serial Number {getSortIcon("serialNumber")}
                  </div>
                )}
                {visibleColumns.productModel && (
                  <div
                    className="flex-1 min-w-[180px] px-4 py-3 text-sm font-semibold cursor-pointer"
                    onClick={() => onToggleSort("productModel")}
                  >
                    Product Model {getSortIcon("productModel")}
                  </div>
                )}
                {visibleColumns.cityOfInstallation && (
                  <div
                    className="flex-1 min-w-[120px] px-4 py-3 text-sm font-semibold cursor-pointer"
                    onClick={() => onToggleSort("cityOfInstallation")}
                  >
                    City {getSortIcon("cityOfInstallation")}
                  </div>
                )}
                {visibleColumns.rewardAmount && (
                  <div
                    className="flex-1 min-w-[110px] px-4 py-3 text-sm font-semibold cursor-pointer"
                    onClick={() => onToggleSort("rewardAmount")}
                  >
                    Amount {getSortIcon("rewardAmount")}
                  </div>
                )}
                {visibleColumns.rewardStatus && (
                  <div
                    className="flex-1 min-w-[110px] px-4 py-3 text-sm font-semibold cursor-pointer"
                    onClick={() => onToggleSort("rewardStatus")}
                  >
                    Status {getSortIcon("rewardStatus")}
                  </div>
                )}
                {visibleColumns.paymentMethod && (
                  <div className="flex-1 min-w-[120px] px-4 py-3 text-sm font-semibold">
                    Payment Method
                  </div>
                )}
                {visibleColumns.transactionId && (
                  <div className="flex-1 min-w-[140px] px-4 py-3 text-sm font-semibold">
                    Transaction ID
                  </div>
                )}
                {visibleColumns.sendingDate && (
                  <div
                    className="flex-1 min-w-[130px] px-4 py-3 text-sm font-semibold cursor-pointer"
                    onClick={() => onToggleSort("sendingDate")}
                  >
                    Sending Date {getSortIcon("sendingDate")}
                  </div>
                )}
                {visibleColumns.inverterSerialNumber && (
                  <div className="flex-1 min-w-[140px] px-4 py-3 text-sm font-semibold">
                    Inverter Serial
                  </div>
                )}
                {visibleColumns.registeredBy && (
                  <div className="flex-1 min-w-[150px] px-4 py-3 text-sm font-semibold">
                    Registered By
                  </div>
                )}
                {visibleColumns.referrerName && (
                  <div className="flex-1 min-w-[130px] px-4 py-3 text-sm font-semibold">
                    Referrer Name
                  </div>
                )}
                {visibleColumns.referrerTransactionId && (
                  <div className="flex-1 min-w-[160px] px-4 py-3 text-sm font-semibold">
                    Referrer Transaction ID
                  </div>
                )}
                {visibleColumns.referrerReward && (
                  <div
                    className="flex-1 min-w-[120px] px-4 py-3 text-sm font-semibold cursor-pointer"
                    onClick={() => onToggleSort("referrerRewardAmount")}
                  >
                    Referrer Reward {getSortIcon("referrerRewardAmount")}
                  </div>
                )}
                <div className="w-32 px-4 py-3 text-sm font-semibold flex-shrink-0">
                  Actions
                </div>
              </div>
            </div>

            {/* Virtual Scrolling Container */}
            {loading ? (
              <div className="overflow-hidden" style={{ height: "650px" }}>
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex w-full border-b border-border animate-pulse"
                    style={{ height: "65px" }}
                  >
                    <div className="w-12 px-4 py-3 flex items-center justify-center flex-shrink-0">
                      <div className="h-4 w-4 bg-muted rounded" />
                    </div>
                    {visibleColumns.installerCode && (
                      <div className="flex-1 min-w-[140px] px-4 py-3 flex items-center">
                        <div className="h-4 bg-muted rounded w-3/4" />
                      </div>
                    )}
                    {visibleColumns.installer && (
                      <div className="flex-1 min-w-[160px] px-4 py-3 flex items-center">
                        <div className="h-4 bg-muted rounded w-2/3" />
                      </div>
                    )}
                    {visibleColumns.serialNumber && (
                      <div className="flex-1 min-w-[140px] px-4 py-3 flex items-center">
                        <div className="h-4 bg-muted rounded w-3/4" />
                      </div>
                    )}
                    {visibleColumns.productModel && (
                      <div className="flex-1 min-w-[180px] px-4 py-3 flex items-center">
                        <div className="h-4 bg-muted rounded w-4/5" />
                      </div>
                    )}
                    {visibleColumns.cityOfInstallation && (
                      <div className="flex-1 min-w-[120px] px-4 py-3 flex items-center">
                        <div className="h-4 bg-muted rounded w-3/5" />
                      </div>
                    )}
                    {visibleColumns.rewardAmount && (
                      <div className="flex-1 min-w-[110px] px-4 py-3 flex items-center">
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                    )}
                    {visibleColumns.rewardStatus && (
                      <div className="flex-1 min-w-[110px] px-4 py-3 flex items-center">
                        <div className="h-5 bg-muted rounded-full w-16" />
                      </div>
                    )}
                    {visibleColumns.paymentMethod && (
                      <div className="flex-1 min-w-[120px] px-4 py-3 flex items-center">
                        <div className="h-4 bg-muted rounded w-3/5" />
                      </div>
                    )}
                    {visibleColumns.transactionId && (
                      <div className="flex-1 min-w-[140px] px-4 py-3 flex items-center">
                        <div className="h-4 bg-muted rounded w-4/5" />
                      </div>
                    )}
                    {visibleColumns.sendingDate && (
                      <div className="flex-1 min-w-[130px] px-4 py-3 flex items-center">
                        <div className="h-4 bg-muted rounded w-3/5" />
                      </div>
                    )}
                    {visibleColumns.inverterSerialNumber && (
                      <div className="flex-1 min-w-[140px] px-4 py-3 flex items-center">
                        <div className="h-4 bg-muted rounded w-3/4" />
                      </div>
                    )}
                    {visibleColumns.registeredBy && (
                      <div className="flex-1 min-w-[150px] px-4 py-3 flex items-center">
                        <div className="h-4 bg-muted rounded w-2/3" />
                      </div>
                    )}
                    {visibleColumns.referrerName && (
                      <div className="flex-1 min-w-[130px] px-4 py-3 flex items-center">
                        <div className="h-4 bg-muted rounded w-2/3" />
                      </div>
                    )}
                    {visibleColumns.referrerTransactionId && (
                      <div className="flex-1 min-w-[160px] px-4 py-3 flex items-center">
                        <div className="h-4 bg-muted rounded w-4/5" />
                      </div>
                    )}
                    {visibleColumns.referrerReward && (
                      <div className="flex-1 min-w-[120px] px-4 py-3 flex items-center">
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                    )}
                    <div className="w-32 px-4 py-3 flex items-center gap-2 flex-shrink-0">
                      <div className="h-8 w-8 bg-muted rounded" />
                      <div className="h-8 w-8 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : totalRewards === 0 ? (
              <Table>
                <TableBody>
                  <TableRow className="p-4 hover:bg-transparent">
                    <TableCell
                      colSpan={activeColumnsLength + 3}
                      className="w-full place-items-center p-0"
                    >
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
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <div
                ref={parentRef}
                className="overflow-auto"
                style={{ height: "650px" }}
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: "100%",
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
                        className="flex w-full border-b border-border transition-colors hover:bg-muted/50"
                      >
                        <div className="w-12 px-4 py-3 text-sm flex items-center justify-center flex-shrink-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              onToggleSelection(reward._id)
                            }
                            aria-label={`Select ${reward.serialNumber}`}
                          />
                        </div>
                        {visibleColumns.installerCode && (
                          <div className="flex-1 min-w-[140px] px-4 py-3 text-sm flex items-center">
                            <div className="flex items-center">
                              {reward.installerCode}
                              <CopyButton
                                text={reward.installerCode}
                                label="Installer Code"
                              />
                            </div>
                          </div>
                        )}
                        {visibleColumns.installer && (
                          <div className="flex-1 min-w-[160px] px-4 py-3 text-sm flex items-center">
                            {reward.installer?.fullName || "N/A"}
                          </div>
                        )}
                        {visibleColumns.serialNumber && (
                          <div className="flex-1 min-w-[140px] px-4 py-3 text-sm flex items-center">
                            <div
                              className="flex items-center cursor-pointer font-medium"
                              onClick={() =>
                                router.push(`/rewards/${reward._id}`)
                              }
                            >
                              {reward.serialNumber}
                              <CopyButton
                                text={reward.serialNumber}
                                label="Serial Number"
                              />
                            </div>
                          </div>
                        )}
                        {visibleColumns.productModel && (
                          <div className="flex-1 min-w-[180px] px-4 py-3 text-sm flex items-center">
                            {reward.productModel}
                          </div>
                        )}
                        {visibleColumns.cityOfInstallation && (
                          <div className="flex-1 min-w-[120px] px-4 py-3 text-sm flex items-center">
                            {reward.cityOfInstallation}
                          </div>
                        )}
                        {visibleColumns.rewardAmount && (
                          <div className="flex-1 min-w-[110px] px-4 py-3 text-sm flex items-center">
                            Rs. {reward.rewardAmount.toLocaleString()}
                          </div>
                        )}
                        {visibleColumns.rewardStatus && (
                          <div className="flex-1 min-w-[110px] px-4 py-3 text-sm flex items-center">
                            <Badge
                              variant={
                                reward.rewardStatus === "PAID"
                                  ? "default"
                                  : reward.rewardStatus === "PENDING"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {reward.rewardStatus}
                            </Badge>
                          </div>
                        )}
                        {visibleColumns.paymentMethod && (
                          <div className="flex-1 min-w-[120px] px-4 py-3 text-sm flex items-center">
                            {reward.paymentMethod || "N/A"}
                          </div>
                        )}
                        {visibleColumns.transactionId && (
                          <div className="flex-1 min-w-[140px] px-4 py-3 text-sm flex items-center">
                            {reward.transactionId ? (
                              <div className="flex items-center">
                                {reward.transactionId}
                                <CopyButton
                                  text={reward.transactionId}
                                  label="Transaction ID"
                                />
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </div>
                        )}
                        {visibleColumns.sendingDate && (
                          <div className="flex-1 min-w-[130px] px-4 py-3 text-sm flex items-center">
                            {reward.sendingDate
                              ? new Date(
                                  reward.sendingDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </div>
                        )}
                        {visibleColumns.inverterSerialNumber && (
                          <div className="flex-1 min-w-[140px] px-4 py-3 text-sm flex items-center">
                            {reward.inverterSerialNumber || "N/A"}
                          </div>
                        )}
                        {visibleColumns.registeredBy && (
                          <div className="flex-1 min-w-[150px] px-4 py-3 text-sm flex items-center">
                            {reward.registeredBy?.name || "N/A"}
                          </div>
                        )}
                        {visibleColumns.referrerName && (
                          <div className="flex-1 min-w-[130px] px-4 py-3 text-sm flex items-center">
                            {reward.referrer?.fullName || "N/A"}
                          </div>
                        )}
                        {visibleColumns.referrerTransactionId && (
                          <div className="flex-1 min-w-[160px] px-4 py-3 text-sm flex items-center">
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
                        )}
                        {visibleColumns.referrerReward && (
                          <div className="flex-1 min-w-[120px] px-4 py-3 text-sm flex items-center">
                            {reward.referrerRewardAmount
                              ? `Rs. ${reward.referrerRewardAmount.toLocaleString()}`
                              : "N/A"}
                          </div>
                        )}
                        <div className="w-32 px-4 py-3 text-sm flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditClick(reward._id)}
                            title="Edit"
                          >
                            <IconEdit2 />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              onDeleteClick(reward._id, reward.serialNumber)
                            }
                            title="Delete"
                          >
                            <IconTrashBin2 className="text-destructive-text" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4 relative bg-muted dark:bg-muted/50 text-xs text-muted-foreground">
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
                  "border border-border rounded-2xl p-2 flex items-center gap-2 relative bg-background/40 backdrop-blur-xs pointer-events-auto"
                )}
              >
                <div className="px-4 py-3 bg-background rounded-xl flex items-center justify-center leading-none select-none">
                  Selected: {selectedRewards.size}
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
                        <IconTrashBin2 width={2} />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-4xl">
                    <AlertDialogHeader className="flex flex-col items-center">
                      <IconTrashBin2
                        className="size-32 text-destructive-text"
                        fill
                        opacity={"0.2"}
                        duotone={true}
                      />
                      <AlertDialogTitle>
                        Delete {selectedRewards.size} Reward
                        {selectedRewards.size > 1 ? "s" : ""}?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="w-19/20 flex flex-col items-center text-balance">
                        This will permanently delete the selected rewards.
                        <span className="mt-6 flex gap-2 text-destructive-text">
                          <IconInfoCircle className="size-8" />
                          <span>
                            This action cannot be undone. <br />
                            The rewards will be permanently removed from the
                            database.
                          </span>
                        </span>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                      <AlertDialogAction
                        onClick={onBulkDelete}
                        disabled={bulkDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full rounded-full"
                      >
                        {bulkDeleting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          `Delete ${selectedRewards.size} Reward${
                            selectedRewards.size > 1 ? "s" : ""
                          }`
                        )}
                      </AlertDialogAction>
                      <AlertDialogCancel className="w-full">
                        Cancel
                      </AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </>
    );
  }
);

RewardsTable.displayName = "RewardsTable";
