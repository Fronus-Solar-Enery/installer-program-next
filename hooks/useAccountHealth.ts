import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface AccountWarning {
  _id: string;
  reason: string;
  serialNumber: string;
  issuedAt: string;
  expiresAt: string;
}

export interface AccountHealth {
  activeWarnings: number;
  threshold: number;
  suspended: boolean;
  suspendedAt: string | null;
  status: "GOOD" | "AT_RISK" | "SUSPENDED";
  warnings: AccountWarning[];
}

/**
 * Account health for one installer, from the team-facing endpoint.
 * Pass a falsy id to keep the query idle (e.g. before a code resolves).
 */
export function useAccountHealth(installerId?: string | null) {
  return useQuery({
    queryKey: ["account-health", installerId],
    enabled: Boolean(installerId),
    queryFn: async () => {
      const response = await fetch(`/api/installers/${installerId}/health`);
      const data = await response.json();
      if (!data.success)
        throw new Error(data.message || "Failed to fetch account health");
      return data.data as AccountHealth;
    },
    staleTime: 30000,
  });
}

/**
 * Lift an installer's suspension. ADMIN only — the route enforces it; callers
 * should still hide the control from non-admins.
 */
export function useUnsuspendInstaller(installerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (note?: string) => {
      const response = await fetch(`/api/installers/${installerId}/health`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      const data = await response.json();
      if (!data.success)
        throw new Error(data.message || "Failed to unsuspend installer");
      return data.data as AccountHealth;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["account-health", installerId],
      });
    },
  });
}
