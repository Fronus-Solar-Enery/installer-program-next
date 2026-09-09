"use client";

import type { FC, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { Sparkline, SERIES } from "@/components/dashboard/chart-kit";
import IconArrowUp from "@/components/icons/ArrowUp";
import IconArrowDown from "@/components/icons/ArrowDown";
import IconMinus from "@/components/icons/Minus";

/**
 * Stat tiles and the dashboard's single hero figure.
 *
 * A headline number is not a one-bar bar chart — it is a number. These are the
 * form the dashboard leads with, with the chart sections underneath carrying
 * everything that actually needs a plot.
 */

interface DeltaProps {
  /** Signed percentage change; `null` when there was no baseline to compare to. */
  delta: number | null;
  /** What the delta is measured against, e.g. "vs previous 30 days". */
  baselineLabel: string;
  /** For most metrics a rise is good; for failures it is not. */
  upIsGood?: boolean;
  /** Suppress the delta entirely (e.g. an all-time range has no baseline). */
  hidden?: boolean;
}

function DeltaBadge({
  delta,
  baselineLabel,
  upIsGood = true,
  hidden,
}: DeltaProps) {
  if (hidden) return null;

  if (delta === null) {
    return (
      <p className="text-xs text-muted-foreground">
        No comparable {baselineLabel.replace(/^vs\s+/i, "")}
      </p>
    );
  }

  const rounded = Math.abs(delta) < 0.05 ? 0 : delta;
  const flat = rounded === 0;
  const good = flat ? null : rounded > 0 === upIsGood;
  const Icon = flat ? IconMinus : rounded > 0 ? IconArrowUp : IconArrowDown;

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-medium tabular-nums",
          flat && "text-muted-foreground",
          good === true && "text-success-text",
          good === false && "text-destructive-text",
        )}
      >
        <Icon className="size-3" aria-hidden />
        {flat ? "No change" : `${Math.abs(rounded).toFixed(1)}%`}
      </span>
      <span className="text-muted-foreground">{baselineLabel}</span>
    </p>
  );
}

interface StatTileProps extends DeltaProps {
  label: string;
  value: number;
  /** Rendered before the number — currency, mostly. */
  prefix?: string;
  suffix?: string;
  /** Shorten large values to 1.2M / 12.9K. */
  compact?: boolean;
  Icon?: FC<IconProps>;
  /** 12-ish point trend for the current range. */
  trend?: number[];
  trendColor?: string;
  /** Extra context under the delta — a share, a secondary figure. */
  footnote?: ReactNode;
  className?: string;
  /** Dim rather than blank while a new range loads. */
  stale?: boolean;
}

export function StatTile({
  label,
  value,
  prefix,
  suffix,
  compact,
  Icon,
  trend,
  trendColor = SERIES.accent,
  footnote,
  className,
  stale,
  ...delta
}: StatTileProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 28 }}
      className={cn(
        "squircle group relative flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 transition-opacity duration-300 lg:p-5",
        stale && "opacity-55",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <Icon
            className="size-5 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-foreground"
            aria-hidden
          />
        ) : null}
      </div>

      {/* Proportional figures on purpose — tabular-nums makes a standalone
          value like 121 look loose at this size. */}
      <p className="text-2xl font-semibold leading-none text-foreground lg:text-[1.75rem]">
        {prefix ? (
          <span className="mr-1 text-base font-medium text-muted-foreground">
            {prefix}
          </span>
        ) : null}
        <AnimatedCounter value={value} compact={compact} compactThreshold={10_000} />
        {suffix ? (
          <span className="ml-0.5 text-base font-medium text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </p>

      {trend && trend.length > 1 ? (
        <Sparkline values={trend} color={trendColor} />
      ) : null}

      <div className="mt-auto space-y-1">
        <DeltaBadge {...delta} />
        {footnote ? (
          <div className="text-xs text-muted-foreground">{footnote}</div>
        ) : null}
      </div>
    </motion.div>
  );
}

interface HeroFigureProps extends DeltaProps {
  label: string;
  value: number;
  prefix?: string;
  /** The split that makes the headline number legible, e.g. installer/referrer. */
  breakdown?: Array<{ label: string; value: string; color?: string }>;
  trend?: number[];
  stale?: boolean;
}

/**
 * The one number the dashboard leads with. Exactly one per view.
 *
 * Same sans as everything else — a display face here reads as decoration, not
 * as data.
 */
export function HeroFigure({
  label,
  value,
  prefix = "Rs",
  breakdown,
  trend,
  stale,
  ...delta
}: HeroFigureProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-4 transition-opacity duration-300",
        stale && "opacity-55",
      )}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-4xl font-semibold leading-none text-foreground lg:text-5xl">
          <span className="mr-1.5 text-xl font-medium text-muted-foreground lg:text-2xl">
            {prefix}
          </span>
          <AnimatedCounter value={value} />
        </p>
        <div className="mt-2">
          <DeltaBadge {...delta} />
        </div>
      </div>

      {trend && trend.length > 1 ? (
        <Sparkline values={trend} className="h-10" />
      ) : null}

      {breakdown?.length ? (
        <dl className="flex flex-wrap gap-x-6 gap-y-2">
          {breakdown.map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              {b.color ? (
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: b.color }}
                />
              ) : null}
              <div>
                <dt className="text-[11px] text-muted-foreground">{b.label}</dt>
                <dd className="text-sm font-medium tabular-nums text-foreground">
                  {b.value}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
