import { describe, expect, it } from "vitest";
import {
  deriveRewardPageState,
  getPaymentBlockers,
  getPendingDays,
} from "@/lib/rewardPageState";
import { RewardStatus } from "@/types/rewards";

const complete = {
  rewardStatus: RewardStatus.PENDING,
  bankName: "HBL",
  accountNumber: "PK00HABB0000001234567890",
  accountTitle: "Ahmed Raza",
};

describe("deriveRewardPageState", () => {
  it("returns paid for PAID regardless of missing bank data", () => {
    expect(
      deriveRewardPageState({ rewardStatus: RewardStatus.PAID }),
    ).toBe("paid");
  });

  it("returns failed for FAILED", () => {
    expect(
      deriveRewardPageState({ ...complete, rewardStatus: RewardStatus.FAILED }),
    ).toBe("failed");
  });

  it("returns payable for PENDING with complete payment details", () => {
    expect(deriveRewardPageState(complete)).toBe("payable");
  });

  it("returns blocked for PENDING with missing payment details", () => {
    expect(
      deriveRewardPageState({ ...complete, accountNumber: "  " }),
    ).toBe("blocked");
  });
});

describe("getPaymentBlockers", () => {
  it("lists each missing field", () => {
    expect(
      getPaymentBlockers({
        rewardStatus: RewardStatus.PENDING,
        bankName: "",
        accountNumber: undefined,
        accountTitle: "Ahmed",
      }),
    ).toEqual(["Bank name", "Account number"]);
  });

  it("is empty when all fields present", () => {
    expect(getPaymentBlockers(complete)).toEqual([]);
  });
});

describe("getPendingDays", () => {
  it("returns 0 without createdAt or for invalid dates", () => {
    expect(getPendingDays({ rewardStatus: RewardStatus.PENDING })).toBe(0);
    expect(
      getPendingDays({
        rewardStatus: RewardStatus.PENDING,
        createdAt: "not-a-date",
      }),
    ).toBe(0);
  });

  it("computes whole days since registration", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86_400_000).toISOString();
    expect(
      getPendingDays({
        rewardStatus: RewardStatus.PENDING,
        createdAt: tenDaysAgo,
      }),
    ).toBe(10);
  });

  it("clamps future dates to 0", () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
    expect(
      getPendingDays({
        rewardStatus: RewardStatus.PENDING,
        createdAt: tomorrow,
      }),
    ).toBe(0);
  });
});
