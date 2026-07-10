import { describe, it, expect } from "vitest";
import { resolveDateRange } from "@/lib/dateRange";

const base = { customStartDate: "", customEndDate: "" };

describe("resolveDateRange", () => {
  it("returns no bounds for 'all'", () => {
    expect(resolveDateRange({ ...base, dateRange: "all" })).toEqual({
      start: null,
      end: null,
    });
  });

  it("snaps custom start to 00:00 and end to 23:59:59.999", () => {
    const { start, end } = resolveDateRange({
      dateRange: "custom",
      customStartDate: "2026-01-10",
      customEndDate: "2026-01-20",
    });
    expect(start && start.getHours()).toBe(0);
    expect(start && start.getMinutes()).toBe(0);
    expect(end && end.getHours()).toBe(23);
    expect(end && end.getMilliseconds()).toBe(999);
  });

  it("allows a one-sided custom range", () => {
    const startOnly = resolveDateRange({
      dateRange: "custom",
      customStartDate: "2026-01-10",
      customEndDate: "",
    });
    expect(startOnly.start).toBeInstanceOf(Date);
    expect(startOnly.end).toBeNull();
  });

  it("presets end at end of today and start before it", () => {
    for (const dateRange of ["today", "week", "month", "year"] as const) {
      const { start, end } = resolveDateRange({ ...base, dateRange });
      expect(start).toBeInstanceOf(Date);
      expect(end).toBeInstanceOf(Date);
      expect(start!.getTime()).toBeLessThanOrEqual(end!.getTime());
      expect(end!.getHours()).toBe(23);
    }
  });

  it("uses a calendar year (leap-safe) for 'year'", () => {
    const { start } = resolveDateRange({ ...base, dateRange: "year" });
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    expect(start!.getFullYear()).toBe(now.getFullYear() - 1);
    expect(start!.getMonth()).toBe(now.getMonth());
    expect(start!.getDate()).toBe(now.getDate());
  });
});
