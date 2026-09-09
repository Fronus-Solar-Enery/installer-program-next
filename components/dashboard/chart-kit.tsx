"use client";

import {
  useMemo,
  useState,
  type FC,
  type ReactNode,
  type CSSProperties,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import IconChart from "@/components/icons/Chart";
import IconRowVertical from "@/components/icons/RowVertical";
import IconFileSmile from "@/components/icons/FileSmile";

/**
 * Shared chart furniture for the dashboard.
 *
 * Everything a chart needs to look like the others lives here: the palette
 * bindings, the mark specs (thin bars, hairline grid, 2px lines), the card
 * shell, and the table view that every chart is required to ship as its
 * accessible twin. Charts import these instead of restating pixel values.
 */

// -- palette -----------------------------------------------------------------

/**
 * Series colours, all resolved from CSS custom properties so light and dark
 * are one definition each rather than a runtime branch.
 *
 * `accent` is the one-series default. The `ramp` is ordinal — index 0 is the
 * LOWEST magnitude — and is only ever used where the categories have a real
 * order. Status colours are reserved and never stand in for a series.
 */
export const SERIES = {
  accent: "var(--color-primary)",
  muted: "var(--color-chart-muted)",
  paid: "var(--color-chart-paid)",
  pending: "var(--color-chart-pending)",
  failed: "var(--color-chart-failed)",
  surface: "var(--color-card)",
  ramp: [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
  ],
} as const;

/** Pick an ordinal ramp step for row `index` of `total`, darkest at the top. */
export function rampStep(index: number, total: number): string {
  if (total <= 1) return SERIES.ramp[4];
  const steps = SERIES.ramp.length;
  // Rank 0 is the largest value, so it takes the darkest (last) step.
  const slot = Math.round(((total - 1 - index) / (total - 1)) * (steps - 1));
  return SERIES.ramp[Math.min(steps - 1, Math.max(0, slot))];
}

// -- mark specs --------------------------------------------------------------

/** Hairline, solid, one step off the surface. Never dashed. */
export const GRID_PROPS = {
  stroke: "var(--color-chart-grid)",
  strokeWidth: 1,
  vertical: false,
} as const;

/** Recessive axis: no line, no ticks, muted text, comfortable tick margin. */
export const AXIS_PROPS = {
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
  className: "text-[11px]",
} as const;

/** Bars stay thin and never fill their band — the leftover is deliberate air. */
export const BAR_MAX = 24;

/** 2px line, round caps, ≥8px end markers with a surface ring. */
export const LINE_PROPS = {
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  dot: false,
  activeDot: {
    r: 4,
    strokeWidth: 2,
    stroke: SERIES.surface,
  },
} as const;

/**
 * A 2px stroke in the surface colour between stacked segments.
 *
 * This is the surface gap, not a border: it paints card colour into the seam so
 * neighbouring segments read apart without adding any data ink.
 */
export const STACK_GAP = {
  stroke: "var(--color-card)",
  strokeWidth: 2,
} as const;

// -- card shell --------------------------------------------------------------

export interface TableColumn<T> {
  key: string;
  header: string;
  /** Right-align and tabular-align numeric columns. */
  numeric?: boolean;
  render: (row: T) => ReactNode;
}

interface AnalyticsCardProps<T> {
  title: string;
  description?: string;
  Icon?: FC<IconProps>;
  /** Rendered at the top-right of the header — filters, units, a legend. */
  actions?: ReactNode;
  /** Dim rather than blank while a new range loads. */
  stale?: boolean;
  className?: string;
  children: ReactNode;
  /** The chart's accessible twin. Omitting it hides the toggle. */
  table?: { rows: T[]; columns: TableColumn<T>[] };
  /** Shown instead of the chart when there is genuinely nothing to plot. */
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  footer?: ReactNode;
}

/**
 * The card every dashboard chart sits in.
 *
 * Owns three things the charts should not each reinvent: the header, the
 * chart/table toggle (a chart is never the only way to read a value), and the
 * stale-dimming that replaces a skeleton flash on refetch.
 */
export function AnalyticsCard<T>({
  title,
  description,
  Icon,
  actions,
  stale,
  className,
  children,
  table,
  empty,
  emptyTitle = "Nothing to chart yet",
  emptyDescription = "There is no activity in this period. Widen the range or register an installation to see it here.",
  footer,
}: AnalyticsCardProps<T>) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const reduce = useReducedMotion();
  // With nothing to plot there is nothing to tabulate either, so the toggle
  // goes away rather than offering an empty table.
  const canToggle = Boolean(table) && !empty;
  const showTable = canToggle && view === "table";

  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader className="flex flex-row items-start gap-3 border-b border-border pb-4">
        {Icon ? (
          <Icon
            className="hidden md:block size-10 shrink-0 text-primary"
            fill
            duotone
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-medium leading-tight text-foreground">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground text-pretty">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {canToggle ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={showTable}
              aria-label={
                showTable
                  ? `Show ${title} as a chart`
                  : `Show ${title} as a table`
              }
              onClick={() => setView(showTable ? "chart" : "table")}
              className="size-9 shrink-0 p-0 text-muted-foreground hover:text-foreground"
            >
              {showTable ? (
                <IconChart className="size-4" />
              ) : (
                <IconRowVertical className="size-4" />
              )}
            </Button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "flex min-h-0 flex-1 flex-col pt-4 transition-opacity duration-300",
          stale && "opacity-55",
        )}
      >
        {empty ? (
          <div className="flex flex-1 items-center justify-center">
            <ChartEmpty title={emptyTitle} description={emptyDescription} />
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={showTable ? "table" : "chart"}
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -4 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              {showTable && table ? (
                <ChartTable rows={table.rows} columns={table.columns} />
              ) : (
                children
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </CardContent>

      {footer && !empty ? (
        <div className="border-t border-border px-4 py-3 lg:px-6">{footer}</div>
      ) : null}
    </Card>
  );
}

/** The table twin. Scrolls inside its own box so the page never scrolls sideways. */
export function ChartTable<T>({
  rows,
  columns,
}: {
  rows: T[];
  columns: TableColumn<T>[];
}) {
  return (
    <div className="max-h-80 overflow-auto rounded-xl border border-border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card">
          <TableRow>
            {columns.map((c) => (
              <TableHead
                key={c.key}
                className={cn("text-xs", c.numeric && "text-right")}
              >
                {c.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {columns.map((c) => (
                <TableCell
                  key={c.key}
                  className={cn(
                    "text-xs",
                    c.numeric && "text-right tabular-nums",
                  )}
                >
                  {c.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Shared empty state so every chart fails the same way. */
export function ChartEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 px-6 text-center">
      <IconFileSmile
        fill
        duotone
        className="size-14 text-muted-foreground/60"
      />
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      <p className="max-w-xs text-pretty text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

// -- legend ------------------------------------------------------------------

export interface LegendItem {
  label: string;
  color: string;
  /** Optional value shown after the label — a total or a share. */
  value?: string;
}

/**
 * Legend row. Two or more series always get one.
 *
 * The swatch carries the colour; the text stays in ink tokens, because a light
 * categorical fill is unreadable as type on the card surface.
 */
export function ChartLegendRow({
  items,
  className,
}: {
  items: LegendItem[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5", className)}>
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-[3px]"
            style={{ backgroundColor: item.color } as CSSProperties}
          />
          <span>{item.label}</span>
          {item.value ? (
            <span className="font-medium tabular-nums text-foreground">
              {item.value}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

// -- tooltip -----------------------------------------------------------------

interface TooltipEntry {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
}

interface SeriesTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  /** Renders the heading. Defaults to the point's `fullLabel`, then the axis value. */
  labelKey?: string;
  /** Per-series display name and value formatter, keyed by `dataKey`. */
  series: Record<string, { label: string; format?: (v: number) => string }>;
  /** Appended under the rows — a share, a total, a note. */
  footer?: (point: Record<string, unknown>) => ReactNode;
}

/**
 * Tooltip shared by every dashboard chart.
 *
 * Tooltips enhance, they never gate: the same values are reachable from the
 * card's table view and from the direct labels on the marks.
 */
export function SeriesTooltip({
  active,
  payload,
  labelKey = "fullLabel",
  series,
  footer,
}: SeriesTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = (payload[0]?.payload ?? {}) as Record<string, unknown>;
  const heading = point[labelKey];

  // One row per dataKey. A series rendered as an Area *and* a Line to get a
  // wash under the stroke arrives here twice under the same key — that is one
  // series to the reader, and duplicate React keys to React.
  const seen = new Set<string>();
  const rows = payload.filter((entry) => {
    const key = String(entry.dataKey ?? entry.name ?? "");
    if (!key || !series[key] || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (!rows.length) return null;

  return (
    <div className="min-w-40 rounded-xl border border-border bg-popover px-3 py-2 shadow-xl">
      {typeof heading === "string" && heading ? (
        <p className="mb-1.5 text-xs font-medium text-foreground">{heading}</p>
      ) : null}
      <ul className="space-y-1">
        {rows.map((entry) => {
          const key = String(entry.dataKey ?? entry.name ?? "");
          const meta = series[key];
          const raw = typeof entry.value === "number" ? entry.value : 0;
          return (
            <li key={key} className="flex items-center gap-2 text-xs">
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{meta.label}</span>
              <span className="ml-auto font-medium tabular-nums text-foreground">
                {meta.format ? meta.format(raw) : raw.toLocaleString("en-US")}
              </span>
            </li>
          );
        })}
      </ul>
      {footer ? (
        <div className="mt-1.5 border-t border-border pt-1.5 text-[11px] text-muted-foreground">
          {footer(point)}
        </div>
      ) : null}
    </div>
  );
}

// -- sparkline ---------------------------------------------------------------

/**
 * A 2px area sparkline for stat tiles.
 *
 * Deliberately hand-rolled SVG rather than a Recharts instance: a KPI row
 * mounts five of these and a full chart runtime each is wasted work for a
 * decorative trend line that carries no axis.
 */
export function Sparkline({
  values,
  className,
  color = SERIES.accent,
}: {
  values: number[];
  className?: string;
  color?: string;
}) {
  const path = useMemo(() => {
    if (values.length < 2) return null;
    const w = 100;
    const h = 28;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const span = max - min || 1;
    const step = w / (values.length - 1);
    const points = values.map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return [x, y] as const;
    });
    const line = points
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
      .join(" ");
    const area = `${line} L${w},${h} L0,${h} Z`;
    return { line, area, last: points[points.length - 1] };
  }, [values]);

  if (!path) return null;

  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
      className={cn("h-7 w-full overflow-visible", className)}
    >
      <path d={path.area} fill={color} opacity={0.1} />
      <path
        d={path.line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={path.last[0]}
        cy={path.last[1]}
        r={2.5}
        fill={color}
        stroke={SERIES.surface}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// -- meter -------------------------------------------------------------------

/**
 * A single ratio against a limit.
 *
 * The unfilled track is a lighter step of the same ramp rather than a
 * different hue, so the state reads across the whole bar.
 */
export function Meter({
  value,
  max = 100,
  color = SERIES.accent,
  className,
  label,
}: {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="meter"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-chart-muted",
        className,
      )}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 22 }}
      />
    </div>
  );
}
