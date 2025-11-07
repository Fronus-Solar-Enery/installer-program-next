import React, { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";
import {
  IconEdit2,
  IconTrashBin2,
  IconLayer,
  IconActivity,
  IconAdd,
  IconInfoCircle,
} from "@/components/icons";
import { TableSkeleton } from "@/components/TableSkeleton";
import { EmptyState } from "@/components/EmptyState";
import Loading from "@/components/ui/loading";
import { RewardsTableRow } from "./RewardsTableRow";
import type { RewardWithId } from "@/hooks/useOptimizedRewardsFilter";
import type { ColumnVisibility } from "@/hooks/useRewardsState";

interface RewardsTableProps {
  rewards: RewardWithId[];
  totalRewards: number;
  loading: boolean;
  visibleColumns: ColumnVisibility;
  selectedRewards: Set<string>;
  currentPage: number;
  itemsPerPage: number;
  sortField: string;
  sortDirection: "asc" | "desc";
  bulkDeleting: boolean;
  lastUpdatedText: string;
  onToggleColumn: (column: keyof ColumnVisibility) => void;
  onToggleSort: (field: string) => void;
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: () => void;
  onEditClick: (id: string) => void;
  onDeleteClick: (id: string, serialNumber: string) => void;
  onBulkDelete: () => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export const RewardsTable = React.memo<RewardsTableProps>(
  ({
    rewards,
    totalRewards,
    loading,
    visibleColumns,
    selectedRewards,
    currentPage,
    itemsPerPage,
    sortField,
    sortDirection,
    bulkDeleting,
    lastUpdatedText,
    onToggleColumn,
    onToggleSort,
    onToggleSelection,
    onToggleSelectAll,
    onEditClick,
    onDeleteClick,
    onBulkDelete,
    onPageChange,
    onItemsPerPageChange,
  }) => {
    const router = useRouter();

    const activeColumnsLength = useMemo(
      () => Object.values(visibleColumns).filter(Boolean).length,
      [visibleColumns]
    );

    const totalPages = useMemo(
      () => Math.ceil(totalRewards / itemsPerPage),
      [totalRewards, itemsPerPage]
    );

    const allSelected = useMemo(
      () => rewards.length > 0 && rewards.every((r) => selectedRewards.has(r._id)),
      [rewards, selectedRewards]
    );

    const getSortIcon = useCallback(
      (field: string) => {
        if (sortField !== field) {
          return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
        }
        return sortDirection === "asc" ? (
          <ArrowUp className="h-4 w-4 ml-1 inline" />
        ) : (
          <ArrowDown className="h-4 w-4 ml-1 inline" />
        );
      },
      [sortField, sortDirection]
    );

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

    return (
      <Card>
        <CardHeader className="!flex-row items-center justify-between w-full bg-muted">
          <CardTitle className="text-lg font-semibold">
            Rewards & Installations Database
          </CardTitle>
          <div className="flex items-center gap-2">
            <Dropdown>
              <DropdownTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Columns
                  <IconLayer width={2} />
                </Button>
              </DropdownTrigger>
              <DropdownContent className="w-54 p-2 pr-0.5">
                <div className="px-2 pb-2 text-sm text-muted-foreground">
                  Columns Visibility
                </div>
                <ScrollArea className="h-72 pr-2 rounded-xl">
                  <div className="space-y-1 w-[98%] bg-background p-1">
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
                          onCheckedChange={() =>
                            onToggleColumn(key as keyof ColumnVisibility)
                          }
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
          <div className="border border-border rounded-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="text-center w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={onToggleSelectAll}
                      aria-label="Select all rewards on this page"
                    />
                  </TableHead>
                  {visibleColumns.serialNumber && (
                    <TableHead
                      className="cursor-pointer font-semibold"
                      onClick={() => onToggleSort("serialNumber")}
                    >
                      Serial Number {getSortIcon("serialNumber")}
                    </TableHead>
                  )}
                  {visibleColumns.installerCode && (
                    <TableHead
                      className="cursor-pointer font-semibold"
                      onClick={() => onToggleSort("installerCode")}
                    >
                      Installer Code {getSortIcon("installerCode")}
                    </TableHead>
                  )}
                  {visibleColumns.installer && (
                    <TableHead
                      className="cursor-pointer font-semibold"
                      onClick={() => onToggleSort("installer")}
                    >
                      Installer Name {getSortIcon("installer")}
                    </TableHead>
                  )}
                  {visibleColumns.productModel && (
                    <TableHead
                      className="cursor-pointer font-semibold"
                      onClick={() => onToggleSort("productModel")}
                    >
                      Product Model {getSortIcon("productModel")}
                    </TableHead>
                  )}
                  {visibleColumns.cityOfInstallation && (
                    <TableHead
                      className="cursor-pointer font-semibold"
                      onClick={() => onToggleSort("cityOfInstallation")}
                    >
                      City {getSortIcon("cityOfInstallation")}
                    </TableHead>
                  )}
                  {visibleColumns.rewardAmount && (
                    <TableHead
                      className="cursor-pointer font-semibold"
                      onClick={() => onToggleSort("rewardAmount")}
                    >
                      Amount {getSortIcon("rewardAmount")}
                    </TableHead>
                  )}
                  {visibleColumns.paymentStatus && (
                    <TableHead
                      className="cursor-pointer font-semibold"
                      onClick={() => onToggleSort("paymentStatus")}
                    >
                      Status {getSortIcon("paymentStatus")}
                    </TableHead>
                  )}
                  {visibleColumns.paymentMethod && (
                    <TableHead className="font-semibold">
                      Payment Method
                    </TableHead>
                  )}
                  {visibleColumns.transactionId && (
                    <TableHead className="font-semibold">
                      Transaction ID
                    </TableHead>
                  )}
                  {visibleColumns.sendingDate && (
                    <TableHead
                      className="cursor-pointer font-semibold"
                      onClick={() => onToggleSort("sendingDate")}
                    >
                      Sending Date {getSortIcon("sendingDate")}
                    </TableHead>
                  )}
                  {visibleColumns.inverterSerialNumber && (
                    <TableHead className="font-semibold">
                      Inverter Serial
                    </TableHead>
                  )}
                  {visibleColumns.registeredBy && (
                    <TableHead className="font-semibold">
                      Registered By
                    </TableHead>
                  )}
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton
                    rows={itemsPerPage}
                    actionIcons={[IconEdit2, IconTrashBin2]}
                    excludeLastColumn={true}
                    isCheck={false}
                  />
                ) : totalRewards === 0 ? (
                  <TableRow className="p-4">
                    <TableCell
                      colSpan={activeColumnsLength + 3}
                      className="w-full place-items-center p-0"
                    >
                      <EmptyState
                        title="No Products Registered"
                        description="You can register a new product to add in rewards."
                        icons={[IconActivity]}
                        className="w-full border-none rounded-none bg-card"
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
                ) : (
                  <>
                    {rewards.map((reward) => (
                      <RewardsTableRow
                        key={reward._id}
                        reward={reward}
                        visibleColumns={visibleColumns}
                        isSelected={selectedRewards.has(reward._id)}
                        onToggleSelection={onToggleSelection}
                        onEditClick={onEditClick}
                        onDeleteClick={onDeleteClick}
                      />
                    ))}
                  </>
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
                      <div className="flex items-center gap-2">
                        <span>Last Updated:</span>
                        <span className="capitalize">
                          {loading ? <Loading /> : lastUpdatedText}
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
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={handleItemsPerPageChange}
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
                of {totalRewards} results
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFirstPage}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousPage}
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
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleLastPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-max h-full flex items-center justify-center">
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
                      "border border-border rounded-2xl p-2 flex items-center gap-2 relative bg-background"
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
          </div>
        </CardContent>
      </Card>
    );
  }
);

RewardsTable.displayName = "RewardsTable";
