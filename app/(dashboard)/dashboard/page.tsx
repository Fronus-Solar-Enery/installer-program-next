"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  resolveDashboardRange,
  TIME_PERIOD_LABELS,
  useDashboardAnalytics,
  useRecentActivity,
  type TimePeriod,
} from "@/hooks/useDashboardData";
import { buildTrendSeries, sparkValues } from "@/components/dashboard/series";
import { ChartLegendRow, SERIES } from "@/components/dashboard/chart-kit";
import { HeroFigure, StatTile } from "@/components/dashboard/StatTile";
import {
  AcquisitionChart,
  ActivityTrendChart,
  CumulativePayoutChart,
  StatusTrendChart,
} from "@/components/dashboard/TrendCharts";
import {
  ProductMixChart,
  RegionBreakdown,
} from "@/components/dashboard/GeographyCharts";
import {
  ConcentrationCard,
  InstallerVolumeChart,
  LeaderboardCard,
} from "@/components/dashboard/CohortCharts";
import {
  FailedWatchlist,
  PaymentRailsChart,
  PayoutLagChart,
  SettlementFunnel,
} from "@/components/dashboard/PaymentCharts";
import {
  RecentInstallationsFeed,
  RecentInstallersFeed,
} from "@/components/dashboard/RecentActivity";
import { RangeFilter } from "@/components/dashboard/RangeFilter";
import { DistrictDialog } from "@/components/dashboard/DistrictDialog";
import { formatPkr, percentDelta, shareOf } from "@/lib/analytics";
import { APP_REFRESH_EVENT } from "@/lib/refreshBus";
import IconDiagramUp from "@/components/icons/DiagramUp";
import IconGift from "@/components/icons/Gift";
import {
  IconActivity,
  IconChart,
  IconFilter,
  IconInstaller,
  IconProduct,
  IconReward,
} from "@/components/icons";

/**
 * Small-caps eyebrow that opens each section below the headline block.
 *
 * The headline (hero + KPI row) needs no label of its own — it's the biggest
 * type on the page and sits right under the page title. Everything after it
 * is a step down in importance, and without a visible marker the four
 * sections used to blend into one long scroll of identically-weighted cards.
 * Follows the house pattern for section eyebrows (see
 * `installers/[id]/ProfileSidebar.tsx`).
 */
function SectionHeading({
  id,
  Icon,
  title,
  description,
}: {
  id: string;
  Icon: React.ComponentType<IconProps>;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-3">
      <h2
        id={id}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        <Icon className="size-3.5" />
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-xs text-muted-foreground/80">{description}</p>
      ) : null}
    </div>
  );
}

