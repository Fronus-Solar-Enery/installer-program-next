import { useQuery } from "@tanstack/react-query";

// Read-only view of the settings the client needs to honor. Add fields here as
// more settings gain UI behavior.
export interface AppSettings {
  requireTransactionIdForPaid: boolean;
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await fetch("/api/settings");
      const data = await response.json();
      if (!data.success)
        throw new Error(data.message || "Failed to fetch settings");
      return data.data as AppSettings;
    },
    staleTime: 60000,
    gcTime: 300000,
  });
}
