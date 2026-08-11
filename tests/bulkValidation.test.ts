import { describe, it, expect } from "vitest";
import {
  BatchDuplicateTracker,
  normalizeAccountNumber,
  normalizeIdentity,
} from "@/lib/bulkValidation";

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

describe("normalizeIdentity", () => {
  it("ignores case, surrounding and repeated inner whitespace", () => {
    expect(normalizeIdentity("  ali   raza ")).toBe(
      normalizeIdentity("Ali Raza")
    );
  });

  it("still separates genuinely different values", () => {
    expect(normalizeIdentity("INS-001")).not.toBe(normalizeIdentity("INS-002"));
  });

  it("maps null/undefined to an empty key", () => {
    expect(normalizeIdentity(null)).toBe("");
    expect(normalizeIdentity(undefined)).toBe("");
  });
});

describe("normalizeAccountNumber", () => {
  it("strips non-digits from a bank account number", () => {
    expect(normalizeAccountNumber("1234-5678 9012")).toBe("123456789012");
  });

  it("reduces mobile-wallet numbers to the 03XXXXXXXXX form", () => {
    const expected = "03001234567";
    expect(normalizeAccountNumber("+92 300 1234567", true)).toBe(expected);
    expect(normalizeAccountNumber("923001234567", true)).toBe(expected);
    expect(normalizeAccountNumber("03001234567", true)).toBe(expected);
  });

  it("does not apply the phone rewrite to non-mobile banks", () => {
    expect(normalizeAccountNumber("923001234567", false)).toBe("923001234567");
  });

  it("leaves an empty value empty rather than producing a bare 0", () => {
    expect(normalizeAccountNumber("", true)).toBe("");
    expect(normalizeAccountNumber(undefined, true)).toBe("");
  });
});
