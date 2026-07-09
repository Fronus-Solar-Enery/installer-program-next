"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

interface Reward {
  productModel: string;
}

interface ProductDistributionChartProps {
  rewards: Reward[];
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function ProductDistributionChart({
  rewards,
}: ProductDistributionChartProps) {
  const { data, total, chartConfig } = useMemo(() => {
    const counts: Record<string, number> = {};
    rewards.forEach((r) => {
      const model = r.productModel || "Unknown";
      counts[model] = (counts[model] || 0) + 1;
    });

    const entries = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));

    const config: ChartConfig = {};
    entries.forEach((entry, i) => {
      config[entry.name] = {
        label: entry.name,
        color: COLORS[i % COLORS.length],
      };
    });

    return { data: entries, total: rewards.length, chartConfig: config };
  }, [rewards]);

  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        No product data yet.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <ChartContainer config={chartConfig} className="size-[280px] shrink-0">
        <PieChart>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as { name: string; value: number };
              return (
                <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                  <p className="font-medium">{d.name}</p>
                  <p className="text-muted-foreground">
                    {d.value} installation{d.value !== 1 ? "s" : ""} (
                    {Math.round((d.value / total) * 100)}%)
                  </p>
                </div>
              );
            }}
          />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={90}
            outerRadius={130}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <text
            x="50%"
            y="50%"
            dy="-0.5em"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-foreground text-2xl font-bold"
          >
            {total}
          </text>
          <text
            x="50%"
            y="50%"
            dy="1.5em"
            textAnchor="middle"
            className="fill-muted-foreground text-[10px]"
          >
            Installations
          </text>
        </PieChart>
      </ChartContainer>
      <div className="flex flex-col gap-2 text-sm">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="truncate text-muted-foreground">{item.name}</span>
            <span className="ml-auto font-mono text-xs tabular-nums">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
