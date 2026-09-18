"use client";

import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
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
  ChartLegendRow,
  GRID_PROPS,
  LINE_PROPS,
  SeriesTooltip,
  SERIES,
  STACK_GAP,
  type TableColumn,
} from "@/components/dashboard/chart-kit";
import type { TrendPoint } from "@/components/dashboard/series";
import { formatPkr, formatPkrCompact, shareOf } from "@/lib/analytics";
import IconCourseUp from "@/components/icons/CourseUp";
import IconLayer from "@/components/icons/Layer";
import IconDiagramUp from "@/components/icons/DiagramUp";
import IconUserCheckRounded from "@/components/icons/UserCheckRounded";

/**
 * The time-series half of the dashboard.
 *
 * Every chart here shares one x-axis definition and one y-scale per plot — no
 * dual axes anywhere, because pairing two scales on one plot invents a
 * correlation the data does not contain. Where two measures of different
 * magnitude belong together they get separate cards instead.
 */

const chartConfig = {} satisfies ChartConfig;
const compactCount = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(1).replace(/\.0$/, "")}K` : String(v);

/**
 * Cohort series colours.
 *
 * Deliberately ordinal-ramp neutrals rather than the status palette: "returning
 * installer" is not a payment state, and reusing the paid green for it would
 * make the same colour mean two different things on one screen.
 */
const COHORT_RETURNING = "var(--color-chart-3)";
const COHORT_REGISTERED = "var(--color-chart-2)";

/** Shared x-axis: thin out ticks so a 60-day range does not stack labels. */
function xAxisInterval(length: number) {
  if (length <= 12) return 0;
  return Math.max(0, Math.ceil(length / 12) - 1);
}

// -- 1 · activity over time --------------------------------------------------

type Metric = "installations" | "payout" | "activeInstallers";

const METRICS: Record<
  Metric,
  { label: string; short: string; format: (v: number) => string; axis: (v: number) => string }
> = {
  installations: {
    label: "Installations",
    short: "Units",
    format: (v) => v.toLocaleString("en-US"),
    axis: compactCount,
  },
  payout: {
    label: "Reward value",
    short: "Payout",
    format: formatPkr,
    axis: formatPkrCompact,
  },
  activeInstallers: {
    label: "Active installers",
    short: "Installers",
    format: (v) => v.toLocaleString("en-US"),
    axis: compactCount,
  },
};

export function ActivityTrendChart({
  series,
  stale,
  rangeLabel,
}: {
  series: TrendPoint[];
  stale?: boolean;
  rangeLabel: string;
}) {
  const [metric, setMetric] = useState<Metric>("installations");
  const meta = METRICS[metric];

  const data = useMemo(
    () =>
      series.map((p) => ({
        ...p,
        value:
          metric === "payout"
            ? p.amount + p.referrerAmount
            : metric === "installations"
              ? p.installations
              : p.activeInstallers,
      })),
    [series, metric],
  );

  // Direct-label only the peak and the last point. A number on every point is
  // noise; these two are the ones the reader is actually looking for.
  const peak = useMemo(() => {
    if (!data.length) return null;
    return data.reduce((best, p) => (p.value > best.value ? p : best), data[0]);
  }, [data]);
  const last = data.length ? data[data.length - 1] : null;

  const columns: TableColumn<(typeof data)[number]>[] = [
    { key: "period", header: "Period", render: (r) => r.fullLabel },
    {
      key: "installations",
      header: "Installations",
      numeric: true,
      render: (r) => r.installations.toLocaleString("en-US"),
    },
    {
      key: "payout",
      header: "Reward value",
      numeric: true,
      render: (r) => formatPkr(r.amount + r.referrerAmount),
    },
    {
      key: "active",
      header: "Active installers",
      numeric: true,
      render: (r) => r.activeInstallers.toLocaleString("en-US"),
    },
  ];

  return (
    <AnalyticsCard
      title="Activity over time"
      description={`How ${meta.label.toLowerCase()} changed during ${rangeLabel.toLowerCase()}`}
      Icon={IconDiagramUp}
      // Widest card in the Trends row (col-span-8) and the first chart on the
      // page — the type confirms what the layout already says.
      emphasis
      stale={stale}
      empty={!series.length}
      table={{ rows: data, columns }}
      actions={
        <ToggleGroup
          type="single"
          size="sm"
          value={metric}
          onValueChange={(v) => v && setMetric(v as Metric)}
          aria-label="Metric"
        >
          {(Object.keys(METRICS) as Metric[]).map((key) => (
            <ToggleGroupItem key={key} value={key} aria-label={METRICS[key].label}>
              {METRICS[key].short}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      }
      footer={
        peak && last ? (
          <dl className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <dt className="text-muted-foreground">Peak</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {meta.format(peak.value)}
              </dd>
              <span className="text-muted-foreground">· {peak.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <dt className="text-muted-foreground">Latest</dt>
              <dd className="font-medium tabular-nums text-foreground">
                {meta.format(last.value)}
              </dd>
            </div>
          </dl>
        ) : null
      }
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-full min-h-[300px] w-full">
        <ComposedChart accessibilityLayer data={data} margin={{ top: 20, right: 12, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="trend-wash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES.accent} stopOpacity={0.16} />
              <stop offset="100%" stopColor={SERIES.accent} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis
            {...AXIS_PROPS}
            dataKey="label"
            interval={xAxisInterval(data.length)}
            minTickGap={8}
          />
          <YAxis
            {...AXIS_PROPS}
            width={52}
            allowDecimals={false}
            tickFormatter={meta.axis}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-chart-grid)", strokeWidth: 1 }}
            content={
              <SeriesTooltip
                series={{ value: { label: meta.label, format: meta.format } }}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill="url(#trend-wash)"
            isAnimationActive={false}
          />
          <Line {...LINE_PROPS} type="monotone" dataKey="value" stroke={SERIES.accent} />
          {peak ? (
            <ReferenceDot
              x={peak.label}
              y={peak.value}
              r={4}
              fill={SERIES.accent}
              stroke={SERIES.surface}
              strokeWidth={2}
              label={{
                value: meta.format(peak.value),
                position: "top",
                offset: 10,
                className: "fill-foreground text-[11px] font-medium",
              }}
            />
          ) : null}
        </ComposedChart>
      </ChartContainer>
    </AnalyticsCard>
  );
}

// -- 2 · payment status over time -------------------------------------------

export function StatusTrendChart({
  series,
  stale,
}: {
  series: TrendPoint[];
  stale?: boolean;
}) {
  const totals = useMemo(
    () =>
      series.reduce(
        (acc, p) => ({
          paid: acc.paid + p.paid,
          pending: acc.pending + p.pending,
          failed: acc.failed + p.failed,
        }),
        { paid: 0, pending: 0, failed: 0 },
      ),
    [series],
  );
  const grand = totals.paid + totals.pending + totals.failed;

  const columns: TableColumn<TrendPoint>[] = [
    { key: "period", header: "Period", render: (r) => r.fullLabel },
    { key: "paid", header: "Paid", numeric: true, render: (r) => r.paid },
    { key: "pending", header: "Pending", numeric: true, render: (r) => r.pending },
    { key: "failed", header: "Failed", numeric: true, render: (r) => r.failed },
  ];

  return (
    <AnalyticsCard
      title="Payment status over time"
      description="How many installation rewards were paid, are waiting for payment, or failed"
      Icon={IconLayer}
      stale={stale}
      empty={!grand}
      table={{ rows: series, columns }}
      footer={
        <ChartLegendRow
          items={[
            {
              label: "Paid",
              color: SERIES.paid,
              value: `${shareOf(totals.paid, grand).toFixed(0)}%`,
            },
            {
              label: "Pending",
              color: SERIES.pending,
              value: `${shareOf(totals.pending, grand).toFixed(0)}%`,
            },
            {
              label: "Failed",
              color: SERIES.failed,
              value: `${shareOf(totals.failed, grand).toFixed(0)}%`,
            },
          ]}
        />
      }
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-full min-h-[280px] w-full">
        <BarChart accessibilityLayer data={series} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis
            {...AXIS_PROPS}
            dataKey="label"
            interval={xAxisInterval(series.length)}
            minTickGap={8}
          />
          <YAxis {...AXIS_PROPS} width={40} allowDecimals={false} tickFormatter={compactCount} />
          <Tooltip
            cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
            content={
              <SeriesTooltip
                series={{
                  paid: { label: "Paid" },
                  pending: { label: "Pending" },
                  failed: { label: "Failed" },
                }}
                footer={(p) => {
                  const total =
                    Number(p.paid ?? 0) + Number(p.pending ?? 0) + Number(p.failed ?? 0);
                  return `${total.toLocaleString("en-US")} installations in this period`;
                }}
              />
            }
          />
          {/* The surface-coloured stroke is the 2px gap between segments — it
              paints card colour into the seam rather than outlining the mark. */}
          <Bar dataKey="paid" stackId="s" fill={SERIES.paid} maxBarSize={BAR_MAX} {...STACK_GAP} />
          <Bar
            dataKey="pending"
            stackId="s"
            fill={SERIES.pending}
            maxBarSize={BAR_MAX}
            {...STACK_GAP}
          />
          <Bar
            dataKey="failed"
            stackId="s"
            fill={SERIES.failed}
            maxBarSize={BAR_MAX}
            radius={[4, 4, 0, 0]}
            {...STACK_GAP}
          />
        </BarChart>
      </ChartContainer>
    </AnalyticsCard>
  );
}

// -- 3 · cumulative payout ---------------------------------------------------

export function CumulativePayoutChart({
  series,
  stale,
}: {
  series: TrendPoint[];
  stale?: boolean;
}) {
  const last = series.length ? series[series.length - 1] : null;
  const outstanding = last ? last.cumulativeAmount - last.cumulativePaid : 0;

  const columns: TableColumn<TrendPoint>[] = [
    { key: "period", header: "Period", render: (r) => r.fullLabel },
    {
      key: "accrued",
      header: "Rewards recorded",
      numeric: true,
      render: (r) => formatPkr(r.cumulativeAmount),
    },
    {
      key: "paid",
      header: "Rewards paid",
      numeric: true,
      render: (r) => formatPkr(r.cumulativePaid),
    },
  ];

  return (
    <AnalyticsCard
      title="Rewards recorded and paid over time"
      description="Compare total installer rewards recorded with rewards paid so far"
      Icon={IconCourseUp}
      stale={stale}
      empty={!series.length}
      table={{ rows: series, columns }}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ChartLegendRow
            items={[
              { label: "Recorded", color: SERIES.accent },
              { label: "Paid", color: SERIES.paid },
            ]}
          />
          <p className="text-xs text-muted-foreground">
            Not yet paid{" "}
            <span className="font-medium tabular-nums text-foreground">
              {formatPkr(outstanding)}
            </span>
          </p>
        </div>
      }
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-full min-h-[280px] w-full">
        <ComposedChart accessibilityLayer data={series} margin={{ top: 20, right: 12, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="accrued-wash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES.accent} stopOpacity={0.14} />
              <stop offset="100%" stopColor={SERIES.accent} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis
            {...AXIS_PROPS}
            dataKey="label"
            interval={xAxisInterval(series.length)}
            minTickGap={8}
          />
          {/* Accrued is monotonically non-decreasing, so its last point is
              always the series peak. With no domain padding that peak sits
              exactly on the axis max — an 8px margin and a "nice" rounded
              tick aren't reliably enough headroom, and the 2px stroke reads
              as clipped against the card's rounded top edge. 12% headroom
              above the actual max, not just the rounded tick, fixes it
              regardless of what values land in a given range. */}
          <YAxis
            {...AXIS_PROPS}
            width={58}
            tickFormatter={formatPkrCompact}
            domain={[0, (max: number) => Math.ceil(max * 1.12)]}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-chart-grid)", strokeWidth: 1 }}
            content={
              <SeriesTooltip
                series={{
                  cumulativeAmount: { label: "Recorded", format: formatPkr },
                  cumulativePaid: { label: "Paid", format: formatPkr },
                }}
                footer={(p) =>
                  `Not yet paid ${formatPkr(
                    Number(p.cumulativeAmount ?? 0) - Number(p.cumulativePaid ?? 0),
                  )}`
                }
              />
            }
          />
          <Area
            type="monotone"
            dataKey="cumulativeAmount"
            stroke="none"
            fill="url(#accrued-wash)"
            isAnimationActive={false}
          />
          <Line
            {...LINE_PROPS}
            type="monotone"
            dataKey="cumulativeAmount"
            stroke={SERIES.accent}
          />
          <Line
            {...LINE_PROPS}
            type="monotone"
            dataKey="cumulativePaid"
            stroke={SERIES.paid}
          />
        </ComposedChart>
      </ChartContainer>
    </AnalyticsCard>
  );
}

// -- 4 · acquisition & activation -------------------------------------------

export function AcquisitionChart({
  series,
  stale,
}: {
  series: TrendPoint[];
  stale?: boolean;
}) {
  const totals = useMemo(
    () =>
      series.reduce(
        (acc, p) => ({
          registrations: acc.registrations + p.registrations,
          newInstallers: acc.newInstallers + p.newInstallers,
          returning: acc.returning + p.returningInstallers,
        }),
        { registrations: 0, newInstallers: 0, returning: 0 },
      ),
    [series],
  );

  const columns: TableColumn<TrendPoint>[] = [
    { key: "period", header: "Period", render: (r) => r.fullLabel },
    {
      key: "registrations",
      header: "Registered",
      numeric: true,
      render: (r) => r.registrations,
    },
    {
      key: "new",
      header: "First-time",
      numeric: true,
      render: (r) => r.newInstallers,
    },
    {
      key: "returning",
      header: "Returning",
      numeric: true,
      render: (r) => r.returningInstallers,
    },
  ];

  return (
    <AnalyticsCard
      title="New and active installers"
      description="See new sign-ups, first-time installers, and returning installers"
      Icon={IconUserCheckRounded}
      stale={stale}
      empty={!totals.registrations && !totals.newInstallers && !totals.returning}
      table={{ rows: series, columns }}
      footer={
        <ChartLegendRow
          items={[
            {
              label: "First-time",
              color: SERIES.accent,
              value: totals.newInstallers.toLocaleString("en-US"),
            },
            {
              label: "Returning",
              color: COHORT_RETURNING,
              value: totals.returning.toLocaleString("en-US"),
            },
            {
              label: "Registered",
              color: COHORT_REGISTERED,
              value: totals.registrations.toLocaleString("en-US"),
            },
          ]}
        />
      }
    >
      <ChartContainer config={chartConfig} className="aspect-auto h-full min-h-[280px] w-full">
        <ComposedChart accessibilityLayer data={series} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis
            {...AXIS_PROPS}
            dataKey="label"
            interval={xAxisInterval(series.length)}
            minTickGap={8}
          />
          <YAxis {...AXIS_PROPS} width={40} allowDecimals={false} tickFormatter={compactCount} />
          <Tooltip
            cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
            content={
              <SeriesTooltip
                series={{
                  registrations: { label: "Registered" },
                  newInstallers: { label: "First-time" },
                  returningInstallers: { label: "Returning" },
                }}
              />
            }
          />
          {/* new + returning sum to the active installers of the period, so
              they are a genuine part-to-whole and stack. Registrations sit on
              the same count scale and ride over them as a context line. */}
          <Bar
            dataKey="newInstallers"
            stackId="cohort"
            fill={SERIES.accent}
            maxBarSize={BAR_MAX}
            {...STACK_GAP}
          />
          <Bar
            dataKey="returningInstallers"
            stackId="cohort"
            fill={COHORT_RETURNING}
            maxBarSize={BAR_MAX}
            radius={[4, 4, 0, 0]}
            {...STACK_GAP}
          />
          <Line
            {...LINE_PROPS}
            type="monotone"
            dataKey="registrations"
            stroke={COHORT_REGISTERED}
          />
        </ComposedChart>
      </ChartContainer>
    </AnalyticsCard>
  );
}
