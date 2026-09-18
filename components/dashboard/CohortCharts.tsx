"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AnalyticsCard,
  AXIS_PROPS,
  BAR_MAX,
  GRID_PROPS,
  Meter,
  rampStep,
  SeriesTooltip,
  SERIES,
  type TableColumn,
} from "@/components/dashboard/chart-kit";
import { formatPkr, shareOf, VOLUME_BANDS } from "@/lib/analytics";
import type {
  DashboardAnalytics,
  LeaderboardRow,
} from "@/hooks/useDashboardData";
import { cn } from "@/lib/utils";
import IconUsersGroupRounded from "@/components/icons/UsersGroupRounded";
import IconAward from "@/components/icons/Award";
import IconArrowRightUp from "@/components/icons/ArrowRightUp";

/**
 * Installer-side analysis: how output is spread across the field, how
 * concentrated it is, and who is at the top of it.
 */

const chartConfig = {} satisfies ChartConfig;

/**
 * Mongo's `$bucket` labels a band by its lower boundary (or the literal default
 * string for the overflow band). Map those back onto the human band labels so
 * the axis reads "2–3" rather than "2".
 */
const BAND_BY_LOWER: Record<string, string> = Object.fromEntries(
  VOLUME_BANDS.map((b) => [String(b.min), b.label]),
);

export function InstallerVolumeChart({
  analytics,
  stale,
}: {
  analytics: DashboardAnalytics | undefined;
  stale?: boolean;
}) {
  const data = useMemo(() => {
    const rows = analytics?.cohorts.distribution ?? [];
    const byLabel = new Map(
      rows.map((r) => [BAND_BY_LOWER[String(r.band)] ?? String(r.band), r]),
    );
    // Render every band, including the empty ones — a missing band would make
    // the distribution look narrower than it is.
    return VOLUME_BANDS.map((band) => ({
      band: band.label,
      fullLabel: `${band.label} installation${band.label === "1" ? "" : "s"}`,
      installers: byLabel.get(band.label)?.installers ?? 0,
      installations: byLabel.get(band.label)?.installations ?? 0,
    }));
  }, [analytics]);

  const totalInstallers = data.reduce((s, d) => s + d.installers, 0);
  const totalInstallations = data.reduce((s, d) => s + d.installations, 0);

  const columns: TableColumn<(typeof data)[number]>[] = [
    { key: "band", header: "Installations each", render: (r) => r.band },
    {
      key: "installers",
      header: "Installers",
      numeric: true,
      render: (r) => r.installers.toLocaleString("en-US"),
    },
    {
      key: "share",
      header: "Share of installers",
      numeric: true,
      render: (r) => `${shareOf(r.installers, totalInstallers).toFixed(1)}%`,
    },
    {
      key: "volume",
      header: "Installations",
      numeric: true,
      render: (r) => r.installations.toLocaleString("en-US"),
    },
  ];

  return (
    <AnalyticsCard
      title="Installations per installer"
      description="How many installers registered 1, 2–3, or more installations"
      Icon={IconUsersGroupRounded}
      stale={stale}
      empty={!totalInstallers}
      emptyTitle="No installer activity yet"
      emptyDescription="This chart will show installers by their number of registered installations."
      table={{ rows: data, columns }}
      footer={
        <p className="text-xs text-muted-foreground">
          {totalInstallers.toLocaleString("en-US")} active installers accounted
          for {totalInstallations.toLocaleString("en-US")} installations.
        </p>
      }
    >
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-full min-h-[260px] w-full"
      >
        <BarChart
          accessibilityLayer
          data={data}
          margin={{ top: 22, right: 8, left: 4, bottom: 0 }}
        >
          <CartesianGrid {...GRID_PROPS} />
          <XAxis {...AXIS_PROPS} dataKey="band" />
          <YAxis {...AXIS_PROPS} width={36} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
            content={
              <SeriesTooltip
                series={{
                  installers: { label: "Installers" },
                }}
                footer={(p) =>
                  `${Number(p.installations ?? 0).toLocaleString("en-US")} installations from this group`
                }
              />
            }
          />
          {/* The bands ARE ordered — low volume to high — so the ordinal ramp
              here encodes real order rather than restating bar height. */}
          <Bar dataKey="installers" maxBarSize={BAR_MAX} radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell
                key={d.band}
                fill={rampStep(data.length - 1 - i, data.length)}
              />
            ))}
            <LabelList
              dataKey="installers"
              position="top"
              offset={8}
              className="fill-foreground text-[11px] font-medium"
              formatter={(v) =>
                Number(v) > 0 ? Number(v).toLocaleString("en-US") : ""
              }
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </AnalyticsCard>
  );
}

// -- concentration -----------------------------------------------------------

