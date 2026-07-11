import { useMutation, useQuery } from "@tanstack/react-query";

export interface InstallerDetails {
  _id: string;
  installerCode: string;
  fullName: string;
  cnic: string;
  phoneNumber: string;
  whatsappNumber: string;
  address: string;
  city: string;
  province: string;
  district: string;
  companyName?: string;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  certified: boolean;
  referrerCode?: string;
  createdAt: string;
  updatedAt?: string;
  referrer?: {
    installerCode: string;
    fullName: string;
  };
  registeredBy?: {
    name: string;
    email: string;
  };
}

export interface InstallerStatistics {
  totalRewards: number;
  pendingRewards: number;
  paidRewards: number;
  failedRewards: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  failedAmount: number;
}

export interface InstallerActivity {
  _id: string;
  type: string;
  description: string;
  createdAt: string;
  targetName?: string;
  metadata?: {
    changes?: Record<string, { before: unknown; after: unknown }>;
    whatsappNumber?: string;
    errorMessage?: string;
    [key: string]: unknown;
  };
  performedBy?: {
    name: string;
  };
}

export interface InstallerProduct {
  _id: string;
  serialNumber: string;
  productModel: string;
  cityOfInstallation?: string;
  installationDate?: string;
  rewardAmount: number;
  rewardStatus: string;
  transactionId?: string;
  createdAt: string;
}

async function parseJsonOrThrow(res: Response, fallback: string) {
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || data.message || fallback);
  }
  return data;
}

export function useInstallerDetails(installerId: string) {
  return useQuery({
    queryKey: ["installer", installerId],
    queryFn: async () => {
      const res = await fetch(`/api/installers/${installerId}`);
      const data = await parseJsonOrThrow(res, "Failed to fetch installer");
      return {
        installer: data.data.installer as InstallerDetails,
        statistics: data.data.statistics as InstallerStatistics,
      };
    },
    enabled: !!installerId,
    staleTime: 30000,
  });
}

export function useInstallerRewards(installerObjectId?: string) {
  return useQuery({
    queryKey: ["installer-rewards", installerObjectId],
    queryFn: async () => {
      const res = await fetch(
        `/api/rewards?installer=${installerObjectId}&limit=1000`,
      );
      const data = await parseJsonOrThrow(res, "Failed to fetch rewards");
      return data.data.rewards as InstallerProduct[];
    },
    enabled: !!installerObjectId,
    staleTime: 30000,
  });
}

export function useInstallerActivities(installerObjectId?: string) {
  return useQuery({
    queryKey: ["installer-activities", installerObjectId],
    queryFn: async () => {
      const res = await fetch(
        `/api/activities?installerId=${installerObjectId}&limit=200`,
      );
      const data = await parseJsonOrThrow(res, "Failed to fetch activities");
      return data.data.activities as InstallerActivity[];
    },
    enabled: !!installerObjectId,
    staleTime: 30000,
  });
}

export interface ResendPinResult {
  pin: string | null;
  whatsappMessage: string | null;
  whatsappUrl: string | null;
}

export function useResendInstallerPin(installerId: string) {
  return useMutation({
    mutationFn: async (): Promise<ResendPinResult> => {
      const res = await fetch(`/api/installers/${installerId}/resend-pin`, {
        method: "POST",
      });
      const data = await parseJsonOrThrow(res, "Failed to resend PIN");
      return {
        pin: data.data?.pin || null,
        whatsappMessage: data.data?.whatsappMessage || null,
        whatsappUrl: data.data?.whatsappUrl || null,
      };
    },
  });
}

export function useRevealInstallerPin(installerId: string) {
  return useMutation({
    mutationFn: async (): Promise<string | null> => {
      const res = await fetch(`/api/installers/${installerId}/pin`);
      const data = await parseJsonOrThrow(res, "Failed to reveal PIN");
      return (data.data?.pin as string | undefined) ?? null;
    },
  });
}
