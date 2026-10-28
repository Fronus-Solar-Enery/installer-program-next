import { describe, expect, it } from "vitest";
import {
  COUNTED_REWARDS_FILTER,
  RewardStatus,
  isCountedReward,
  rewardStatusChangeError,
} from "@/types/rewards";
import {
  bulkRewardRejectSchema,
  registerRewardSchema,
} from "@/lib/validation";

describe("bulkRewardRejectSchema", () => {
  it("requires between 1 and 500 reward ids", () => {
    expect(bulkRewardRejectSchema.safeParse({ rewardIds: [] }).success).toBe(
      false,
    );
    expect(
      bulkRewardRejectSchema.safeParse({ rewardIds: ["a", "b"] }).success,
    ).toBe(true);
    expect(
      bulkRewardRejectSchema.safeParse({
        rewardIds: Array.from({ length: 501 }, (_, i) => String(i)),
      }).success,
    ).toBe(false);
  });
});

describe("isCountedReward", () => {
  it("counts every status except REJECTED", () => {
    expect(isCountedReward(RewardStatus.PENDING)).toBe(true);
    expect(isCountedReward(RewardStatus.PAID)).toBe(true);
    expect(isCountedReward(RewardStatus.FAILED)).toBe(true);
    expect(isCountedReward(RewardStatus.REJECTED)).toBe(false);
  });
});

describe("COUNTED_REWARDS_FILTER", () => {
  it("excludes only REJECTED rewards", () => {
    expect(COUNTED_REWARDS_FILTER).toEqual({
      rewardStatus: { $ne: "REJECTED" },
    });
  });
});

describe("rewardStatusChangeError", () => {
  it("allows rejecting PENDING and FAILED rewards", () => {
    expect(
      rewardStatusChangeError(RewardStatus.PENDING, RewardStatus.REJECTED),
    ).toBeNull();
    expect(
      rewardStatusChangeError(RewardStatus.FAILED, RewardStatus.REJECTED),
    ).toBeNull();
  });

  it("blocks rejecting a PAID reward", () => {
    expect(
      rewardStatusChangeError(RewardStatus.PAID, RewardStatus.REJECTED),
    ).toMatch(/PAID reward cannot be rejected/);
  });

  it("only lets a REJECTED reward be restored to PENDING", () => {
    expect(
      rewardStatusChangeError(RewardStatus.REJECTED, RewardStatus.PENDING),
    ).toBeNull();
    expect(
      rewardStatusChangeError(RewardStatus.REJECTED, RewardStatus.PAID),
    ).toMatch(/restored to PENDING first/);
    expect(
      rewardStatusChangeError(RewardStatus.REJECTED, RewardStatus.FAILED),
    ).toMatch(/restored to PENDING first/);
  });

  it("treats an unchanged status as allowed", () => {
    expect(
      rewardStatusChangeError(RewardStatus.REJECTED, RewardStatus.REJECTED),
    ).toBeNull();
    expect(
      rewardStatusChangeError(RewardStatus.PAID, RewardStatus.PAID),
    ).toBeNull();
  });

  it("leaves the existing PENDING/PAID/FAILED transitions alone", () => {
    expect(
      rewardStatusChangeError(RewardStatus.PENDING, RewardStatus.PAID),
    ).toBeNull();
    expect(
      rewardStatusChangeError(RewardStatus.PAID, RewardStatus.FAILED),
    ).toBeNull();
  });
});

describe("registerRewardSchema rewardStatus", () => {
  const base = {
    installerCode: "FR-001",
    cityOfInstallation: "Sargodha",
    productModel: "X1 Genki - 6KW",
    serialNumber: "HL1060K5785069",
    inverterSerialNumber: "INV-1",
    rewardAmount: 5000,
  };

  it("does not allow registering a reward as REJECTED", () => {
    expect(
      registerRewardSchema.safeParse({
        ...base,
        rewardStatus: RewardStatus.REJECTED,
      }).success,
    ).toBe(false);
  });

  it("still defaults to PENDING", () => {
    const parsed = registerRewardSchema.parse(base);
    expect(parsed.rewardStatus).toBe(RewardStatus.PENDING);
  });
});
