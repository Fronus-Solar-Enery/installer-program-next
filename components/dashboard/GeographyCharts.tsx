"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  AnalyticsCard,
  ChartLegendRow,
  rampStep,
  type TableColumn,
} from "@/components/dashboard/chart-kit";
import {
  RankList,
  ShareStrip,
  SummaryStat,
  type RankRow,
} from "@/components/dashboard/RankList";
import { formatPkr, formatPkrCompact, shareOf } from "@/lib/analytics";
import type { DashboardAnalytics, RegionRow } from "@/hooks/useDashboardData";
import IconMapPoint from "@/components/icons/MapPoint";
import { IconPackage } from "@/components/icons";
import IconArrowRight from "@/components/icons/ArrowRight";

/**
 * Where the installations are happening, and on what hardware.
 *
 * Both cards use the same two-layer shape: a part-to-whole strip for "what
 * dominates", then ranked rows for "by how much", with the supporting numbers
 * (installers, reward value, share) on the row rather than hidden in a tooltip.
 */

type Level = "provinces" | "districts" | "cities";

const LEVELS: Record<Level, { short: string; label: string; note: string }> = {
  provinces: {
    short: "Province",
    label: "Province",
    note: "Installer home province — the widest cut of the field",
  },
  districts: {
    short: "District",
    label: "District",
    note: "Top 12 districts by installations. Select one to list its installers",
  },
  cities: {
    short: "City",
    label: "City",
    note: "Top 10 cities by where the hardware was actually installed",
  },
};

