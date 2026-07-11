import { useQuery } from "@tanstack/react-query";
import { PAYMENT_METHOD } from "@/lib/constants";

// Read-only view of the settings the client needs to honor. Add fields here as
// more settings gain UI behavior.
export interface AppSettings {
  requireTransactionIdForPaid: boolean;
  paymentMethods?: string[];
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

/**
 * Admin-configurable payment method list (Settings-backed), falling back to
 * the built-in defaults until settings load or when the list is empty.
 */
export function usePaymentMethods(): string[] {
  const { data } = useSettings();
  return data?.paymentMethods?.length
    ? data.paymentMethods
    : PAYMENT_METHOD.map((m) => m.value);
}
