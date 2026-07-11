"use client";

import { motion, useReducedMotion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import {
  IconBoxMinimalistic,
  IconCheckCircle,
  IconClockCircle,
  IconDiagramUp,
} from "@/components/icons";
import type { InstallerStatistics } from "@/hooks/useInstallerDetails";

interface StatDef {
  key: string;
  label: string;
  value: string;
  caption: string;
  Icon: React.ComponentType<IconProps>;
  valueClass?: string;
  iconClass?: string;
}

function formatRs(amount: number | undefined) {
  return `Rs. ${(amount ?? 0).toLocaleString()}`;
}

function pluralize(count: number, noun: string) {
  return `${count} ${noun}${count !== 1 ? "s" : ""}`;
}

export default function StatsRow({
  statistics,
}: {
  statistics: InstallerStatistics;
}) {
  const reduceMotion = useReducedMotion();

  const stats: StatDef[] = [
    {
      key: "total",
      label: "Total Rewards",
      value: formatRs(statistics.totalAmount),
      caption: pluralize(statistics.totalRewards, "reward"),
      Icon: IconDiagramUp,
    },
    {
      key: "pending",
      label: "Pending",
      value: formatRs(statistics.pendingAmount),
      caption: pluralize(statistics.pendingRewards, "reward"),
      Icon: IconClockCircle,
      valueClass: "text-muted-foreground",
      iconClass: "text-muted-foreground",
    },
    {
      key: "paid",
      label: "Paid",
      value: formatRs(statistics.paidAmount),
      caption: pluralize(statistics.paidRewards, "reward"),
      Icon: IconCheckCircle,
      valueClass: "text-success-text",
      iconClass: "text-success-text",
    },
    {
      key: "products",
      label: "Products",
      value: String(statistics.totalRewards),
      caption: pluralize(statistics.totalRewards, "product") + " installed",
      Icon: IconBoxMinimalistic,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4 xl:gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.key}
          initial={reduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 26,
            delay: i * 0.05,
          }}
        >
          <Card className="group h-full transition-shadow duration-300 hover:shadow-layered">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <p
                    className={`truncate text-xl font-semibold tracking-tight sm:text-2xl ${stat.valueClass ?? ""}`}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.caption}
                  </p>
                </div>
                <div className="shrink-0 rounded-xl bg-muted p-2.5 transition-colors duration-300 group-hover:bg-muted/70 sm:p-3">
                  <stat.Icon
                    className={`size-5 ${stat.iconClass ?? "text-foreground"}`}
                    duotone
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
