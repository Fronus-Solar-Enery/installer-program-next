import { describe, it, expect } from "vitest";
import { BatchDuplicateTracker } from "@/lib/bulkValidation";

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
