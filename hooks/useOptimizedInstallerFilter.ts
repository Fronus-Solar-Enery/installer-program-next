import { useMemo } from 'react';
import type { InstallerWithId } from './useInstallers';
import type { Filters } from './useInstallersState';

interface UseOptimizedInstallerFilterProps {
  installers: InstallerWithId[];
  search: string;
  filters: Filters;
  sortField: string;
  sortDirection: 'asc' | 'desc';
}

interface OptimizedFilterResult {
  filtered: InstallerWithId[];
  statistics: {
    total: number;
    certified: number;
    notCertified: number;
    cities: number;
    provinces: number;
    trainingCenters: number;
    filtered: number;
  };
  uniqueValues: {
    cities: string[];
    provinces: string[];
    trainingCenters: string[];
  };
}

/**
 * Optimized single-pass filtering, sorting, and statistics calculation
 * This hook processes installers data in a single pass to minimize iterations
 */
export function useOptimizedInstallerFilter({
  installers,
  search,
  filters,
  sortField,
  sortDirection,
}: UseOptimizedInstallerFilterProps): OptimizedFilterResult {
  return useMemo(() => {
    const searchLower = search.toLowerCase().trim();

    // Single-pass processing
    const uniqueCities = new Set<string>();
    const uniqueProvinces = new Set<string>();
    const uniqueTrainingCenters = new Set<string>();
    let certifiedCount = 0;
    let filteredCount = 0;

    // Pre-compute date filters once
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (filters.dateRange !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (filters.dateRange) {
        case "today":
          startDate = today;
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "week":
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 7);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "month":
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 30);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "year":
          startDate = new Date(today);
          startDate.setFullYear(today.getFullYear() - 1);
          endDate = new Date(today);
          endDate.setHours(23, 59, 59, 999);
          break;
        case "custom":
          if (filters.customStartDate) {
            startDate = new Date(filters.customStartDate);
            startDate.setHours(0, 0, 0, 0);
          }
          if (filters.customEndDate) {
            endDate = new Date(filters.customEndDate);
            endDate.setHours(23, 59, 59, 999);
          }
          break;
      }
    }

    // Single-pass filter and collect statistics
    const filtered = installers.filter((installer) => {
      // Collect unique values for all installers
      if (installer.city) uniqueCities.add(installer.city);
      if (installer.province) uniqueProvinces.add(installer.province);
      if (installer.trainingCenter) uniqueTrainingCenters.add(installer.trainingCenter);
      if (installer.certified) certifiedCount++;

      // Apply search filter
      if (searchLower) {
        const matchesSearch =
          installer.fullName?.toLowerCase().includes(searchLower) ||
          installer.installerCode?.toLowerCase().includes(searchLower) ||
          installer.phoneNumber?.includes(searchLower) ||
          installer.whatsappNumber?.includes(searchLower) ||
          installer.cnic?.includes(searchLower) ||
          installer.city?.toLowerCase().includes(searchLower) ||
          installer.province?.toLowerCase().includes(searchLower) ||
          installer.trainingCenter?.toLowerCase().includes(searchLower) ||
          installer.companyName?.toLowerCase().includes(searchLower) ||
          installer.address?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Apply date filter
      if (startDate && endDate) {
        const installerDate = new Date(installer.createdAt);
        if (installerDate < startDate || installerDate > endDate) {
          return false;
        }
      }

      // Apply other filters
      if (filters.city && installer.city !== filters.city) return false;
      if (filters.province && installer.province !== filters.province) return false;
      if (filters.trainingCenter && installer.trainingCenter !== filters.trainingCenter) return false;
      if (filters.certified !== "") {
        const isCertified = filters.certified === "true";
        if (installer.certified !== isCertified) return false;
      }

      filteredCount++;
      return true;
    });

    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number | boolean | Date = "";
      let bValue: string | number | boolean | Date = "";

      // Get values based on sort field
      switch (sortField) {
        case "createdAt":
        case "updatedAt":
          aValue = new Date(a[sortField] as string);
          bValue = new Date(b[sortField] as string);
          break;
        case "certified":
          aValue = a[sortField] ? 1 : 0;
          bValue = b[sortField] ? 1 : 0;
          break;
        default:
          aValue = (a[sortField as keyof InstallerWithId] as string) || "";
          bValue = (b[sortField as keyof InstallerWithId] as string) || "";
      }

      // Compare values
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return {
      filtered: sorted,
      statistics: {
        total: installers.length,
        certified: certifiedCount,
        notCertified: installers.length - certifiedCount,
        cities: uniqueCities.size,
        provinces: uniqueProvinces.size,
        trainingCenters: uniqueTrainingCenters.size,
        filtered: filteredCount,
      },
      uniqueValues: {
        cities: Array.from(uniqueCities).sort(),
        provinces: Array.from(uniqueProvinces).sort(),
        trainingCenters: Array.from(uniqueTrainingCenters).sort(),
      },
    };
  }, [installers, search, filters, sortField, sortDirection]);
}
