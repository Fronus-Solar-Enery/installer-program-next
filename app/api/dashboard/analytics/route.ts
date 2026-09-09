import { NextRequest } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import Installer from "@/models/Installer";
import InstallerReward from "@/models/InstallerReward";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateParam } from "@/lib/validateRequest";
import { pickGranularity, previousPeriod, type Granularity } from "@/lib/analytics";

/**
 * Dashboard analytics — the aggregations behind the trend, geography, cohort
 * and payment sections of the dashboard.
 *
 * Deliberately separate from `/api/dashboard/summary`: summary answers "what
 * are the headline numbers right now" and is cheap, while this route runs the
 * heavier time-bucketing and installer-join work. Splitting them keeps the fast
 * numbers fast and lets the client render the KPI row before the deep charts
 * land.
 *
 * All windows are honoured through the same `startDate`/`endDate` pair the rest
 * of the dashboard uses. With no range the route falls back to the full history
 * of the collection and reports no previous-period comparison, because there is
 * nothing meaningful to compare "all time" against.
 */

const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "must be an ISO date string");

const querySchema = z.object({
  startDate: isoDate.nullable(),
  endDate: isoDate.nullable(),
});

/** Reward-status predicates, reused across every `$group` in this file. */
const PAID = { $eq: ["$rewardStatus", "PAID"] };
const PENDING = { $eq: ["$rewardStatus", "PENDING"] };
const FAILED = { $eq: ["$rewardStatus", "FAILED"] };
const REFERRER_AMOUNT = { $ifNull: ["$referrerRewardAmount", 0] };

/** The totals every window (current and previous) reports, in one shape. */
const totalsGroup = {
  _id: null,
  installations: { $sum: 1 },
  amount: { $sum: "$rewardAmount" },
  referrerAmount: { $sum: REFERRER_AMOUNT },
  paid: { $sum: { $cond: [PAID, 1, 0] } },
  pending: { $sum: { $cond: [PENDING, 1, 0] } },
  failed: { $sum: { $cond: [FAILED, 1, 0] } },
  paidAmount: { $sum: { $cond: [PAID, "$rewardAmount", 0] } },
  pendingAmount: { $sum: { $cond: [PENDING, "$rewardAmount", 0] } },
  failedAmount: { $sum: { $cond: [FAILED, "$rewardAmount", 0] } },
  installerSet: { $addToSet: "$installer" },
} as const;

const EMPTY_TOTALS = {
  installations: 0,
  amount: 0,
  referrerAmount: 0,
  paid: 0,
  pending: 0,
  failed: 0,
  paidAmount: 0,
  pendingAmount: 0,
  failedAmount: 0,
  activeInstallers: 0,
};

type Totals = typeof EMPTY_TOTALS;

/** Normalise a `$facet` totals branch into the flat shape the client expects. */
function readTotals(rows: unknown): Totals {
  const row = Array.isArray(rows) ? rows[0] : undefined;
  if (!row || typeof row !== "object") return { ...EMPTY_TOTALS };
  const r = row as Record<string, unknown>;
  const num = (k: string) => (typeof r[k] === "number" ? (r[k] as number) : 0);
  return {
    installations: num("installations"),
    amount: num("amount"),
    referrerAmount: num("referrerAmount"),
    paid: num("paid"),
    pending: num("pending"),
    failed: num("failed"),
    paidAmount: num("paidAmount"),
    pendingAmount: num("pendingAmount"),
    failedAmount: num("failedAmount"),
    activeInstallers: Array.isArray(r.installerSet) ? r.installerSet.length : 0,
  };
}

/** A `$dateTrunc` expression over `field`, aligned with `lib/analytics`. */
function dateBucket(field: string, unit: Granularity) {
  return {
    $dateTrunc: {
      date: field,
      unit,
      binSize: 1,
      timezone: "UTC",
      ...(unit === "week" ? { startOfWeek: "monday" } : {}),
    },
  };
}

