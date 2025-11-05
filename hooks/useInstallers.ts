import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface InstallerWithId {
  _id: string;
  installerCode: string;
  fullName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  address: string;
  city: string;
  province: string;
  companyName?: string;
  referrerCode?: string;
  cnic: string;
  trainingCenter: string;
  status: "ACTIVE" | "INACTIVE";
  certified: boolean;
  bankName?: string;
  accountNumber?: string;
  createdAt: string;
  updatedAt: string;
  registeredBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  referrer?: {
    _id: string;
    installerCode: string;
    fullName: string;
  };
  googleContactId?: string;
}

export interface InstallerStats {
  totalInstallers: number;
  activeInstallers: number;
  inactiveInstallers: number;
  newInstallersThisMonth: number;
}

export function useInstallers() {
  return useQuery({
    queryKey: ["installers"],
    queryFn: async () => {
      const response = await fetch("/api/installers?limit=10000");
      const data = await response.json();
      if (!data.success)
        throw new Error(data.message || "Failed to fetch installers");
      return {
        installers: data.data.installers as InstallerWithId[],
        statistics: data.data.statistics as InstallerStats,
      };
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });
}

export function useDeleteInstaller() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (installerId: string) => {
      const response = await fetch(`/api/installers/${installerId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete installer");
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["installers"] });
    },
  });
}

export function useBulkDeleteInstallers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (installerIds: string[]) => {
      const results = {
        successCount: 0,
        failCount: 0,
        failures: [] as Array<{ id: string; name: string; reason: string }>,
      };

      for (const installerId of installerIds) {
        try {
          const response = await fetch(`/api/installers/${installerId}`, {
            method: "DELETE",
          });

          if (response.ok) {
            results.successCount++;
          } else {
            results.failCount++;
            const data = await response.json();
            results.failures.push({
              id: installerId,
              name: installerId,
              reason: data.message || "Unknown error",
            });
          }
        } catch (error) {
          results.failCount++;
          results.failures.push({
            id: installerId,
            name: installerId,
            reason: "Network error",
          });
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installers"] });
    },
  });
}
