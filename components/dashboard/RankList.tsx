"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { shareOf } from "@/lib/analytics";
import { rampStep, SERIES } from "@/components/dashboard/chart-kit";
import IconAltArrowRight from "@/components/icons/AltArrowRight";

/**
 * Ranked rows with the bar drawn as the row itself.
 *
 * This replaces the horizontal Recharts bar chart that used to sit in these
 * cards. Two things forced the change: a categorical y-axis has to guess a
 * gutter width, so long names ("Muzaffargarh", "Bahawalpur") were clipped
 * rather than ellipsised; and an SVG `<rect>` cannot be tabbed to, so the
 * district drill-down was mouse-only.
 *
 * Past roughly seven categories a table-with-bars is the recommended form
 * anyway — it carries the magnitude *and* the supporting numbers in the space
 * a bare bar chart spends on axis chrome.
 */

export interface RankRow {
  /** Stable identity — also what `onSelect` receives. */
  id: string;
  name: string;
  /** Secondary line: province, installer count, reward value. */
  meta?: string;
  value: number;
  /** Right-hand secondary figure, already formatted. */
  detail?: string;
}

export function RankList({
  rows,
  formatValue = (v) => v.toLocaleString("en-US"),
  onSelect,
  hrefFor,
  ariaLabel,
  showShare = true,
  tone,
  className,
}: {
  rows: RankRow[];
  formatValue?: (value: number) => string;
  /** Makes each row a real button — keyboard reachable, unlike an SVG bar. */
  onSelect?: (id: string) => void;
  /** Makes each row a link. Ignored when `onSelect` is given. */
  hrefFor?: (row: RankRow) => string;
  ariaLabel?: string;
  showShare?: boolean;
  /**
   * Fill colour for every row. Districts, banks and product models are nominal
   * categories, so they all get one colour — shading each row by its own size
   * would restate the bar length in hue and spend the only free channel on
   * information the bar already carries.
   */
  tone?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  // Bars scale against the leader, not the total: with a long tail every row
  // after the first would otherwise collapse to an unreadable sliver.
  const max = rows.reduce((m, r) => Math.max(m, r.value), 0);

  return (
    <ol className={cn("flex min-h-0 flex-1 flex-col gap-1", className)} aria-label={ariaLabel}>
      {rows.map((row, index) => {
        const width = max > 0 ? (row.value / max) * 100 : 0;
        const share = shareOf(row.value, total);
        const fill = tone ?? SERIES.accent;

        const body = (
          <>
            {/* The wash IS the bar — length carries the magnitude, and the
                row's own text sits on top of it instead of beside it. */}
            <motion.span
              aria-hidden
              className="absolute inset-y-0 left-0 rounded-lg opacity-25 transition-opacity group-hover:opacity-40"
              style={{ backgroundColor: fill }}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${width}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 24 }}
            />
            <span
              aria-hidden
              className="absolute inset-y-1 left-0 w-[3px] rounded-full"
              style={{ backgroundColor: fill }}
            />

            <span className="relative flex w-full items-center gap-3">
              <span className="w-5 shrink-0 text-right text-[11px] font-medium tabular-nums text-muted-foreground">
                {index + 1}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {row.name}
                </span>
                {row.meta ? (
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {row.meta}
                  </span>
                ) : null}
              </span>

              <span className="shrink-0 text-right">
                <span className="block text-sm font-semibold tabular-nums text-foreground">
                  {formatValue(row.value)}
                </span>
                {showShare ? (
                  <span className="block text-[11px] tabular-nums text-muted-foreground">
                    {share.toFixed(1)}%
                  </span>
                ) : row.detail ? (
                  <span className="block text-[11px] tabular-nums text-muted-foreground">
                    {row.detail}
                  </span>
                ) : null}
              </span>

              {onSelect || hrefFor ? (
                <IconAltArrowRight
                  aria-hidden
                  className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                />
              ) : null}
            </span>
          </>
        );

        const shell =
          "group relative flex w-full items-center overflow-hidden rounded-lg px-2.5 py-2 text-left transition-colors";
        const interactive =
          "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

        return (
          <li key={row.id} className="min-h-0">
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(row.id)}
                className={cn(shell, interactive, "cursor-pointer")}
              >
                {body}
              </button>
            ) : hrefFor ? (
              <Link href={hrefFor(row)} className={cn(shell, interactive)}>
                {body}
              </Link>
            ) : (
              <div className={shell}>{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Part-to-whole strip: one horizontal bar split by share.
 *
 * Answers "what dominates" at a glance. The ranked rows underneath answer "by
 * how much" — which a reader cannot get from comparing arc lengths on a pie.
 */
export function ShareStrip({
  segments,
  className,
}: {
  segments: Array<{ id: string; label: string; value: number }>;
  className?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;

  return (
    <div
      role="img"
      aria-label={segments
        .map((s) => `${s.label}: ${shareOf(s.value, total).toFixed(0)} percent`)
        .join(", ")}
      className={cn("flex h-7 w-full gap-0.5 overflow-hidden rounded-lg", className)}
    >
      {segments.map((segment, i) => (
        <span
          key={segment.id}
          title={`${segment.label} · ${segment.value.toLocaleString("en-US")}`}
          className="h-full first:rounded-l-lg last:rounded-r-lg"
          style={{
            width: `${shareOf(segment.value, total)}%`,
            backgroundColor: rampStep(i, segments.length),
          }}
        />
      ))}
    </div>
  );
}

/** Small labelled figure used above a rank list to frame what it shows. */
export function SummaryStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}
