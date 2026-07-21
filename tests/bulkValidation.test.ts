import { describe, it, expect } from "vitest";
import {
  BatchDuplicateTracker,
  parseProductStatusCells,
} from "@/lib/bulkValidation";
import { ProductStatus } from "@/types/rewards";

describe("BatchDuplicateTracker", () => {
  it("returns null for the first occurrence and records its index", () => {
    const t = new BatchDuplicateTracker();
    expect(t.check("ABC", 0, "serial number")).toBeNull();
    expect(t.indexOf("ABC")).toBe(0);
  });

  it("flags a later duplicate with the first occurrence's 1-based row", () => {
    const t = new BatchDuplicateTracker();
    t.check("ABC", 2, "installer code");
    expect(t.check("ABC", 5, "installer code")).toBe(
      "Duplicate installer code in upload (first occurrence at row 3)"
    );
  });

  it("does not overwrite the first-seen index on duplicate", () => {
    const t = new BatchDuplicateTracker();
    t.check("X", 1, "CNIC");
    t.check("X", 4, "CNIC");
    expect(t.indexOf("X")).toBe(1);
  });

  it("uses the label verbatim in the message", () => {
    const t = new BatchDuplicateTracker();
    t.check("S", 0, "serial number");
    expect(t.check("S", 1, "serial number")).toContain(
      "Duplicate serial number in upload"
    );
  });
});

describe("parseProductStatusCells", () => {
  it("treats a blank status as 'leave unchanged'", () => {
    expect(parseProductStatusCells("", "")).toEqual({
      rejectionReason: undefined,
    });
    expect(parseProductStatusCells(undefined, undefined).productStatus).toBe(
      undefined
    );
  });

  it("accepts display labels and enum values, case-insensitively", () => {
    expect(parseProductStatusCells("Not Eligible", "").productStatus).toBe(
      ProductStatus.NOT_ELIGIBLE
    );
    expect(parseProductStatusCells("NOT_ELIGIBLE", "").productStatus).toBe(
      ProductStatus.NOT_ELIGIBLE
    );
    expect(parseProductStatusCells("eligible", "").productStatus).toBe(
      ProductStatus.ELIGIBLE
    );
  });

  it("flags an unrecognised status", () => {
    const result = parseProductStatusCells("Maybe", "");
    expect(result.productStatus).toBeUndefined();
    expect(result.issue).toMatch(/Invalid product status/);
  });

  it("requires a reason when rejecting", () => {
    const result = parseProductStatusCells("Rejected", "");
    expect(result.productStatus).toBe(ProductStatus.REJECTED);
    expect(result.issue).toMatch(/Rejection reason is required/);
  });

  it("keeps the reason on a rejection", () => {
    expect(parseProductStatusCells("Rejected", "False Claim")).toEqual({
      productStatus: ProductStatus.REJECTED,
      rejectionReason: "False Claim",
    });
  });

  it("drops a stale reason when the product is not rejected", () => {
    expect(
      parseProductStatusCells("Eligible", "False Claim").rejectionReason
    ).toBeUndefined();
  });
});
