import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "team-1",
      name: "Team Member",
      email: "team@example.com",
      role: "USER",
    },
    expires: "",
  }),
}));
vi.mock("@/lib/mongodb", () => ({ default: vi.fn() }));
vi.mock("@/models/Installer", () => ({
  default: { countDocuments: vi.fn() },
}));
vi.mock("@/models/InstallerReward", () => ({
  default: { aggregate: vi.fn() },
}));

import Installer from "@/models/Installer";
import InstallerReward from "@/models/InstallerReward";
import { GET } from "@/app/api/dashboard/summary/route";

const aggregate = vi.mocked(InstallerReward.aggregate);
const countDocuments = vi.mocked(Installer.countDocuments);

describe("dashboard summary", () => {
  beforeEach(() => {
    aggregate.mockReset();
    countDocuments.mockReset();
  });

  it("returns exact reward counts used by the rewards database cards", async () => {
    aggregate
      .mockResolvedValueOnce([
        {
          stats: [
            {
              _id: null,
              totalRewards: 4,
              paidRewards: 2,
              pendingRewards: 1,
              failedRewards: 1,
              uniqueInstallersCount: 3,
              totalAmount: 42_000,
              paidAmount: 27_000,
              pendingAmount: 10_000,
              failedAmount: 5_000,
              referrerRewardsTotal: 0,
              referrerRewardsPending: 0,
              referrerRewardsPaid: 0,
            },
          ],
          products: [],
          cities: [],
        },
      ] as never)
      .mockResolvedValueOnce([{}] as never);
    countDocuments.mockResolvedValue(5 as never);

    const response = await GET(
      new NextRequest("http://localhost/api/dashboard/summary"),
      { params: Promise.resolve({}) },
    );
    const payload = await response.json();

    expect(payload.data.stats).toMatchObject({
      totalRewards: 4,
      paidRewards: 2,
      pendingRewards: 1,
      failedRewards: 1,
      uniqueInstallersCount: 3,
      totalAmount: 42_000,
      paidAmount: 27_000,
      pendingAmount: 10_000,
    });

    const summaryPipeline = aggregate.mock.calls[0][0] as Array<{
      $facet?: { stats?: Array<{ $group?: Record<string, unknown> }> };
    }>;
    const group = summaryPipeline.find((stage) => stage.$facet)?.$facet
      ?.stats?.[0].$group;
    expect(group).toEqual(
      expect.objectContaining({
        paidRewards: expect.any(Object),
        pendingRewards: expect.any(Object),
        failedRewards: expect.any(Object),
        uniqueInstallers: expect.any(Object),
      }),
    );
  });
});
