import { describe, it, expect } from "vitest";
import { buildRewardsFilterParams } from "@/lib/rewardsFilterParams";
import type { RewardsFilters } from "@/hooks/useRewardsState";

const base: RewardsFilters = {
  rewardStatus: "ALL",
  sendingStart: "",
  sendingEnd: "",
  paymentMethod: "all",
  installationDate: "",
  productModel: "all",
  teamMember: "all",
  search: "",
  dateRange: "all",
  customStartDate: "",
  customEndDate: "",
  updatedAt: "",
};

describe("buildRewardsFilterParams", () => {
  it("sends nothing when no filter is set", () => {
    expect([...buildRewardsFilterParams(base).keys()]).toEqual([]);
  });

  it("omits the 'all'/'ALL' sentinels rather than sending them as values", () => {
    const params = buildRewardsFilterParams({
      ...base,
      rewardStatus: "ALL",
      paymentMethod: "all",
    });
    expect(params.get("rewardStatus")).toBeNull();
    expect(params.get("paymentMethod")).toBeNull();
  });

  it("passes real filter values through", () => {
    const params = buildRewardsFilterParams(
      {
        ...base,
        rewardStatus: "PENDING",
        paymentMethod: "UBANK",
        productModel: "Inverter X",
        teamMember: "team-1",
      },
      "SN123"
    );

    expect(params.get("search")).toBe("SN123");
    expect(params.get("rewardStatus")).toBe("PENDING");
    expect(params.get("paymentMethod")).toBe("UBANK");
    expect(params.get("productModel")).toBe("Inverter X");
    expect(params.get("registeredBy")).toBe("team-1");
  });

  it("widens an installation month to that month's bounds", () => {
    const params = buildRewardsFilterParams({
      ...base,
      installationDate: "2026-02",
    });

    expect(params.get("installationStart")).toBe("2026-02-01T00:00:00.000Z");
    // February 2026 has 28 days — the end bound must land on the 28th.
    expect(params.get("installationEnd")).toBe("2026-02-28T23:59:59.999Z");
  });

  it("sends the sending-date range with the end covering the whole day", () => {
    const params = buildRewardsFilterParams({
      ...base,
      sendingStart: "2026-03-01",
      sendingEnd: "2026-03-31",
    });

    expect(params.get("sendingStart")).toBeTruthy();
    const end = new Date(params.get("sendingEnd")!);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
  });

  it("accepts a one-sided sending range", () => {
    const params = buildRewardsFilterParams({
      ...base,
      sendingStart: "2026-03-01",
    });
    expect(params.get("sendingStart")).toBeTruthy();
    expect(params.get("sendingEnd")).toBeNull();
  });
});