export function ConcentrationCard({
  analytics,
  stale,
}: {
  analytics: DashboardAnalytics | undefined;
  stale?: boolean;
}) {
  const c = analytics?.cohorts.concentration;
  const total = c?.totalInstallations ?? 0;
  const top10 = shareOf(c?.top10Installations ?? 0, total);
  const top50 = shareOf(c?.top50Installations ?? 0, total);
  const activeInstallers = c?.activeInstallers ?? 0;
  const lag = analytics?.cohorts.activationLagDays;
  // All-time roster, not "registered in this period" — an installer who
  // signed up last quarter and submitted this one belongs on both sides of
  // this ratio or neither.
  const registered = analytics?.registeredInstallers ?? 0;
  const activationRate = shareOf(activeInstallers, registered);

  const rows: Array<{
    label: string;
    value: string;
    meter: number | null;
    note: string;
    tone?: string;
  }> = [
    {
      label: "Top 10 installers",
      value: `${top10.toFixed(1)}%`,
      meter: top10,
      note: "of all installations in this period",
    },
    {
      label: "Top 50 installers",
      value: `${top50.toFixed(1)}%`,
      meter: top50,
      note: "of all installations in this period",
    },
    {
      label: "Installers who submitted",
      value: `${activationRate.toFixed(1)}%`,
      meter: activationRate,
      note: `${activeInstallers.toLocaleString("en-US")} of ${registered.toLocaleString("en-US")} registered installers submitted in this period`,
      tone: SERIES.paid,
    },
  ];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-start gap-3 border-b border-border pb-4">
        <IconAward
          className="hidden md:block size-10 shrink-0 text-primary"
          fill
          duotone
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-medium leading-tight text-foreground">
            Who registered the installations
          </h3>
          <p className="mt-1 text-pretty text-xs text-muted-foreground">
            See how many installations came from the most active installers
          </p>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "flex flex-1 flex-col gap-5 pt-4 transition-opacity duration-300",
          stale && "opacity-55",
        )}
      >
        {rows.map((row) => (
          <div key={row.label} className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-medium text-foreground">{row.label}</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {row.value}
              </p>
            </div>
            {row.meter != null ? (
              <Meter
                value={row.meter}
                color={row.tone ?? SERIES.accent}
                label={`${row.label}: ${row.value}`}
              />
            ) : null}
            <p className="text-[11px] text-muted-foreground">{row.note}</p>
          </div>
        ))}

        <div className="mt-auto rounded-2xl bg-muted/50 p-3">
          <p className="text-[11px] text-muted-foreground">
            Average time from sign-up to first installation
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">
            {lag == null
              ? "No first installations yet"
              : `${lag.toFixed(1)} ${lag === 1 ? "day" : "days"}`}
          </p>
          {lag != null ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              across{" "}
              {(analytics?.cohorts.activatedInstallers ?? 0).toLocaleString(
                "en-US",
              )}{" "}
              installers who registered their first installation in this period
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

// -- leaderboard -------------------------------------------------------------

/**
 * Podium treatment for the top 3 rows — a badge tint + ring, not a chart
 * colour. This is a UI convention (gold/silver/bronze), not a data encoding,
 * so it sits outside the chart palette rules: nothing here is a mark standing
 * in for a magnitude, it is decoration that says "these three are different"
 * the way a medal does. Dual light/dark values follow the same
 * Tailwind-utility-plus-dark-variant pattern already used elsewhere on this
 * page (e.g. the emerald icon badge in DashboardCardHeader).
 */
const PODIUM_STYLES = [
  {
    badge:
      "bg-amber-100 text-amber-700 ring-1 ring-amber-400/50 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30",
    row: "bg-amber-50/60 dark:bg-amber-500/[0.06]",
    bar: "bg-amber-500 dark:bg-amber-400",
  },
  {
    badge:
      "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-400/40 dark:bg-zinc-400/15 dark:text-zinc-300 dark:ring-zinc-400/30",
    row: "bg-zinc-50/60 dark:bg-zinc-400/[0.05]",
    bar: "bg-zinc-500 dark:bg-zinc-400",
  },
  {
    badge:
      "bg-orange-100 text-orange-700 ring-1 ring-orange-400/40 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-400/30",
    row: "bg-orange-50/60 dark:bg-orange-500/[0.06]",
    bar: "bg-orange-500 dark:bg-orange-400",
  },
] as const;

export function LeaderboardCard({
  analytics,
  stale,
  className,
}: {
  analytics: DashboardAnalytics | undefined;
  stale?: boolean;
  className?: string;
}) {
  const rows = analytics?.cohorts.leaderboard ?? [];
  const top = rows[0]?.installations ?? 0;

  const columns: TableColumn<LeaderboardRow>[] = [
    { key: "name", header: "Installer", render: (r) => r.fullName },
    { key: "code", header: "Code", render: (r) => r.installerCode },
    { key: "district", header: "District", render: (r) => r.district || "—" },
    {
      key: "installations",
      header: "Installations",
      numeric: true,
      render: (r) => r.installations.toLocaleString("en-US"),
    },
    {
      key: "amount",
      header: "Reward value",
      numeric: true,
      render: (r) => formatPkr(r.amount),
    },
    {
      key: "referral",
      header: "Referral",
      numeric: true,
      render: (r) => formatPkr(r.referralAmount),
    },
  ];

  return (
    <AnalyticsCard
      title="Top installers"
      description="The ten highest-volume installers in this period, with their reward totals"
      Icon={IconAward}
      stale={stale}
      className={className}
      empty={!rows.length}
      emptyTitle="No top installers yet"
      emptyDescription="Rankings appear once installations are registered in this period."
      table={{ rows, columns }}
    >
      <ol className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {rows.map((row, i) => {
          const podium = PODIUM_STYLES[i];
          return (
            <li key={row.installerCode}>
              <Link
                href={`/installers/${row.installerCode}`}
                className={cn(
                  "squircle group flex items-center gap-3 rounded-2xl p-2.5 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  podium?.row,
                )}
              >
                <span
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full font-semibold tabular-nums",
                    podium
                      ? cn("size-9 text-sm", podium.badge)
                      : "size-8 bg-muted text-xs text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {row.fullName}
                  </p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {row.installerCode}
                    {row.district ? ` · ${row.district}` : ""}
                  </p>
                  {/* Bar-in-row: relative volume without a second chart. */}
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-chart-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        podium?.bar ?? "bg-primary",
                      )}
                      style={{
                        width: `${top > 0 ? (row.installations / top) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {row.installations.toLocaleString("en-US")}
                  </p>
                  <p className="text-[11px] tabular-nums text-muted-foreground">
                    {formatPkr(row.amount)}
                  </p>
                </div>

                <IconArrowRightUp
                  width={2}
                  className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ol>
    </AnalyticsCard>
  );
}