export function RegionBreakdown({
  analytics,
  stale,
  onSelectDistrict,
}: {
  analytics: DashboardAnalytics | undefined;
  stale?: boolean;
  onSelectDistrict: (district: string) => void;
}) {
  const [level, setLevel] = useState<Level>("districts");
  const meta = LEVELS[level];
  const rows: RegionRow[] = useMemo(
    () => analytics?.geography[level] ?? [],
    [analytics, level],
  );

  const total = rows.reduce((sum, r) => sum + r.installations, 0);
  const totalInstallers = rows.reduce((sum, r) => sum + (r.installers ?? 0), 0);
  // How top-heavy the map is: the share carried by the three biggest regions.
  const topThreeShare = shareOf(
    rows.slice(0, 3).reduce((sum, r) => sum + r.installations, 0),
    total,
  );

  const rankRows: RankRow[] = useMemo(
    () =>
      rows.map((r) => {
        const name = r.name || "Unspecified";
        const bits = [
          r.province && r.province !== name ? r.province : null,
          r.installers != null
            ? `${r.installers} installer${r.installers === 1 ? "" : "s"}`
            : null,
          formatPkrCompact(r.amount),
        ].filter(Boolean);
        return {
          id: name,
          name,
          meta: bits.join(" · "),
          value: r.installations,
        };
      }),
    [rows],
  );

  const columns: TableColumn<RegionRow>[] = [
    {
      key: "name",
      header: meta.label,
      render: (r) =>
        level === "districts" ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto justify-start gap-1 px-1 py-0.5 text-xs font-medium"
            onClick={() => onSelectDistrict(r.name)}
          >
            {r.name || "Unspecified"}
            <IconArrowRight className="size-3" />
          </Button>
        ) : (
          (r.name ?? "Unspecified")
        ),
    },
    {
      key: "installations",
      header: "Installations",
      numeric: true,
      render: (r) => r.installations.toLocaleString("en-US"),
    },
    {
      key: "share",
      header: "Share",
      numeric: true,
      render: (r) => `${shareOf(r.installations, total).toFixed(1)}%`,
    },
    {
      key: "installers",
      header: "Installers",
      numeric: true,
      render: (r) => (r.installers != null ? r.installers : "—"),
    },
    {
      key: "amount",
      header: "Reward value",
      numeric: true,
      render: (r) => formatPkr(r.amount),
    },
  ];

  return (
    <AnalyticsCard
      title="Geographic distribution"
      description={meta.note}
      Icon={IconMapPoint}
      stale={stale}
      empty={!rows.length}
      emptyTitle="No locations to map yet"
      emptyDescription="Installations carry the installer's district and the city they were fitted in. Neither has any rows in this period."
      table={{ rows, columns }}
      actions={
        <ToggleGroup
          type="single"
          size="sm"
          value={level}
          onValueChange={(v) => v && setLevel(v as Level)}
          aria-label="Geographic level"
        >
          {(Object.keys(LEVELS) as Level[]).map((key) => (
            <ToggleGroupItem key={key} value={key}>
              {LEVELS[key].short}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      }
      footer={
        <p className="text-xs text-muted-foreground">
          {level === "districts"
            ? "Select a row to list that district’s installers."
            : `${rows.length} ${meta.label.toLowerCase()}${rows.length === 1 ? "" : "s"} with activity in this period.`}
        </p>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-muted/40 px-3 py-2.5">
          <SummaryStat
            label={`${meta.label}s covered`}
            value={rows.length.toLocaleString("en-US")}
          />
          <SummaryStat
            label="Top 3 share"
            value={`${topThreeShare.toFixed(0)}%`}
          />
          <SummaryStat
            label={level === "cities" ? "Installations" : "Installers"}
            value={(level === "cities"
              ? total
              : totalInstallers
            ).toLocaleString("en-US")}
          />
        </div>

        <ShareStrip
          segments={rankRows.slice(0, 6).map((r) => ({
            id: r.id,
            label: r.name,
            value: r.value,
          }))}
        />

        <RankList
          rows={rankRows}
          ariaLabel={`${meta.label} ranking by installations`}
          onSelect={level === "districts" ? onSelectDistrict : undefined}
          className="overflow-y-auto"
        />
      </div>
    </AnalyticsCard>
  );
}

// -- product mix -------------------------------------------------------------

const MIX_LIMIT = 6;

export function ProductMixChart({
  analytics,
  stale,
}: {
  analytics: DashboardAnalytics | undefined;
  stale?: boolean;
}) {
  const products = useMemo(() => analytics?.products ?? [], [analytics]);
  const total = products.reduce((sum, p) => sum + p.installations, 0);
  const totalValue = products.reduce((sum, p) => sum + p.amount, 0);

  /**
   * Past six segments adjacent slices blur together, so the tail folds into a
   * single "Other" rather than being given more ramp steps than the ramp has.
   */
  const mix = useMemo(() => {
    if (products.length <= MIX_LIMIT) return products;
    const head = products.slice(0, MIX_LIMIT - 1);
    const tail = products.slice(MIX_LIMIT - 1);
    return [
      ...head,
      {
        model: `Other (${tail.length} models)`,
        installations: tail.reduce((s, p) => s + p.installations, 0),
        amount: tail.reduce((s, p) => s + p.amount, 0),
      },
    ];
  }, [products]);

  const rankRows: RankRow[] = mix.map((p) => {
    const name = p.model || "Unspecified";
    const perUnit = p.installations > 0 ? p.amount / p.installations : 0;
    return {
      id: name,
      name,
      meta: `${formatPkrCompact(p.amount)} · ${formatPkrCompact(perUnit)} per unit`,
      value: p.installations,
    };
  });

  const columns: TableColumn<(typeof products)[number]>[] = [
    { key: "model", header: "Model", render: (r) => r.model || "Unspecified" },
    {
      key: "installations",
      header: "Installations",
      numeric: true,
      render: (r) => r.installations.toLocaleString("en-US"),
    },
    {
      key: "share",
      header: "Share",
      numeric: true,
      render: (r) => `${shareOf(r.installations, total).toFixed(1)}%`,
    },
    {
      key: "amount",
      header: "Reward value",
      numeric: true,
      render: (r) => formatPkr(r.amount),
    },
  ];

  const leader = mix[0];

  return (
    <AnalyticsCard
      title="Product mix"
      description="Which models the field is actually installing, by unit share"
      Icon={IconPackage}
      stale={stale}
      empty={!products.length}
      emptyTitle="No products registered yet"
      emptyDescription="Product mix is derived from the model on each reward claim. There are no claims in this period."
      table={{ rows: products, columns }}
      footer={
        <ChartLegendRow
          items={mix.map((p, i) => ({
            label: p.model || "Unspecified",
            color: rampStep(i, mix.length),
            value: `${shareOf(p.installations, total).toFixed(0)}%`,
          }))}
        />
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-muted/40 px-3 py-2.5">
          <SummaryStat
            label="Models in use"
            value={products.length.toLocaleString("en-US")}
          />
          <SummaryStat
            label="Leading model"
            value={
              leader
                ? `${shareOf(leader.installations, total).toFixed(0)}%`
                : "—"
            }
          />
          <SummaryStat label="Reward value" value={formatPkrCompact(totalValue)} />
        </div>

        <ShareStrip
          segments={mix.map((p) => ({
            id: p.model,
            label: p.model || "Unspecified",
            value: p.installations,
          }))}
        />

        <RankList
          rows={rankRows}
          ariaLabel="Product models ranked by installations"
          className="overflow-y-auto"
        />
      </div>
    </AnalyticsCard>
  );
}
