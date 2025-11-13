/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";

export interface RewardWithId {
  _id: string;
  installerCode: string;
  serialNumber: string;
  productModel: string;
  cityOfInstallation: string;
  rewardAmount: number;
  rewardStatus: string;
  paymentMethod?: string;
  transactionId?: string;
  referrerTransactionId?: string;
  referrerRewardAmount?: number;
  sendingDate?: string;
  inverterSerialNumber?: string;
  serialNumberStatus?: string;
  createdAt: string;
  installer?: {
    _id: string;
    installerCode: string;
    fullName: string;
    cnic: string;
    phoneNumber: string;
    whatsappNumber: string;
  };
  registeredBy?: {
    _id: string;
    name: string;
    email: string;
  };
  referrer?: {
    _id: string;
    installerCode: string;
    fullName: string;
  };
}

export interface RewardsFilters {
  rewardStatus: string;
  sendingDate: string;
  paymentMethod: string;
  serialNumberStatus: string;
  productModel: string;
  teamMember: string;
  search: string;
  dateRange: "all" | "today" | "week" | "month" | "year" | "custom";
  customStartDate: string;
  customEndDate: string;
}

export interface SortConfig {
  field: keyof RewardWithId | "installer" | "registeredBy";
  direction: "asc" | "desc";
}

interface UseOptimizedRewardsFilterProps {
  rewards: RewardWithId[];
  filters: RewardsFilters;
  sort: SortConfig;
}

interface OptimizedFilterResult {
  filtered: RewardWithId[];
  statistics: {
    totalRewards: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    uniqueInstallersCount: number;
    byStatus: {
      PAID: number;
      PENDING: number;
      FAILED: number;
    };
  };
  uniqueValues: {
    paymentMethods: string[];
    serialNumberStatuses: string[];
    productModels: string[];
  };
}

/**
 * Optimized single-pass filtering, sorting, and statistics calculation for rewards
 * Combines multiple operations to minimize iterations over large datasets
 */
export function useOptimizedRewardsFilter({
  rewards,
  filters,
  sort,
}: UseOptimizedRewardsFilterProps): OptimizedFilterResult {
  return useMemo(() => {
    const searchLower = filters.search.toLowerCase().trim();

    // Calculate date range boundaries
    let dateRangeStart: Date | null = null;
    let dateRangeEnd: Date | null = null;

    if (filters.dateRange && filters.dateRange !== "all") {
      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      switch (filters.dateRange) {
        case "today":
          dateRangeStart = todayStart;
          dateRangeEnd = new Date(
            todayStart.getTime() + 24 * 60 * 60 * 1000 - 1
          );
          break;
        case "week":
          dateRangeStart = new Date(
            todayStart.getTime() - 7 * 24 * 60 * 60 * 1000
          );
          dateRangeEnd = now;
          break;
        case "month":
          dateRangeStart = new Date(
            todayStart.getTime() - 30 * 24 * 60 * 60 * 1000
          );
          dateRangeEnd = now;
          break;
        case "year":
          dateRangeStart = new Date(
            todayStart.getTime() - 365 * 24 * 60 * 60 * 1000
          );
          dateRangeEnd = now;
          break;
        case "custom":
          if (filters.customStartDate) {
            dateRangeStart = new Date(filters.customStartDate);
          }
          if (filters.customEndDate) {
            dateRangeEnd = new Date(filters.customEndDate);
            // Set to end of day
            dateRangeEnd.setHours(23, 59, 59, 999);
          }
          break;
      }
    }

    // Single-pass processing - collect statistics and unique values
    const uniquePaymentMethods = new Set<string>();
    const uniqueSerialNumberStatuses = new Set<string>();
    const uniqueProductModels = new Set<string>();
    const uniqueInstallers = new Set<string>();

    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    // Single-pass filter and collect statistics
    const filtered = rewards.filter((reward) => {
      // Collect unique values from ALL rewards (not just filtered)
      if (reward.paymentMethod) uniquePaymentMethods.add(reward.paymentMethod);
      if (reward.serialNumberStatus)
        uniqueSerialNumberStatuses.add(reward.serialNumberStatus);
      if (reward.productModel) uniqueProductModels.add(reward.productModel);
      if (reward.installer?._id) uniqueInstallers.add(reward.installer._id);

      // Accumulate total statistics
      totalAmount += reward.rewardAmount || 0;
      if (reward.rewardStatus === "PAID") {
        paidAmount += reward.rewardAmount || 0;
        paidCount++;
      } else if (reward.rewardStatus === "PENDING") {
        pendingAmount += reward.rewardAmount || 0;
        pendingCount++;
      } else if (reward.rewardStatus === "FAILED") {
        failedCount++;
      }

      // Apply search filter
      if (searchLower) {
        const matchesSearch =
          reward.serialNumber?.toLowerCase().includes(searchLower) ||
          reward.transactionId?.toLowerCase().includes(searchLower) ||
          reward.referrerTransactionId?.toLowerCase().includes(searchLower) ||
          reward.installer?.installerCode
            ?.toLowerCase()
            .includes(searchLower) ||
          reward.installer?.fullName?.toLowerCase().includes(searchLower) ||
          reward.installer?.cnic?.includes(filters.search) ||
          reward.installer?.phoneNumber?.includes(filters.search) ||
          reward.installer?.whatsappNumber?.includes(filters.search);

        if (!matchesSearch) return false;
      }

      // Apply filters
      if (filters.rewardStatus && filters.rewardStatus !== "ALL") {
        if (reward.rewardStatus !== filters.rewardStatus) return false;
      }

      if (filters.sendingDate) {
        if (reward.sendingDate !== filters.sendingDate) return false;
      }

      if (filters.paymentMethod && filters.paymentMethod !== "all") {
        if (reward.paymentMethod !== filters.paymentMethod) return false;
      }

      if (filters.serialNumberStatus && filters.serialNumberStatus !== "all") {
        if (reward.serialNumberStatus !== filters.serialNumberStatus)
          return false;
      }

      if (filters.productModel && filters.productModel !== "all") {
        if (reward.productModel !== filters.productModel) return false;
      }

      if (filters.teamMember && filters.teamMember !== "all") {
        if (reward.registeredBy?._id !== filters.teamMember) return false;
      }

      // Apply date range filter
      if (dateRangeStart || dateRangeEnd) {
        const rewardDate = new Date(reward.createdAt);
        if (dateRangeStart && rewardDate < dateRangeStart) return false;
        if (dateRangeEnd && rewardDate > dateRangeEnd) return false;
      }

      return true;
    });

    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any = a[sort.field];
      let bVal: any = b[sort.field];

      // Handle nested fields
      if (sort.field === "installer") {
        aVal = a.installer?.fullName;
        bVal = b.installer?.fullName;
      } else if (sort.field === "installerCode") {
        aVal = a.installerCode;
        bVal = b.installerCode;
      }

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sort.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sort.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      return 0;
    });

    return {
      filtered: sorted,
      statistics: {
        totalRewards: rewards.length,
        totalAmount,
        paidAmount,
        pendingAmount,
        uniqueInstallersCount: uniqueInstallers.size,
        byStatus: {
          PAID: paidCount,
          PENDING: pendingCount,
          FAILED: failedCount,
        },
      },
      uniqueValues: {
        paymentMethods: Array.from(uniquePaymentMethods).sort(),
        serialNumberStatuses: Array.from(uniqueSerialNumberStatuses).sort(),
        productModels: Array.from(uniqueProductModels).sort(),
      },
    };
  }, [rewards, filters, sort]);
}
