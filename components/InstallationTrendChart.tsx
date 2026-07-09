"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface Reward {
  createdAt: string;
  rewardAmount: number;
  rewardStatus: string;
}

interface InstallationTrendChartProps {
  rewards: Reward[];
}

const chartConfig = {
  installations: {
    label: "Installations",
    color: "var(--color-foreground)",
  },
} satisfies ChartConfig;

export function InstallationTrendChart({
  rewards,
}: InstallationTrendChartProps) {
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { month: string; installations: number; earnings: number }[] =
      [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = date.toLocaleString("default", { month: "short" });

      const monthRewards = rewards.filter((r) => {
        const d = new Date(r.createdAt);
        return (
          d.getFullYear() === date.getFullYear() &&
          d.getMonth() === date.getMonth()
        );
      });

      months.push({
        month: monthLabel,
        installations: monthRewards.length,
        earnings: monthRewards.reduce((sum, r) => sum + r.rewardAmount, 0),
      });
    }

    return months;
  }, [rewards]);

  return (
    <ChartContainer config={chartConfig} className="min-h-[220px] w-full">
      <BarChart
        data={monthlyData}
        margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          vertical={false}
          strokeDasharray="3 3"
          stroke="var(--border)"
        />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          className="text-xs"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          allowDecimals={false}
          className="text-xs"
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                if (name === "installations") return [`${value} installations`];
                return [value];
              }}
            />
          }
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
        />
        <Bar
          dataKey="installations"
          fill="var(--color-installations)"
          radius={[6, 6, 0, 0]}
          maxBarSize={48}
        >
          <LabelList
            dataKey="installations"
            position="top"
            className="text-xs font-medium fill-foreground"
            formatter={(v) => (Number(v) > 0 ? v : "")}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