export const GET = withAuth(
  async (request: NextRequest, _context: RouteContext, _session: AuthSession) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(request.url);
      const parsed = validateParam(
        {
          startDate: searchParams.get("startDate"),
          endDate: searchParams.get("endDate"),
        },
        "date range",
        querySchema,
      );
      if (!parsed.success) return parsed.response;

      // ---------------------------------------------------------------------
      // Resolve the window. An explicit range drives both the data and the
      // previous-period baseline; without one we bucket the full history and
      // report no baseline.
      // ---------------------------------------------------------------------
      const explicitRange = Boolean(
        parsed.data.startDate && parsed.data.endDate,
      );

      let start: Date;
      let end: Date;

      if (explicitRange) {
        start = new Date(parsed.data.startDate as string);
        end = new Date(parsed.data.endDate as string);
        end.setHours(23, 59, 59, 999);
      } else {
        const [earliest] = await InstallerReward.aggregate([
          { $group: { _id: null, first: { $min: "$createdAt" } } },
        ]);
        end = new Date();
        start = earliest?.first ? new Date(earliest.first) : new Date(end);
      }

      if (start > end) [start, end] = [end, start];

      const granularity = pickGranularity(start, end);
      const previous = explicitRange ? previousPeriod(start, end) : null;

      const inCurrent = { createdAt: { $gte: start, $lte: end } };
      const scanFrom = previous ? previous.start : start;

      // ---------------------------------------------------------------------
      // A · Time series + current/previous totals.
      //
      // One scan over [previousStart, end] feeds all three branches, so the
      // period-over-period comparison costs nothing beyond the range it adds.
      // ---------------------------------------------------------------------
      const seriesPipeline = InstallerReward.aggregate([
        { $match: { createdAt: { $gte: scanFrom, $lte: end } } },
        {
          $facet: {
            buckets: [
              { $match: inCurrent },
              {
                $group: {
                  _id: dateBucket("$createdAt", granularity),
                  installations: { $sum: 1 },
                  amount: { $sum: "$rewardAmount" },
                  referrerAmount: { $sum: REFERRER_AMOUNT },
                  paid: { $sum: { $cond: [PAID, 1, 0] } },
                  pending: { $sum: { $cond: [PENDING, 1, 0] } },
                  failed: { $sum: { $cond: [FAILED, 1, 0] } },
                  paidAmount: { $sum: { $cond: [PAID, "$rewardAmount", 0] } },
                  installerSet: { $addToSet: "$installer" },
                },
              },
              {
                $project: {
                  _id: 0,
                  bucket: "$_id",
                  installations: 1,
                  amount: 1,
                  referrerAmount: 1,
                  paid: 1,
                  pending: 1,
                  failed: 1,
                  paidAmount: 1,
                  activeInstallers: { $size: "$installerSet" },
                },
              },
              { $sort: { bucket: 1 } },
            ],
            current: [{ $match: inCurrent }, { $group: totalsGroup }],
            previous: previous
              ? [
                  {
                    $match: {
                      createdAt: { $gte: previous.start, $lte: previous.end },
                    },
                  },
                  { $group: totalsGroup },
                ]
              : // A $facet branch must be a non-empty pipeline, and Mongo rejects
                // `$limit: 0` outright ("the limit must be positive"). Matching
                // on a field no document has is the portable empty branch.
                [{ $match: { _id: { $exists: false } } }],
          },
        },
      ]);

      // ---------------------------------------------------------------------
      // B · Geography + installer cohorts.
      //
      // Collapsing to one row per installer BEFORE joining the installers
      // collection turns the lookup from once-per-reward into
      // once-per-active-installer, which is the whole cost of this pipeline.
      // ---------------------------------------------------------------------
      const cohortPipeline = InstallerReward.aggregate([
        { $match: inCurrent },
        {
          $group: {
            _id: "$installer",
            installations: { $sum: 1 },
            amount: { $sum: "$rewardAmount" },
            referralAmount: { $sum: REFERRER_AMOUNT },
            paidAmount: { $sum: { $cond: [PAID, "$rewardAmount", 0] } },
            lastActivityAt: { $max: "$createdAt" },
          },
        },
        {
          $lookup: {
            from: "installers",
            localField: "_id",
            foreignField: "_id",
            as: "profile",
          },
        },
        { $unwind: "$profile" },
        {
          $facet: {
            provinces: [
              {
                $group: {
                  _id: { $ifNull: ["$profile.province", "Unspecified"] },
                  installations: { $sum: "$installations" },
                  installers: { $sum: 1 },
                  amount: { $sum: "$amount" },
                },
              },
              { $sort: { installations: -1 } },
            ],
            districts: [
              {
                $group: {
                  _id: {
                    district: { $ifNull: ["$profile.district", "Unspecified"] },
                    province: { $ifNull: ["$profile.province", "Unspecified"] },
                  },
                  installations: { $sum: "$installations" },
                  installers: { $sum: 1 },
                  amount: { $sum: "$amount" },
                },
              },
              { $sort: { installations: -1 } },
              { $limit: 12 },
            ],
            // Log-ish bands: installer output is heavily skewed, so equal-width
            // bins would pile ~90% of installers into the first bar.
            distribution: [
              {
                $bucket: {
                  groupBy: "$installations",
                  boundaries: [1, 2, 4, 7, 13, 26],
                  default: "26+",
                  output: {
                    installers: { $sum: 1 },
                    installations: { $sum: "$installations" },
                  },
                },
              },
            ],
            leaderboard: [
              { $sort: { installations: -1, amount: -1 } },
              { $limit: 10 },
              {
                $project: {
                  _id: 0,
                  installerCode: "$profile.installerCode",
                  fullName: "$profile.fullName",
                  city: "$profile.city",
                  district: "$profile.district",
                  installations: 1,
                  amount: 1,
                  referralAmount: 1,
                  paidAmount: 1,
                  lastActivityAt: 1,
                },
              },
            ],
            // Concentration uses fixed top-N cuts rather than a percentile so
            // it stays a single bounded pass with no full array materialised.
            fieldTotals: [
              {
                $group: {
                  _id: null,
                  installations: { $sum: "$installations" },
                  installers: { $sum: 1 },
                },
              },
            ],
            top10: [
              { $sort: { installations: -1 } },
              { $limit: 10 },
              { $group: { _id: null, installations: { $sum: "$installations" } } },
            ],
            top50: [
              { $sort: { installations: -1 } },
              { $limit: 50 },
              { $group: { _id: null, installations: { $sum: "$installations" } } },
            ],
          },
        },
      ]);

      // ---------------------------------------------------------------------
      // C · Reward-level breakdowns — product, city of installation, payment
      // rails and the payout lag. No installer join needed for any of these.
      // ---------------------------------------------------------------------
      const breakdownPipeline = InstallerReward.aggregate([
        { $match: inCurrent },
        {
          $facet: {
            products: [
              {
                $group: {
                  _id: "$productModel",
                  installations: { $sum: 1 },
                  amount: { $sum: "$rewardAmount" },
                },
              },
              { $sort: { installations: -1 } },
            ],
            cities: [
              {
                $match: {
                  cityOfInstallation: { $nin: [null, "", "undefined", "null"] },
                },
              },
              {
                $group: {
                  _id: "$cityOfInstallation",
                  installations: { $sum: 1 },
                  amount: { $sum: "$rewardAmount" },
                },
              },
              { $sort: { installations: -1 } },
              { $limit: 10 },
            ],
            methods: [
              {
                $group: {
                  _id: {
                    $ifNull: [
                      { $cond: [{ $eq: ["$paymentMethod", ""] }, null, "$paymentMethod"] },
                      "Unspecified",
                    ],
                  },
                  count: { $sum: 1 },
                  amount: { $sum: "$rewardAmount" },
                },
              },
              { $sort: { count: -1 } },
            ],
            banks: [
              {
                $group: {
                  _id: { $ifNull: ["$bankName", "Unspecified"] },
                  count: { $sum: 1 },
                  amount: { $sum: "$rewardAmount" },
                },
              },
              { $sort: { count: -1 } },
              { $limit: 8 },
            ],
            // Payout lag, in days from registration to the recorded sending
            // date. Clamped at 0 so a back-dated sendingDate cannot drag the
            // average negative.
            payoutLagStats: [
              { $match: { rewardStatus: "PAID", sendingDate: { $ne: null } } },
              {
                $project: {
                  days: {
                    $max: [
                      0,
                      {
                        $dateDiff: {
                          startDate: "$createdAt",
                          endDate: "$sendingDate",
                          unit: "day",
                        },
                      },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  avgDays: { $avg: "$days" },
                  maxDays: { $max: "$days" },
                  count: { $sum: 1 },
                },
              },
            ],
            payoutLagBands: [
              { $match: { rewardStatus: "PAID", sendingDate: { $ne: null } } },
              {
                $project: {
                  days: {
                    $max: [
                      0,
                      {
                        $dateDiff: {
                          startDate: "$createdAt",
                          endDate: "$sendingDate",
                          unit: "day",
                        },
                      },
                    ],
                  },
                },
              },
              {
                $bucket: {
                  groupBy: "$days",
                  boundaries: [0, 3, 8, 15, 31],
                  default: "31+",
                  output: { count: { $sum: 1 } },
                },
              },
            ],
            failedWatchlist: [
              { $match: { rewardStatus: "FAILED" } },
              { $sort: { createdAt: -1 } },
              { $limit: 8 },
              {
                $project: {
                  _id: 1,
                  installerCode: 1,
                  productModel: 1,
                  serialNumber: 1,
                  rewardAmount: 1,
                  bankName: 1,
                  createdAt: 1,
                },
              },
            ],
          },
        },
      ]);

      // ---------------------------------------------------------------------
      // D · First-ever activity per installer, bucketed.
      //
      // "New" means the installer's first reward across all history landed in
      // this bucket — which is why the `$group` deliberately runs unfiltered
      // before the range `$match`. Filtering first would relabel a long-time
      // installer as new every time the range moved.
      // ---------------------------------------------------------------------
      const firstActivityPipeline = InstallerReward.aggregate([
        { $group: { _id: "$installer", firstAt: { $min: "$createdAt" } } },
        { $match: { firstAt: { $gte: start, $lte: end } } },
        {
          $lookup: {
            from: "installers",
            localField: "_id",
            foreignField: "_id",
            as: "profile",
          },
        },
        { $unwind: "$profile" },
        {
          $facet: {
            buckets: [
              {
                $group: {
                  _id: dateBucket("$firstAt", granularity),
                  newInstallers: { $sum: 1 },
                },
              },
              { $project: { _id: 0, bucket: "$_id", newInstallers: 1 } },
              { $sort: { bucket: 1 } },
            ],
            activationLag: [
              {
                $project: {
                  days: {
                    $max: [
                      0,
                      {
                        $dateDiff: {
                          startDate: "$profile.createdAt",
                          endDate: "$firstAt",
                          unit: "day",
                        },
                      },
                    ],
                  },
                },
              },
              {
                $group: { _id: null, avgDays: { $avg: "$days" }, count: { $sum: 1 } },
              },
            ],
          },
        },
      ]);

      // E · Installer registrations per bucket — the top of the funnel, and the
      // denominator for "how many of the people we signed up ever submitted".
      const registrationsPipeline = Installer.aggregate([
        { $match: inCurrent },
        {
          $group: {
            _id: dateBucket("$createdAt", granularity),
            registrations: { $sum: 1 },
          },
        },
        { $project: { _id: 0, bucket: "$_id", registrations: 1 } },
        { $sort: { bucket: 1 } },
      ]);

      const [
        [seriesFacet],
        [cohortFacet],
        [breakdownFacet],
        [firstActivityFacet],
        registrationRows,
        totalInstallers,
        registeredInstallersAllTime,
      ] = await Promise.all([
        seriesPipeline,
        cohortPipeline,
        breakdownPipeline,
        firstActivityPipeline,
        registrationsPipeline,
        Installer.countDocuments(explicitRange ? inCurrent : {}),
        // The whole roster, ignoring the range. Activation rate compares the
        // installers active in this period against everyone ever registered;
        // dividing by "registered in this period" would put a long-standing
        // installer in the numerator but not the denominator and push the rate
        // past 100%.
        explicitRange
          ? Installer.countDocuments({})
          : Promise.resolve(null as number | null),
      ]);

      // -- shape the response -------------------------------------------------

      const current = readTotals(seriesFacet?.current);
      const previousTotals = previous ? readTotals(seriesFacet?.previous) : null;

      const first = <T>(rows: unknown): T | null =>
        Array.isArray(rows) && rows.length ? (rows[0] as T) : null;

      const fieldTotals = first<{ installations: number; installers: number }>(
        cohortFacet?.fieldTotals,
      );
      const top10 = first<{ installations: number }>(cohortFacet?.top10);
      const top50 = first<{ installations: number }>(cohortFacet?.top50);
      const lagStats = first<{ avgDays: number; maxDays: number; count: number }>(
        breakdownFacet?.payoutLagStats,
      );
      const activationLag = first<{ avgDays: number; count: number }>(
        firstActivityFacet?.activationLag,
      );

      const products = (breakdownFacet?.products ?? []) as Array<{
        _id: string;
        installations: number;
        amount: number;
      }>;

      return ApiResponse.success({
        granularity,
        range: {
          start: start.toISOString(),
          end: end.toISOString(),
          previousStart: previous?.start.toISOString() ?? null,
          previousEnd: previous?.end.toISOString() ?? null,
          hasBaseline: Boolean(previous),
        },
        series: (seriesFacet?.buckets ?? []).map(
          (b: Record<string, unknown>) => ({
            ...b,
            bucket: new Date(b.bucket as string).toISOString(),
          }),
        ),
        registrations: (registrationRows ?? []).map(
          (r: { bucket: Date; registrations: number }) => ({
            bucket: new Date(r.bucket).toISOString(),
            registrations: r.registrations,
          }),
        ),
        newInstallers: (firstActivityFacet?.buckets ?? []).map(
          (b: { bucket: Date; newInstallers: number }) => ({
            bucket: new Date(b.bucket).toISOString(),
            newInstallers: b.newInstallers,
          }),
        ),
        totals: { current, previous: previousTotals },
        totalInstallers,
        registeredInstallers: registeredInstallersAllTime ?? totalInstallers,
        geography: {
          provinces: (cohortFacet?.provinces ?? []).map(
            (p: {
              _id: string;
              installations: number;
              installers: number;
              amount: number;
            }) => ({
              name: p._id,
              installations: p.installations,
              installers: p.installers,
              amount: p.amount,
            }),
          ),
          districts: (cohortFacet?.districts ?? []).map(
            (d: {
              _id: { district: string; province: string };
              installations: number;
              installers: number;
              amount: number;
            }) => ({
              name: d._id.district,
              province: d._id.province,
              installations: d.installations,
              installers: d.installers,
              amount: d.amount,
            }),
          ),
          cities: (breakdownFacet?.cities ?? []).map(
            (c: { _id: string; installations: number; amount: number }) => ({
              name: c._id,
              installations: c.installations,
              amount: c.amount,
            }),
          ),
        },
        cohorts: {
          distribution: (cohortFacet?.distribution ?? []).map(
            (d: {
              _id: number | string;
              installers: number;
              installations: number;
            }) => ({
              band: d._id,
              installers: d.installers,
              installations: d.installations,
            }),
          ),
          leaderboard: cohortFacet?.leaderboard ?? [],
          concentration: {
            totalInstallations: fieldTotals?.installations ?? 0,
            activeInstallers: fieldTotals?.installers ?? 0,
            top10Installations: top10?.installations ?? 0,
            top50Installations: top50?.installations ?? 0,
          },
          activationLagDays: activationLag?.avgDays ?? null,
          activatedInstallers: activationLag?.count ?? 0,
        },
        payments: {
          methods: (breakdownFacet?.methods ?? []).map(
            (m: { _id: string; count: number; amount: number }) => ({
              name: m._id,
              count: m.count,
              amount: m.amount,
            }),
          ),
          banks: (breakdownFacet?.banks ?? []).map(
            (b: { _id: string; count: number; amount: number }) => ({
              name: b._id,
              count: b.count,
              amount: b.amount,
            }),
          ),
          payoutLag: {
            avgDays: lagStats?.avgDays ?? null,
            maxDays: lagStats?.maxDays ?? null,
            paidWithDate: lagStats?.count ?? 0,
            bands: (breakdownFacet?.payoutLagBands ?? []).map(
              (b: { _id: number | string; count: number }) => ({
                band: b._id,
                count: b.count,
              }),
            ),
          },
          failedWatchlist: breakdownFacet?.failedWatchlist ?? [],
        },
        products: products.map((p) => ({
          model: p._id,
          installations: p.installations,
          amount: p.amount,
        })),
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
);
