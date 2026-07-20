import { describe, it, expect } from "vitest";
import {
  warningWindowStart,
  warningExpiresAt,
  isWarningActive,
  rewardEarnsWarning,
  healthStatus,
} from "@/lib/warnings";
import { FALSE_CLAIM_REASON } from "@/lib/constants";
import { ProductStatus } from "@/types/rewards";

const NOW = new Date("2026-07-20T12:00:00.000Z");

describe("warningWindowStart", () => {
  it("opens the window exactly six months back", () => {
    expect(warningWindowStart(NOW).toISOString()).toBe(
      "2026-01-20T12:00:00.000Z"
    );
  });
});

describe("warningExpiresAt", () => {
  it("expires six months after issue", () => {
    expect(warningExpiresAt(new Date("2026-03-05T08:00:00.000Z")).toISOString()).toBe(
      "2026-09-05T08:00:00.000Z"
    );
  });
});

describe("isWarningActive", () => {
  it("counts a warning just inside the six-month window", () => {
    // One day short of six months old.
    const issuedAt = new Date("2026-01-21T12:00:00.000Z");
    expect(isWarningActive({ issuedAt, revokedAt: null }, NOW)).toBe(true);
  });

  it("drops a warning just outside the six-month window", () => {
    // One day past six months old.
    const issuedAt = new Date("2026-01-19T12:00:00.000Z");
    expect(isWarningActive({ issuedAt, revokedAt: null }, NOW)).toBe(false);
  });

  it("drops a revoked warning even when it is recent", () => {
    const issuedAt = new Date("2026-07-19T12:00:00.000Z");
    expect(
      isWarningActive({ issuedAt, revokedAt: new Date("2026-07-20") }, NOW)
    ).toBe(false);
  });
});

describe("rewardEarnsWarning", () => {
  it("warns on a rejection that is a false claim", () => {
    expect(
      rewardEarnsWarning({
        productStatus: ProductStatus.REJECTED,
        rejectionReason: FALSE_CLAIM_REASON,
      })
    ).toBe(true);
  });

  it("does not warn on a rejection for any other reason", () => {
    expect(
      rewardEarnsWarning({
        productStatus: ProductStatus.REJECTED,
        rejectionReason: "Duplicate Serial Number",
      })
    ).toBe(false);
  });

  it("does not warn on a not-eligible product", () => {
    expect(
      rewardEarnsWarning({
        productStatus: ProductStatus.NOT_ELIGIBLE,
        rejectionReason: FALSE_CLAIM_REASON,
      })
    ).toBe(false);
  });

  it("does not warn on an eligible product", () => {
    expect(
      rewardEarnsWarning({ productStatus: ProductStatus.ELIGIBLE })
    ).toBe(false);
  });
});

describe("healthStatus", () => {
  it("is good with no warnings", () => {
    expect(healthStatus(0, 5, false)).toBe("GOOD");
  });

  it("is at risk with any warning below the threshold", () => {
    expect(healthStatus(1, 5, false)).toBe("AT_RISK");
    expect(healthStatus(4, 5, false)).toBe("AT_RISK");
  });

  it("reports suspended regardless of count once the flag is set", () => {
    expect(healthStatus(5, 5, true)).toBe("SUSPENDED");
    expect(healthStatus(0, 5, true)).toBe("SUSPENDED");
  });
});
