import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RewardStatus } from "@/types/rewards";

export interface RewardDetails {
  _id: string;
  serialNumber: string;
  productModel: string;
  inverterSerialNumber?: string;
  cityOfInstallation?: string;
  installationDate?: string;
  installerCode?: string;
  installer?: {
    _id: string;
    installerCode: string;
    fullName: string;
    cnic?: string;
    phoneNumber?: string;
    whatsappNumber?: string;
    district?: string;
  };
  referrerCode?: string;
  referrer?: {
    _id: string;
    installerCode: string;
    fullName: string;
  };
  registeredBy?: { name: string; email: string };
  updatedBy?: { name: string; email: string };
  rewardStatus: RewardStatus;
  rewardAmount?: number;
  referrerRewardAmount?: number;
  transactionId?: string;
  referrerTransactionId?: string;
  sendingDate?: string;
  paymentMethod?: string;
  bankName?: string;
  accountNumber?: string;
  accountTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MarkPaidInput {
  transactionId?: string;
  referrerTransactionId?: string;
  paymentMethod?: string;
  sendingDate?: string;
  // Optional status override (edit mode); defaults to PAID when omitted.
  rewardStatus?: RewardStatus;
}

async function parseJsonOrThrow(res: Response, fallback: string) {
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || data.message || fallback);
  }
  return data;
}

export function useRewardDetails(rewardId: string) {
  return useQuery({
    queryKey: ["reward", rewardId],
    queryFn: async () => {
      const res = await fetch(`/api/rewards/${rewardId}`);
      const data = await parseJsonOrThrow(res, "Failed to fetch reward");
      return data.data as RewardDetails;
    },
    enabled: !!rewardId,
    staleTime: 30000,
  });
}

export function useMarkRewardPaid(rewardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: MarkPaidInput) => {
      const res = await fetch(`/api/rewards/${rewardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardStatus: RewardStatus.PAID,
          ...input,
        }),
      });
      const data = await parseJsonOrThrow(res, "Failed to mark reward paid");
      return data.data as RewardDetails;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["reward", rewardId], updated);
      queryClient.invalidateQueries({ queryKey: ["installer-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["installer-activities"] });
    },
  });
}

export function useDeleteReward(rewardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/rewards/${rewardId}`, {
        method: "DELETE",
      });
      await parseJsonOrThrow(res, "Failed to delete reward");
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["reward", rewardId] });
      queryClient.invalidateQueries({ queryKey: ["installer-rewards"] });
    },
  });
}
