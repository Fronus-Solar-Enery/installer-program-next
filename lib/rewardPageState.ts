import { RewardStatus } from "@/types/rewards";

export type RewardPageState = "blocked" | "payable" | "paid" | "failed";

export interface RewardStateInput {
  rewardStatus: RewardStatus | string;
  bankName?: string | null;
  accountNumber?: string | null;
  accountTitle?: string | null;
  createdAt?: string | Date | null;
}

/** Payment prerequisites missing from the record (legacy/incomplete data). */
export function getPaymentBlockers(reward: RewardStateInput): string[] {
  const blockers: string[] = [];
  if (!reward.bankName?.trim()) blockers.push("Bank name");
  if (!reward.accountNumber?.trim()) blockers.push("Account number");
  if (!reward.accountTitle?.trim()) blockers.push("Account title");
  return blockers;
}

export function deriveRewardPageState(
  reward: RewardStateInput,
): RewardPageState {
  if (reward.rewardStatus === RewardStatus.PAID) return "paid";
  if (reward.rewardStatus === RewardStatus.FAILED) return "failed";
  return getPaymentBlockers(reward).length > 0 ? "blocked" : "payable";
}

/** Whole days a claim has been pending since registration. */
export function getPendingDays(reward: RewardStateInput): number {
  if (!reward.createdAt) return 0;
  const created = new Date(reward.createdAt).getTime();
  if (Number.isNaN(created)) return 0;
  return Math.max(0, Math.floor((Date.now() - created) / 86_400_000));
}
