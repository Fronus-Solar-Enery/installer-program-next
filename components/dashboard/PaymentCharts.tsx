"use client";

import { useMemo, useState } from "react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import { RankList, type RankRow } from "@/components/dashboard/RankList";
import { formatPkr, shareOf } from "@/lib/analytics";
import type {
  DashboardAnalytics,
  FailedReward,
} from "@/hooks/useDashboardData";
import IconMoney from "@/components/icons/Money";
import IconTimerPause from "@/components/icons/TimerPause";
import IconBank from "@/components/icons/Bank";
import IconWarning2 from "@/components/icons/Warning2";

/**
 * The money side: where every claim currently stands, how long settlement
 * takes, which rails carry it, and what has gone wrong lately.
 */

const chartConfig = {} satisfies ChartConfig;

// -- 1 · settlement funnel ---------------------------------------------------

export function SettlementFunnel({
  analytics,
  stale,
}: {
  analytics: DashboardAnalytics | undefined;
  stale?: boolean;
}) {
  const t = analytics?.totals.current;
  const claims = t?.installations ?? 0;

  const stages = [
    {
      key: "registered",
      label: "Claims registered",
      count: claims,
      amount: (t?.amount ?? 0) + (t?.referrerAmount ?? 0),
      color: SERIES.accent,
      note: "Everything submitted in this period",
    },
    {
      key: "pending",
      label: "Awaiting payment",
      count: t?.pending ?? 0,
      amount: t?.pendingAmount ?? 0,
      color: SERIES.pending,
      note: "Approved but not yet sent",
    },
    {
      key: "paid",
      label: "Settled",
      count: t?.paid ?? 0,
      amount: t?.paidAmount ?? 0,
      color: SERIES.paid,
      note: "Money out the door",
    },
    {
      key: "failed",
      label: "Failed",
      count: t?.failed ?? 0,
      amount: t?.failedAmount ?? 0,
      color: SERIES.failed,
      note: "Rejected or bounced — needs a human",
    },
  ];

  const columns: TableColumn<(typeof stages)[number]>[] = [
    { key: "stage", header: "Stage", render: (r) => r.label },
    {
      key: "count",
      header: "Claims",
      numeric: true,
      render: (r) => r.count.toLocaleString("en-US"),
    },
    {
      key: "share",
      header: "Share",
      numeric: true,
      render: (r) => `${shareOf(r.count, claims).toFixed(1)}%`,
    },
    {
      key: "amount",
      header: "Value",
      numeric: true,
      render: (r) => formatPkr(r.amount),
    },
  ];

  return (
    <AnalyticsCard
      title="Settlement funnel"
      description="Every claim in this period and where its money currently stands"
      Icon={IconMoney}
      stale={stale}
      empty={!claims}
      emptyTitle="No claims in this period"
      emptyDescription="The funnel fills as installations are registered and their rewards move through payment."
      table={{ rows: stages, columns }}
    >
      <ul className="flex min-h-0 flex-1 flex-col justify-between gap-4">
        {stages.map((stage) => {
          const share = shareOf(stage.count, claims);
          return (
            <li key={stage.key} className="space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: stage.color }}
                  />
                  <p className="text-xs font-medium text-foreground">
                    {stage.label}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {stage.count.toLocaleString("en-US")}
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                    {share.toFixed(0)}%
                  </span>
                </p>
              </div>
              <Meter
                value={share}
                color={stage.color}
                label={`${stage.label}: ${share.toFixed(0)} percent`}
              />
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-[11px] text-muted-foreground">{stage.note}</p>
                <p className="text-[11px] font-medium tabular-nums text-muted-foreground">
                  {formatPkr(stage.amount)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </AnalyticsCard>
  );
}

// -- 2 · payout lag ----------------------------------------------------------

/**
 * `$bucket` reports a band by its lower boundary; the overflow band comes back
 * as the literal default string. Both are mapped to readable ranges here.
 */
const LAG_BANDS: Array<{ key: string; label: string }> = [
  { key: "0", label: "0–2 days" },
  { key: "3", label: "3–7 days" },
  { key: "8", label: "8–14 days" },
  { key: "15", label: "15–30 days" },
  { key: "31+", label: "31+ days" },
];

export function PayoutLagChart({
  analytics,
  stale,
}: {
  analytics: DashboardAnalytics | undefined;
  stale?: boolean;
}) {
  const lag = analytics?.payments.payoutLag;

  const data = useMemo(() => {
    const byKey = new Map(
      (lag?.bands ?? []).map((b) => [String(b.band), b.count]),
    );
    return LAG_BANDS.map((band) => ({
      band: band.label,
      fullLabel: `Settled in ${band.label}`,
      count: byKey.get(band.key) ?? 0,
    }));
  }, [lag]);

  const total = data.reduce((s, d) => s + d.count, 0);

  const columns: TableColumn<(typeof data)[number]>[] = [
    { key: "band", header: "Time to payment", render: (r) => r.band },
    {
      key: "count",
      header: "Rewards",
      numeric: true,
      render: (r) => r.count.toLocaleString("en-US"),
    },
    {
      key: "share",
      header: "Share",
      numeric: true,
      render: (r) => `${shareOf(r.count, total).toFixed(1)}%`,
    },
  ];

  return (
    <AnalyticsCard
      title="Time to payment"
      description="Days between a claim being registered and its reward being sent"
      Icon={IconTimerPause}
      stale={stale}
      empty={!total}
      emptyTitle="No settled rewards to time"
      emptyDescription="This chart measures paid rewards that carry a sending date. None are recorded in this period."
      table={{ rows: data, columns }}
      footer={
        <dl className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <dt className="text-muted-foreground">Average</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {lag?.avgDays == null ? "—" : `${lag.avgDays.toFixed(1)} days`}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="text-muted-foreground">Slowest</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {lag?.maxDays == null ? "—" : `${lag.maxDays} days`}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="text-muted-foreground">Measured on</dt>
            <dd className="font-medium tabular-nums text-foreground">
              {(lag?.paidWithDate ?? 0).toLocaleString("en-US")} rewards
            </dd>
          </div>
        </dl>
      }
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-full min-h-[240px] w-full">
        <BarChart accessibilityLayer data={data} margin={{ top: 22, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis {...AXIS_PROPS} dataKey="band" />
          <YAxis {...AXIS_PROPS} width={36} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
            content={
              <SeriesTooltip
                series={{ count: { label: "Rewards" } }}
                footer={(p) =>
                  `${shareOf(Number(p.count ?? 0), total).toFixed(1)}% of settled rewards`
                }
              />
            }
          />
          {/* Ordered bands — slower is darker, so the ramp encodes duration. */}
          <Bar dataKey="count" maxBarSize={BAR_MAX} radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={d.band} fill={rampStep(data.length - 1 - i, data.length)} />
            ))}
            <LabelList
              dataKey="count"
              position="top"
              offset={8}
              className="fill-foreground text-[11px] font-medium"
              formatter={(v) => (Number(v) > 0 ? Number(v).toLocaleString("en-US") : "")}
            />
          </Bar>
        </BarChart>
      </ChartContainer>
    </AnalyticsCard>
  );
}

// -- 3 · rails ---------------------------------------------------------------

type Rail = "methods" | "banks";

export function PaymentRailsChart({
  analytics,
  stale,
}: {
  analytics: DashboardAnalytics | undefined;
  stale?: boolean;
}) {
  const [rail, setRail] = useState<Rail>("banks");
  const rows = useMemo(() => analytics?.payments[rail] ?? [], [analytics, rail]);
  const total = rows.reduce((s, r) => s + r.count, 0);

  const railRows: RankRow[] = useMemo(
    () =>
      rows.map((r) => ({
        id: r.name || "Unspecified",
        name: r.name || "Unspecified",
        meta: formatPkr(r.amount),
        value: r.count,
      })),
    [rows],
  );

  const columns: TableColumn<(typeof rows)[number]>[] = [
    {
      key: "name",
      header: rail === "banks" ? "Bank" : "Method",
      render: (r) => r.name || "Unspecified",
    },
    {
      key: "count",
      header: "Rewards",
      numeric: true,
      render: (r) => r.count.toLocaleString("en-US"),
    },
    {
      key: "share",
      header: "Share",
      numeric: true,
      render: (r) => `${shareOf(r.count, total).toFixed(1)}%`,
    },
    {
      key: "amount",
      header: "Value",
      numeric: true,
      render: (r) => formatPkr(r.amount),
    },
  ];

  return (
    <AnalyticsCard
      title="Payment rails"
      description={
        rail === "banks"
          ? "Top 8 receiving banks by number of rewards"
          : "How rewards are being sent out"
      }
      Icon={IconBank}
      stale={stale}
      empty={!rows.length}
      emptyTitle="No payment rails recorded"
      emptyDescription="Bank and method come from the reward record. None are set in this period."
      table={{ rows, columns }}
      actions={
        <ToggleGroup
          type="single"
          size="sm"
          value={rail}
          onValueChange={(v) => v && setRail(v as Rail)}
          aria-label="Payment rail"
        >
          <ToggleGroupItem value="banks">Banks</ToggleGroupItem>
          <ToggleGroupItem value="methods">Methods</ToggleGroupItem>
        </ToggleGroup>
      }
    >
      <RankList
        rows={railRows}
        ariaLabel={`${rail === "banks" ? "Banks" : "Payment methods"} ranked by rewards`}
        className="overflow-y-auto"
      />
    </AnalyticsCard>
  );
}

// -- 4 · failed watchlist ----------------------------------------------------

export function FailedWatchlist({
  analytics,
  stale,
}: {
  analytics: DashboardAnalytics | undefined;
  stale?: boolean;
}) {
  const rows = analytics?.payments.failedWatchlist ?? [];
  const failedTotal = analytics?.totals.current.failed ?? 0;
  const failedAmount = analytics?.totals.current.failedAmount ?? 0;

  const columns: TableColumn<FailedReward>[] = [
    { key: "code", header: "Installer", render: (r) => r.installerCode },
    { key: "product", header: "Product", render: (r) => r.productModel },
    { key: "serial", header: "Serial", render: (r) => r.serialNumber },
    { key: "bank", header: "Bank", render: (r) => r.bankName || "—" },
    {
      key: "amount",
      header: "Amount",
      numeric: true,
      render: (r) => formatPkr(r.rewardAmount),
    },
    {
      key: "date",
      header: "Registered",
      render: (r) =>
        new Date(r.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
    },
  ];

  return (
    <AnalyticsCard
      title="Failed payments"
      description="The most recent rewards that did not go through — each one needs a human"
      Icon={IconWarning2}
      stale={stale}
      empty={!rows.length}
      emptyTitle="Nothing has failed"
      emptyDescription="No reward in this period is in a failed state. That is the state you want this card in."
      table={{ rows, columns }}
      footer={
        <p className="text-xs text-muted-foreground">
          {failedTotal.toLocaleString("en-US")} failed{" "}
          {failedTotal === 1 ? "reward" : "rewards"} worth{" "}
          <span className="font-medium tabular-nums text-foreground">
            {formatPkr(failedAmount)}
          </span>{" "}
          in this period.
        </p>
      }
    >
      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto">
        {rows.map((row) => (
          <li key={row._id}>
            <Link
              href={`/rewards/${row._id}`}
              className="squircle flex items-center gap-3 rounded-2xl bg-muted/40 p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--color-chart-failed)" }}
              >
                <IconWarning2 className="size-4 text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {row.productModel}
                </p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  {row.installerCode} · {row.serialNumber}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {formatPkr(row.rewardAmount)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(row.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </AnalyticsCard>
  );
}