/**
 * The team dashboard.
 *
 * Reads as a top-down argument rather than a wall of cards: the single number
 * the programme is judged on, then the four figures that qualify it, then the
 * time series that explain how it got there, then the deep cuts behind tabs.
 * Everything on the page is scoped by the one range control in the header.
 *
 * Spacing carries the same argument: 16px between cards inside one section
 * (the default grid `gap-4`), a wider gap before each new section (`pt-*`
 * layered on top of that) — so the eye reads section boundaries as real
 * boundaries instead of the page being one undifferentiated scroll.
 */
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [period, setPeriod] = useState<TimePeriod>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [district, setDistrict] = useState<string | null>(null);

  const range = useMemo(
    () => resolveDashboardRange(period, customStartDate, customEndDate),
    [period, customStartDate, customEndDate],
  );
  const rangeLabel = TIME_PERIOD_LABELS[period];

  const analyticsQuery = useDashboardAnalytics(range);
  const recentQuery = useRecentActivity();

  const analytics = analyticsQuery.data;
  const series = useMemo(() => buildTrendSeries(analytics), [analytics]);

  // First paint gets skeletons; every later fetch dims the existing render
  // instead, so changing the range never collapses the page.
  const firstLoad = analyticsQuery.isPending && !analytics;
  const refreshing = analyticsQuery.isFetching && !firstLoad;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  const refetchAnalytics = analyticsQuery.refetch;
  const refetchRecent = recentQuery.refetch;
  const refetchAll = useCallback(async () => {
    await Promise.allSettled([refetchAnalytics(), refetchRecent()]);
    // TopNavbar's spinner waits on this.
    window.dispatchEvent(new Event("app:refresh:done"));
  }, [refetchAnalytics, refetchRecent]);

  useEffect(() => {
    const handler = () => {
      void refetchAll();
    };
    window.addEventListener(APP_REFRESH_EVENT, handler);
    return () => window.removeEventListener(APP_REFRESH_EVENT, handler);
  }, [refetchAll]);

  const current = analytics?.totals.current;
  const previous = analytics?.totals.previous ?? null;
  const hasBaseline = Boolean(analytics?.range.hasBaseline && previous);
  const baselineLabel = "compared with the previous period";

  const totalValue = (current?.amount ?? 0) + (current?.referrerAmount ?? 0);
  const previousValue = previous
    ? previous.amount + previous.referrerAmount
    : 0;

  const avgReward =
    current && current.installations > 0
      ? current.amount / current.installations
      : 0;
  const previousAvg =
    previous && previous.installations > 0
      ? previous.amount / previous.installations
      : 0;

  const settlementRate = shareOf(
    current?.paidAmount ?? 0,
    current?.amount ?? 0,
  );

  if (!session) return null;

  return (
    <div className="mx-auto flex-1 space-y-4 overflow-x-hidden overflow-y-auto pb-10">
      <PageHeader
        title="Dashboard"
        Icon={IconDiagramUp}
        description="See installations, installers, and reward payments"
        action={
          <RangeFilter
            period={period}
            onPeriodChange={setPeriod}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomChange={(s, e) => {
              setCustomStartDate(s);
              setCustomEndDate(e);
            }}
            onRefresh={() => void refetchAll()}
            busy={analyticsQuery.isFetching}
          />
        }
      />

      {analyticsQuery.isError ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
            <div>
              <h2 className="text-base font-medium text-foreground">
                Dashboard data could not be loaded
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {analyticsQuery.error instanceof Error
                  ? analyticsQuery.error.message
                  : "Could not load the dashboard data."}
              </p>
            </div>
            <Button onClick={() => void analyticsQuery.refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {firstLoad ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* -- lead figure + qualifying KPIs ------------------------------ */}
          <section
            aria-label="Headline figures"
            className="grid gap-4 lg:grid-cols-12"
          >
            {/* The one number the page leads with gets a touch of depth a
                peer card doesn't — a hairline-thin radial wash in the
                existing primary token (no new hue), reinforcing what the
                type size already says: read this one first. */}
            <Card className="relative overflow-hidden lg:col-span-5">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(120% 100% at 100% 0%, var(--color-primary) 0%, transparent 55%)",
                  opacity: 0.05,
                }}
              />
              <CardContent className="relative flex h-full flex-col gap-6 py-6">
                <HeroFigure
                  label="Total rewards recorded"
                  value={totalValue}
                  delta={percentDelta(totalValue, previousValue)}
                  baselineLabel={baselineLabel}
                  hidden={!hasBaseline}
                  stale={refreshing}
                  trend={sparkValues(
                    series,
                    (p) => p.amount + p.referrerAmount,
                  )}
                  breakdown={[
                    {
                      label: "Installer rewards",
                      value: formatPkr(current?.amount ?? 0),
                      color: SERIES.accent,
                    },
                    {
                      label: "Referrer rewards",
                      value: formatPkr(current?.referrerAmount ?? 0),
                      color: SERIES.muted,
                    },
                  ]}
                />

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Installer rewards paid
                    </p>
                    <p className="text-xs font-semibold tabular-nums text-foreground">
                      {settlementRate.toFixed(1)}% paid
                    </p>
                  </div>
                  {/* One stacked meter rather than three bars: the reader is
                      comparing parts of a single whole, not three magnitudes. */}
                  <div
                    role="img"
                    aria-label={`Reward payments: ${formatPkr(
                      current?.paidAmount ?? 0,
                    )} paid, ${formatPkr(
                      current?.pendingAmount ?? 0,
                    )} pending, ${formatPkr(current?.failedAmount ?? 0)} failed`}
                    className="flex h-8 w-full gap-0.5 overflow-hidden rounded-full"
                  >
                    {(
                      [
                        ["paid", current?.paidAmount ?? 0, SERIES.paid],
                        [
                          "pending",
                          current?.pendingAmount ?? 0,
                          SERIES.pending,
                        ],
                        ["failed", current?.failedAmount ?? 0, SERIES.failed],
                      ] as const
                    ).map(([key, value, color]) => (
                      <span
                        key={key}
                        className="h-full first:rounded-l-full last:rounded-r-full"
                        style={{
                          width: `${shareOf(value, current?.amount ?? 0)}%`,
                          backgroundColor: color,
                        }}
                      />
                    ))}
                  </div>
                  <ChartLegendRow
                    items={[
                      {
                        label: "Paid",
                        color: SERIES.paid,
                        value: formatPkr(current?.paidAmount ?? 0),
                      },
                      {
                        label: "Pending",
                        color: SERIES.pending,
                        value: formatPkr(current?.pendingAmount ?? 0),
                      },
                      {
                        label: "Failed",
                        color: SERIES.failed,
                        value: formatPkr(current?.failedAmount ?? 0),
                      },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              <StatTile
                label="Installations"
                value={current?.installations ?? 0}
                Icon={IconProduct}
                trend={sparkValues(series, (p) => p.installations)}
                delta={percentDelta(
                  current?.installations ?? 0,
                  previous?.installations ?? 0,
                )}
                baselineLabel={baselineLabel}
                hidden={!hasBaseline}
                stale={refreshing}
                footnote={`${(analytics?.totalInstallers ?? 0).toLocaleString("en-US")} installers registered in ${rangeLabel.toLowerCase()}`}
              />
              <StatTile
                label="Active installers"
                value={current?.activeInstallers ?? 0}
                Icon={IconInstaller}
                trend={sparkValues(series, (p) => p.activeInstallers)}
                delta={percentDelta(
                  current?.activeInstallers ?? 0,
                  previous?.activeInstallers ?? 0,
                )}
                baselineLabel={baselineLabel}
                hidden={!hasBaseline}
                stale={refreshing}
                footnote="Registered at least one installation in this period"
              />
              <StatTile
                label="Rewards paid"
                value={current?.paidAmount ?? 0}
                prefix="Rs"
                compact
                Icon={IconReward}
                trendColor={SERIES.paid}
                trend={sparkValues(series, (p) => p.paidAmount)}
                delta={percentDelta(
                  current?.paidAmount ?? 0,
                  previous?.paidAmount ?? 0,
                )}
                baselineLabel={baselineLabel}
                hidden={!hasBaseline}
                stale={refreshing}
                footnote={`${(current?.paid ?? 0).toLocaleString("en-US")} of ${(current?.installations ?? 0).toLocaleString("en-US")} installation rewards paid`}
              />
              <StatTile
                label="Average reward"
                value={Math.round(avgReward)}
                prefix="Rs"
                Icon={IconGift}
                trend={sparkValues(series, (p) =>
                  p.installations > 0 ? p.amount / p.installations : 0,
                )}
                delta={percentDelta(avgReward, previousAvg)}
                baselineLabel={baselineLabel}
                hidden={!hasBaseline}
                stale={refreshing}
                footnote="Average installer reward per installation"
              />
            </div>
          </section>

          {/* -- trends ----------------------------------------------------- */}
          <section aria-labelledby="dashboard-trends" className="pt-4">
            <SectionHeading
              id="dashboard-trends"
              Icon={IconChart}
              title="Trends"
            />
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <ActivityTrendChart
                  series={series}
                  stale={refreshing}
                  rangeLabel={rangeLabel}
                />
              </div>
              <div className="lg:col-span-4">
                <SettlementFunnel analytics={analytics} stale={refreshing} />
              </div>
              <div className="lg:col-span-7">
                <StatusTrendChart series={series} stale={refreshing} />
              </div>
              <div className="lg:col-span-5">
                <CumulativePayoutChart series={series} stale={refreshing} />
              </div>
              <div className="lg:col-span-12">
                <AcquisitionChart series={series} stale={refreshing} />
              </div>
            </div>
          </section>

          {/* -- deep cuts -------------------------------------------------- */}
          <section aria-labelledby="dashboard-deep-dive" className="pt-6">
            <SectionHeading
              id="dashboard-deep-dive"
              Icon={IconFilter}
              title="More details"
              description="See where installations happened, installer activity, and payment details."
            />
            <Tabs defaultValue="geography" variant="segment">
              <div className="overflow-x-auto pb-1">
                <TabsList>
                  <TabsTrigger value="geography">Locations</TabsTrigger>
                  <TabsTrigger value="installers">Installers</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="geography" className="mt-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <RegionBreakdown
                    analytics={analytics}
                    stale={refreshing}
                    onSelectDistrict={setDistrict}
                  />
                  <ProductMixChart analytics={analytics} stale={refreshing} />
                </div>
              </TabsContent>

              <TabsContent value="installers" className="mt-4">
                <div className="grid gap-4 lg:grid-cols-12">
                  <div className="lg:col-span-7">
                    <InstallerVolumeChart
                      analytics={analytics}
                      stale={refreshing}
                    />
                  </div>
                  <div className="lg:col-span-5">
                    <ConcentrationCard
                      analytics={analytics}
                      stale={refreshing}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="payments" className="mt-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <PayoutLagChart analytics={analytics} stale={refreshing} />
                  <PaymentRailsChart analytics={analytics} stale={refreshing} />
                  <div className="lg:col-span-2">
                    <FailedWatchlist analytics={analytics} stale={refreshing} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </section>

          {/* -- live feeds ------------------------------------------------- */}
          <section aria-labelledby="dashboard-recent" className="pt-4">
            <SectionHeading
              id="dashboard-recent"
              Icon={IconActivity}
              title="Recent activity"
            />
            <div className="grid gap-4 md:grid-cols-3">
              {/* Who is actually leading, not buried three clicks into a tab —
                own row so it isn't squeezed against the trend beside it. */}
              <LeaderboardCard
                analytics={analytics}
                stale={refreshing}
                className="max-h-[530px]"
              />
              <RecentInstallationsFeed
                rows={recentQuery.data?.installations ?? []}
                loading={recentQuery.isPending}
              />
              <RecentInstallersFeed
                rows={recentQuery.data?.installers ?? []}
                loading={recentQuery.isPending}
              />
            </div>
          </section>
        </>
      )}

      <DistrictDialog
        district={district}
        range={range}
        rangeLabel={rangeLabel}
        onClose={() => setDistrict(null)}
      />
    </div>
  );
}

/** First-paint placeholder. Mirrors the real grid so nothing jumps on arrival. */
function DashboardSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardContent className="space-y-6 py-6">
            <div className="space-y-3">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-12 w-56" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-8 w-full rounded-full" />
            <Skeleton className="h-3 w-2/3" />
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="space-y-3 py-5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {[
          "lg:col-span-8",
          "lg:col-span-4",
          "lg:col-span-7",
          "lg:col-span-5",
        ].map((span, i) => (
          <Card key={i} className={span}>
            <CardContent className="space-y-4 py-5">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              <Skeleton className="h-[260px] w-full rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
