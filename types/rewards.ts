// Shared types for rewards that can be used in both client and server code

import { TeamRole } from "@/types/roles";

export enum RewardStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  // Claim refused by staff. Kept in the rewards list for the record but
  // excluded from every stat, total, payment file and installer-facing view.
  REJECTED = "REJECTED",
}

/**
 * Mongo filter for rewards that count toward stats and payments — i.e. every
 * reward except REJECTED ones. Spread it into `find`/`countDocuments` queries
 * or use it as the first `$match` of an aggregation.
 */
export const COUNTED_REWARDS_FILTER = {
  rewardStatus: { $ne: RewardStatus.REJECTED },
} as const;

/**
 * Rejected rewards are visible to ADMIN only — and only admins can reject or
 * restore. Everyone else sees the rewards collection as if rejected rows
 * didn't exist.
 */
export function canSeeRejected(role: string | null | undefined): boolean {
  return role === TeamRole.ADMIN;
}

/**
 * Narrow a reward query so non-admins never get rejected rows. Uses `$and` so
 * it composes with whatever `rewardStatus` filter the query already has
 * (e.g. an explicit REJECTED filter from a non-admin then matches nothing).
 */
export function hideRejectedUnlessAdmin<Q extends Record<string, unknown>>(
  query: Q,
  role: string | null | undefined,
): Q {
  if (canSeeRejected(role)) return query;
  const existing = Array.isArray(query.$and) ? query.$and : [];
  return { ...query, $and: [...existing, COUNTED_REWARDS_FILTER] };
}

/** Whether a reward counts toward stats/totals (anything but REJECTED). */
export function isCountedReward(status: string | null | undefined): boolean {
  return status !== RewardStatus.REJECTED;
}

/**
 * Status-change rules, enforced server-side on every update path:
 * - PAID can't be rejected (money has already gone out).
 * - REJECTED can only be restored to PENDING; it can't jump straight to
 *   PAID/FAILED.
 * Returns an error message when the change is not allowed, else null.
 */
export function rewardStatusChangeError(
  from: string,
  to: string,
): string | null {
  if (from === to) return null;
  if (to === RewardStatus.REJECTED && from === RewardStatus.PAID) {
    return "A PAID reward cannot be rejected";
  }
  if (from === RewardStatus.REJECTED && to !== RewardStatus.PENDING) {
    return "A rejected reward must be restored to PENDING first";
  }
  return null;
}

// Payment method options live in Settings (admin-editable); defaults in
// lib/constants PAYMENT_METHOD. Read them via usePaymentMethods().
