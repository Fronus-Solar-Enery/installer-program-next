"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import RewardEditModal from "@/components/RewardEditModal";
import { cn } from "@/lib/utils";
import {
  IconAdd,
  IconReward,
  IconRefresh2,
  IconLayer,
  IconSquareShareLine,
  IconClockCircle,
} from "@/components/icons";
import { useRelativeTime } from "@/lib/getRelativeTime";
import { useDebounce } from "@/hooks/useDebounce";
import { useRewardsState } from "@/hooks/useRewardsState";
import {
  useOptimizedRewardsFilter,
  type RewardWithId,
} from "@/hooks/useOptimizedRewardsFilter";
import { RewardsStatisticsCards } from "@/components/RewardsStatisticsCards";
import { RewardsTable } from "@/components/RewardsTable";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { BulkDeleteResultDialog } from "@/components/BulkDeleteResultDialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import Loading from "@/components/ui/loading";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
}

// Memoized constants - defined outside component to prevent re-creation on each render
const EMPTY_ARRAY: TeamMember[] = [];

export default function RewardsPage() {
  const router = useRouter();
  const [state, dispatch] = useRewardsState();

  // Data state
  const [rewards, setRewards] = useState<RewardWithId[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(EMPTY_ARRAY);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  // Date range state
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const refreshRelTime = useRelativeTime(lastUpdated);
  const isPageLoading = loading || isFetching;

  // Sync dateRange with filters when popover opens
  useEffect(() => {
    if (
      isCustomDateOpen &&
      state.filters.customStartDate &&
      state.filters.customEndDate
    ) {
      setDateRange({
        from: new Date(state.filters.customStartDate),
        to: new Date(state.filters.customEndDate),
      });
    } else if (!isCustomDateOpen) {
      // Reset when popover closes
      if (state.filters.dateRange !== "custom") {
        setDateRange(undefined);
      }
    }
  }, [
    isCustomDateOpen,
    state.filters.customStartDate,
    state.filters.customEndDate,
    state.filters.dateRange,
  ]);

  // Debounce search to reduce re-renders (300ms delay)
  const debouncedSearch = useDebounce(state.filters.search, 300);

  // Optimized filters with debounced search
  const optimizedFilters = useMemo(
    () => ({
      ...state.filters,
      search: debouncedSearch,
    }),
    [state.filters, debouncedSearch]
  );

  // Single-pass filtering, sorting, and statistics calculation
  const { filtered, statistics, uniqueValues } = useOptimizedRewardsFilter({
    rewards,
    filters: optimizedFilters,
    sort: {
      field: state.sortField as
        | keyof RewardWithId
        | "installer"
        | "registeredBy",
      direction: state.sortDirection,
    },
  });

  // Paginated rewards (only slice what we need to render)
  const paginatedRewards = useMemo(() => {
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const endIndex = startIndex + state.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, state.currentPage, state.itemsPerPage]);

  // Reset to first page when filters or search change
  useEffect(() => {
    dispatch({ type: "RESET_TO_PAGE_ONE" });
  }, [state.filters, dispatch]);

  // Fetch rewards from API
  const fetchRewards = useCallback(async () => {
    try {
      setLoading(true);
      setIsFetching(true);
      const params = new URLSearchParams();

      // Only add non-default filter values to reduce API payload
      if (
        state.filters.rewardStatus &&
        state.filters.rewardStatus !== "ALL"
      ) {
        params.append("rewardStatus", state.filters.rewardStatus);
      }
      if (state.filters.sendingDate) {
        params.append("sendingDate", state.filters.sendingDate);
      }
      if (
        state.filters.paymentMethod &&
        state.filters.paymentMethod !== "all"
      ) {
        params.append("paymentMethod", state.filters.paymentMethod);
      }
      if (
        state.filters.serialNumberStatus &&
        state.filters.serialNumberStatus !== "all"
      ) {
        params.append("serialNumberStatus", state.filters.serialNumberStatus);
      }
      if (state.filters.productModel && state.filters.productModel !== "all") {
        params.append("productModel", state.filters.productModel);
      }
      if (state.filters.teamMember && state.filters.teamMember !== "all") {
        params.append("registeredBy", state.filters.teamMember);
      }

      // Fetch all rewards for client-side filtering and pagination
      params.append("limit", "10000");
      const response = await fetch(`/api/rewards?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRewards(data.data.rewards);

        // Extract unique team members
        const uniqueTeamMembers = data.data.rewards
          .map((r: RewardWithId) => r.registeredBy)
          .filter(
            (
              value: TeamMember | undefined,
              index: number,
              self: (TeamMember | undefined)[]
            ) =>
              value &&
              self.findIndex(
                (t: TeamMember | undefined) => t?._id === value?._id
              ) === index
          ) as TeamMember[];
        setTeamMembers(uniqueTeamMembers);
      }
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch rewards:", error);
      toast.error("Failed to fetch rewards");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [
    state.filters.rewardStatus,
    state.filters.sendingDate,
    state.filters.paymentMethod,
    state.filters.serialNumberStatus,
    state.filters.productModel,
    state.filters.teamMember,
  ]);

  // Fetch rewards on mount and when filters change
  useEffect(() => {
    let isMounted = true;
    const timeoutIds: NodeJS.Timeout[] = [];

    const fetchIfMounted = async () => {
      if (isMounted) {
        await fetchRewards();
      }
    };

    fetchIfMounted();

    // Check for search result ID from navbar (for deep linking)
    const params = new URLSearchParams(window.location.search);
    const searchId = params.get("id");
    if (searchId && isMounted) {
      dispatch({ type: "OPEN_EDIT_MODAL", payload: searchId });

      // Scroll to the row after rewards are loaded
      const scrollTimeout = setTimeout(() => {
        const element = document.getElementById(`reward-${searchId}`);
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

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      timeoutIds.forEach(clearTimeout);
    };
  }, [fetchRewards, dispatch]);

  // Handler functions
  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      dispatch({
        type: "SET_FILTER",
        payload: {
          key: key as
            | "rewardStatus"
            | "sendingDate"
            | "paymentMethod"
            | "serialNumberStatus"
            | "productModel"
            | "teamMember"
            | "search",
          value,
        },
      });
    },
    [dispatch]
  );

  const handleClearFilters = useCallback(() => {
    dispatch({ type: "RESET_FILTERS" });
  }, [dispatch]);

  const handleToggleSort = useCallback(
    (field: string) => {
      dispatch({ type: "TOGGLE_SORT", payload: field });
    },
    [dispatch]
  );

  const handleToggleColumn = useCallback(
    (
      column:
        | "serialNumber"
        | "installerCode"
        | "installer"
        | "productModel"
        | "cityOfInstallation"
        | "rewardAmount"
        | "rewardStatus"
        | "paymentMethod"
        | "transactionId"
        | "sendingDate"
        | "inverterSerialNumber"
        | "registeredBy"
        | "referrerName"
        | "referrerTransactionId"
        | "referrerReward"
    ) => {
      dispatch({ type: "TOGGLE_COLUMN", payload: column });
    },
    [dispatch]
  );

  const handleToggleSelection = useCallback(
    (rewardId: string) => {
      dispatch({ type: "TOGGLE_REWARD_SELECTION", payload: rewardId });
    },
    [dispatch]
  );

  const handleToggleSelectAll = useCallback(() => {
    const currentPageIds = paginatedRewards.map((r) => r._id);
    const allSelected = currentPageIds.every((id) =>
      state.selectedRewards.has(id)
    );

    if (allSelected) {
      dispatch({ type: "DESELECT_ALL_REWARDS", payload: currentPageIds });
    } else {
      dispatch({ type: "SELECT_ALL_REWARDS", payload: currentPageIds });
    }
  }, [paginatedRewards, state.selectedRewards, dispatch]);

  const handleEditClick = useCallback(
    (rewardId: string) => {
      dispatch({ type: "OPEN_EDIT_MODAL", payload: rewardId });
    },
    [dispatch]
  );

  const handleCloseEditModal = useCallback(() => {
    dispatch({ type: "CLOSE_EDIT_MODAL" });
  }, [dispatch]);

  const handleDeleteClick = useCallback(
    (rewardId: string, rewardSerialNumber: string) => {
      dispatch({
        type: "SET_DELETE_DIALOG_STATE",
        payload: {
          open: true,
          status: "confirm",
          rewardId,
          rewardSerialNumber,
        },
      });
    },
    [dispatch]
  );

  const handleDelete = useCallback(
    async (rewardId: string, rewardSerialNumber: string) => {
      dispatch({
        type: "SET_DELETE_DIALOG_STATE",
        payload: { status: "deleting" },
      });
      dispatch({ type: "SET_DELETING_ID", payload: rewardId });

      try {
        const response = await fetch(`/api/rewards/${rewardId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (response.ok) {
          await fetchRewards();

          // Remove from selection if selected
          dispatch({ type: "DESELECT_REWARD", payload: rewardId });

          // Show success
          dispatch({
            type: "SET_DELETE_DIALOG_STATE",
            payload: {
              status: "success",
              message: `Reward "${rewardSerialNumber}" has been deleted successfully!`,
            },
          });
        } else {
          dispatch({
            type: "SET_DELETE_DIALOG_STATE",
            payload: {
              status: "error",
              message: data.error || "Failed to delete reward",
            },
          });
        }
      } catch (error) {
        dispatch({
          type: "SET_DELETE_DIALOG_STATE",
          payload: {
            status: "error",
            message: "An error occurred while deleting the reward",
          },
        });
      } finally {
        dispatch({ type: "SET_DELETING_ID", payload: null });
      }
    },
    [dispatch, fetchRewards]
  );

  const handleBulkDelete = useCallback(async () => {
    if (state.selectedRewards.size === 0) return;

    dispatch({ type: "SET_BULK_DELETING", payload: true });
    const toastId = toast.loading(
      `Deleting ${state.selectedRewards.size} reward(s)...`
    );

    try {
      let successCount = 0;
      let failCount = 0;
      const failures: Array<{ name: string; reason: string }> = [];

      for (const rewardId of state.selectedRewards) {
        try {
          const reward = rewards.find((r) => r._id === rewardId);
          const rewardName = reward?.serialNumber || "Unknown";

          const response = await fetch(`/api/rewards/${rewardId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            const data = await response.json();
            failures.push({
              name: rewardName,
              reason: data.error || "Unknown error",
            });
          }
        } catch (error) {
          failCount++;
          const reward = rewards.find((r) => r._id === rewardId);
          failures.push({
            name: reward?.serialNumber || "Unknown",
            reason: "Network error",
          });
        }
      }

      await fetchRewards();
      dispatch({ type: "CLEAR_SELECTION" });
      toast.dismiss(toastId);

      dispatch({
        type: "SET_BULK_DELETE_RESULT_STATE",
        payload: {
          open: true,
          successCount,
          failCount,
          failures,
        },
      });
    } catch (error) {
      toast.dismiss(toastId);
      console.error("Bulk delete error:", error);
      toast.error("An error occurred during bulk delete");
    } finally {
      dispatch({ type: "SET_BULK_DELETING", payload: false });
    }
  }, [state.selectedRewards, rewards, fetchRewards, dispatch]);

  const handleDownloadReport = useCallback(async () => {
    dispatch({ type: "SET_DOWNLOADING_REPORT", payload: true });
    try {
      toast.loading("Generating report...");

      const queryParams = new URLSearchParams({
        rewardStatus:
          state.filters.rewardStatus !== "ALL"
            ? state.filters.rewardStatus
            : "",
        sendingDate: state.filters.sendingDate || "",
        paymentMethod:
          state.filters.paymentMethod !== "all"
            ? state.filters.paymentMethod
            : "",
        serialNumberStatus:
          state.filters.serialNumberStatus !== "all"
            ? state.filters.serialNumberStatus
            : "",
        productModel:
          state.filters.productModel !== "all"
            ? state.filters.productModel
            : "",
        teamMember:
          state.filters.teamMember !== "all" ? state.filters.teamMember : "",
        format: "excel",
      });

      const response = await fetch(`/api/reports/rewards?${queryParams}`);

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rewards_report_${
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
      setTimeout(() => {
        dispatch({ type: "SET_DOWNLOADING_REPORT", payload: false });
      }, 500);
    }
  }, [state.filters, dispatch]);

  const handlePageChange = useCallback(
    (page: number) => {
      dispatch({ type: "SET_PAGE", payload: page });
    },
    [dispatch]
  );

  const handleItemsPerPageChange = useCallback(
    (itemsPerPage: number) => {
      dispatch({ type: "SET_ITEMS_PER_PAGE", payload: itemsPerPage });
    },
    [dispatch]
  );

  const handleClearFilter = useCallback(
    (key: string) => {
      if (key === "dateRange") {
        dispatch({
          type: "SET_FILTERS",
          payload: {
            dateRange: "all",
            customStartDate: "",
            customEndDate: "",
          },
        });
        return;
      }

      let value = "";
      if (key === "rewardStatus") {
        value = "ALL";
      } else if (key === "sendingDate") {
        value = "";
      } else {
        value = "all";
      }

      dispatch({
        type: "SET_FILTER",
        payload: {
          key: key as
            | "rewardStatus"
            | "sendingDate"
            | "paymentMethod"
            | "serialNumberStatus"
            | "productModel"
            | "teamMember"
            | "search",
          value,
        },
      });
    },
    [dispatch]
  );

  return (
    <div className="flex-1 overflow-auto space-y-4">
      <PageHeader
        title="Rewards & Installations"
        Icon={IconReward}
        description={
          <p className="mt-1 text-sm text-muted-foreground">
            Manage product installations and reward distributions
          </p>
        }
        action={
          <div className="flex gap-3">
            <Button
              onClick={() => router.push("/rewards/bulk-update")}
              variant="outline"
              disabled={isPageLoading}
              title="Bulk Update"
              className="gap-2"
            >
              Bulk Update
              <IconLayer width={2} className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={() => router.push("/rewards/register")}
              disabled={isPageLoading}
              title="Register New Installation"
              className="gap-2 pl-2"
            >
              <IconAdd width={2} className="h-3.5 w-3.5" />
              Add Installation
            </Button>
          </div>
        }
      />

      {/* Statistics Cards */}
      <RewardsStatisticsCards statistics={statistics} />

      {/* Date Range Filter Card */}
      <Card className="bg-transparent">
        <CardHeader className="flex-row items-center justify-between w-full bg-muted dark:bg-muted/50 border-b border-border">
          <CardTitle className="text-lg font-semibold">
            Rewards Database
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Last Updated:</span>
              <span>{isPageLoading ? <Loading /> : refreshRelTime}</span>
            </div>
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* DATE RANGE FILTER */}
            <ToggleGroup
              type="single"
              value={state.filters.dateRange}
              onValueChange={(value) => {
                if (!value) return;
                dispatch({
                  type: "SET_FILTERS",
                  payload: {
                    dateRange: value as typeof state.filters.dateRange,
                    customStartDate:
                      value !== "custom" ? "" : state.filters.customStartDate,
                    customEndDate:
                      value !== "custom" ? "" : state.filters.customEndDate,
                  },
                });
              }}
              className={cn("h-9 bg-background", isPageLoading && "opacity-50")}
              disabled={isPageLoading}
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
                      state.filters.dateRange === "custom"
                        ? "text-primary bg-muted"
                        : "text-muted-foreground"
                    )}
                    disabled={isPageLoading}
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
                          Custom date range for filtering rewards
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="rounded-xl"
                          variant="outline"
                          onClick={() => {
                            setDateRange(undefined);
                            dispatch({
                              type: "SET_FILTERS",
                              payload: {
                                dateRange: "all",
                                customStartDate: "",
                                customEndDate: "",
                              },
                            });
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

                              dispatch({
                                type: "SET_FILTERS",
                                payload: {
                                  dateRange: "custom",
                                  customStartDate: fromDate
                                    .toISOString()
                                    .split("T")[0],
                                  customEndDate: toDate
                                    .toISOString()
                                    .split("T")[0],
                                },
                              });
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
                        date > new Date() || date < new Date("2022-01-01")
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
              onClick={fetchRewards}
              disabled={isPageLoading}
              title="Refresh data"
              size="sm"
              className="gap-2 rounded-2xl"
            >
              Refresh
              <IconRefresh2 width={2} className="size-3.5!" />
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadReport}
              disabled={
                filtered.length === 0 ||
                state.downloadingReport ||
                isPageLoading
              }
              size="sm"
              className="gap-2 rounded-2xl"
            >
              {state.downloadingReport ? (
                <>
                  Downloading <Loading />
                </>
              ) : (
                <>
                  Export
                  <IconSquareShareLine width={2} className="size-3.5!" />
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {/* Rewards Table */}
        <RewardsTable
          rewards={paginatedRewards}
          totalRewards={filtered.length}
          totalUnfilteredRewards={rewards.length}
          loading={isPageLoading}
          visibleColumns={state.visibleColumns}
          selectedRewards={state.selectedRewards}
          currentPage={state.currentPage}
          itemsPerPage={state.itemsPerPage}
          sortField={state.sortField}
          sortDirection={state.sortDirection}
          bulkDeleting={state.bulkDeleting}
          lastUpdatedText={refreshRelTime}
          filters={state.filters}
          teamMembers={teamMembers}
          uniqueValues={uniqueValues}
          onToggleColumn={handleToggleColumn}
          onToggleSort={handleToggleSort}
          onToggleSelection={handleToggleSelection}
          onToggleSelectAll={handleToggleSelectAll}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
          onBulkDelete={handleBulkDelete}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          onClearFilter={handleClearFilter}
          onFilterChange={handleFilterChange}
          onClearAllFilters={handleClearFilters}
        />

        {/* Edit Modal */}
        <RewardEditModal
          open={state.editModalOpen}
          onOpenChange={handleCloseEditModal}
          rewardId={state.selectedRewardId}
          onSuccess={fetchRewards}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={state.deleteDialogState.open}
          status={state.deleteDialogState.status}
          itemName={state.deleteDialogState.rewardSerialNumber}
          message={state.deleteDialogState.message}
          entityType="reward"
          warningMessage="The reward will be permanently removed from the database."
          onConfirm={() => {
            if (
              state.deleteDialogState.rewardId &&
              state.deleteDialogState.rewardSerialNumber
            ) {
              handleDelete(
                state.deleteDialogState.rewardId,
                state.deleteDialogState.rewardSerialNumber
              );
            }
          }}
          onClose={() => dispatch({ type: "RESET_DELETE_DIALOG" })}
        />
        {/* Bulk Delete Result Dialog */}
        <BulkDeleteResultDialog
          open={state.bulkDeleteResultState.open}
          successCount={state.bulkDeleteResultState.successCount}
          failCount={state.bulkDeleteResultState.failCount}
          failures={state.bulkDeleteResultState.failures}
          entityType="reward"
          onClose={() => dispatch({ type: "RESET_BULK_DELETE_RESULT" })}
        />
      </Card>
    </div>
  );
}
