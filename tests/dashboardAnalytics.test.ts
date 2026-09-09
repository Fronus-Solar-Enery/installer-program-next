import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/mongodb", () => ({ default: vi.fn() }));
vi.mock("@/models/Installer", () => ({
  default: { aggregate: vi.fn(), countDocuments: vi.fn() },
}));
vi.mock("@/models/InstallerReward", () => ({
  default: { aggregate: vi.fn() },
}));

import { auth } from "@/lib/auth";
import Installer from "@/models/Installer";
import InstallerReward from "@/models/InstallerReward";
import { GET } from "@/app/api/dashboard/analytics/route";

const mockAuth = vi.mocked(auth);
const rewardAggregate = vi.mocked(InstallerReward.aggregate);
const installerAggregate = vi.mocked(Installer.aggregate);
const countDocuments = vi.mocked(Installer.countDocuments);

const ctx = { params: Promise.resolve({}) } as never;

const signedIn = () =>
  mockAuth.mockResolvedValue({
    user: { id: "team-1", role: "USER", email: "t@x.com", name: "T" },
    expires: "",
  } as never);

/**
 * The route fires four reward aggregations (plus one more when the range is
 * open-ended, to find the earliest reward). Queue them in call order.
 */
function queueRewardAggregations({
  withEarliestProbe,
}: {
  withEarliestProbe: boolean;
}) {
  if (withEarliestProbe) {
    rewardAggregate.mockResolvedValueOnce([
      { _id: null, first: new Date("2026-01-01T00:00:00Z") },
    ] as never);
  }
  // A · series + totals
  rewardAggregate.mockResolvedValueOnce([
    {
      buckets: [
        {
          bucket: new Date("2026-03-02T00:00:00Z"),
          installations: 3,
          amount: 9_000,
          referrerAmount: 500,
          paid: 2,
          pending: 1,
          failed: 0,
          paidAmount: 6_000,
          activeInstallers: 2,
        },
      ],
      current: [
        {
          _id: null,
          installations: 3,
          amount: 9_000,
          referrerAmount: 500,
          paid: 2,
          pending: 1,
          failed: 0,
          paidAmount: 6_000,
          pendingAmount: 3_000,
          failedAmount: 0,
          installerSet: ["a", "b"],
        },
      ],
      previous: [
        {
          _id: null,
          installations: 2,
          amount: 6_000,
          referrerAmount: 0,
          paid: 1,
          pending: 1,
          failed: 0,
          paidAmount: 3_000,
          pendingAmount: 3_000,
          failedAmount: 0,
          installerSet: ["a"],
        },
      ],
    },
  ] as never);
  // B · geography + cohorts
  rewardAggregate.mockResolvedValueOnce([
    {
      provinces: [{ _id: "Punjab", installations: 3, installers: 2, amount: 9_000 }],
      districts: [
        {
          _id: { district: "Lahore", province: "Punjab" },
          installations: 3,
          installers: 2,
          amount: 9_000,
        },
      ],
      distribution: [{ _id: 1, installers: 1, installations: 1 }],
      leaderboard: [],
      fieldTotals: [{ _id: null, installations: 3, installers: 2 }],
      top10: [{ _id: null, installations: 3 }],
      top50: [{ _id: null, installations: 3 }],
    },
  ] as never);
  // C · reward-level breakdowns
  rewardAggregate.mockResolvedValueOnce([
    {
      products: [{ _id: "FR-5K", installations: 3, amount: 9_000 }],
      cities: [{ _id: "Lahore", installations: 3, amount: 9_000 }],
      methods: [{ _id: "BANK", count: 3, amount: 9_000 }],
      banks: [{ _id: "Meezan", count: 3, amount: 9_000 }],
      payoutLagStats: [{ _id: null, avgDays: 4.5, maxDays: 9, count: 2 }],
      payoutLagBands: [{ _id: 3, count: 2 }],
      failedWatchlist: [],
    },
  ] as never);
  // D · first activity
  rewardAggregate.mockResolvedValueOnce([
    {
      buckets: [{ bucket: new Date("2026-03-02T00:00:00Z"), newInstallers: 1 }],
      activationLag: [{ _id: null, avgDays: 2.5, count: 1 }],
    },
  ] as never);
}

describe("dashboard analytics route", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    rewardAggregate.mockReset();
    installerAggregate.mockReset();
    countDocuments.mockReset();
    installerAggregate.mockResolvedValue([
      { bucket: new Date("2026-03-02T00:00:00Z"), registrations: 4 },
    ] as never);
    countDocuments.mockResolvedValue(12 as never);
  });

  it("401s when signed out and never touches the database", async () => {
    mockAuth.mockResolvedValue(null as never);

    const response = await GET(
      new NextRequest("http://localhost/api/dashboard/analytics"),
      ctx,
    );

    expect(response.status).toBe(401);
    expect(rewardAggregate).not.toHaveBeenCalled();
  });

  it("rejects a malformed date without running any aggregation", async () => {
    signedIn();

    const response = await GET(
      new NextRequest(
        "http://localhost/api/dashboard/analytics?startDate=not-a-date&endDate=2026-03-31",
      ),
      ctx,
    );

    expect(response.status).toBe(400);
    expect(rewardAggregate).not.toHaveBeenCalled();
  });

  it("returns current and previous totals for an explicit range", async () => {
    signedIn();
    queueRewardAggregations({ withEarliestProbe: false });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/dashboard/analytics?startDate=2026-03-01T00:00:00.000Z&endDate=2026-03-31T00:00:00.000Z",
      ),
      ctx,
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.range.hasBaseline).toBe(true);
    expect(payload.data.totals.current).toMatchObject({
      installations: 3,
      amount: 9_000,
      paidAmount: 6_000,
      activeInstallers: 2,
    });
    expect(payload.data.totals.previous).toMatchObject({
      installations: 2,
      activeInstallers: 1,
    });
    // A 31-day window buckets by day.
    expect(payload.data.granularity).toBe("day");
  });

  it("reports no baseline for an open-ended range", async () => {
    signedIn();
    queueRewardAggregations({ withEarliestProbe: true });

    const response = await GET(
      new NextRequest("http://localhost/api/dashboard/analytics"),
      ctx,
    );
    const payload = await response.json();

    expect(payload.data.range.hasBaseline).toBe(false);
    expect(payload.data.totals.previous).toBeNull();
    // No range means no previousStart to scan back to.
    expect(payload.data.range.previousStart).toBeNull();
  });

  it("flattens the facets into the shape the dashboard consumes", async () => {
    signedIn();
    queueRewardAggregations({ withEarliestProbe: false });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/dashboard/analytics?startDate=2026-03-01T00:00:00.000Z&endDate=2026-03-31T00:00:00.000Z",
      ),
      ctx,
    );
    const { data } = await response.json();

    expect(data.geography.provinces[0]).toEqual({
      name: "Punjab",
      installations: 3,
      installers: 2,
      amount: 9_000,
    });
    expect(data.geography.districts[0]).toMatchObject({
      name: "Lahore",
      province: "Punjab",
    });
    expect(data.products[0]).toEqual({
      model: "FR-5K",
      installations: 3,
      amount: 9_000,
    });
    expect(data.cohorts.concentration).toEqual({
      totalInstallations: 3,
      activeInstallers: 2,
      top10Installations: 3,
      top50Installations: 3,
    });
    expect(data.cohorts.activationLagDays).toBe(2.5);
    expect(data.payments.payoutLag).toMatchObject({
      avgDays: 4.5,
      maxDays: 9,
      paidWithDate: 2,
    });
    expect(data.registrations[0].registrations).toBe(4);
    expect(data.newInstallers[0].newInstallers).toBe(1);
    // Bucket dates cross the wire as ISO strings, not Date instances.
    expect(typeof data.series[0].bucket).toBe("string");
    // Activation rate needs the whole roster, not just the range's sign-ups.
    expect(data.registeredInstallers).toBe(12);
  });

  it("falls back to the range count for the roster when no range is set", async () => {
    signedIn();
    queueRewardAggregations({ withEarliestProbe: true });

    const response = await GET(
      new NextRequest("http://localhost/api/dashboard/analytics"),
      ctx,
    );
    const { data } = await response.json();

    // Open-ended already counts everyone, so no second count is issued.
    expect(data.registeredInstallers).toBe(data.totalInstallers);
    expect(countDocuments).toHaveBeenCalledTimes(1);
  });

  it("never emits `$limit: 0` for the empty baseline branch", async () => {
    // MongoDB rejects a zero limit outright ("the limit must be positive"), so
    // the no-baseline facet branch has to be an empty $match instead.
    signedIn();
    queueRewardAggregations({ withEarliestProbe: true });

    await GET(new NextRequest("http://localhost/api/dashboard/analytics"), ctx);

    const seriesPipeline = rewardAggregate.mock.calls[1][0] as unknown as Array<{
      $facet?: { previous?: Array<Record<string, unknown>> };
    }>;
    const previousBranch = seriesPipeline.find((stage) => stage.$facet)?.$facet
      ?.previous;
    expect(previousBranch).toEqual([{ $match: { _id: { $exists: false } } }]);
    expect(JSON.stringify(previousBranch)).not.toContain('"$limit":0');
  });

  it("derives the first-activity cohort before filtering to the range", async () => {
    signedIn();
    queueRewardAggregations({ withEarliestProbe: false });

    await GET(
      new NextRequest(
        "http://localhost/api/dashboard/analytics?startDate=2026-03-01T00:00:00.000Z&endDate=2026-03-31T00:00:00.000Z",
      ),
      ctx,
    );

    // Pipeline D: the $group that finds each installer's first-ever reward must
    // come BEFORE the range $match, or a long-time installer would be relabelled
    // "new" every time the range moved.
    const firstActivity = rewardAggregate.mock.calls[3][0] as unknown as Array<
      Record<string, unknown>
    >;
    expect(firstActivity[0]).toHaveProperty("$group");
    expect(firstActivity[1]).toHaveProperty("$match");
    expect(
      (firstActivity[0] as { $group: Record<string, unknown> }).$group,
    ).toMatchObject({ _id: "$installer", firstAt: { $min: "$createdAt" } });
  });
});
