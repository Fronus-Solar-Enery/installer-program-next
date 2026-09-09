"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPkr } from "@/lib/analytics";
import {
  useDistrictInstallers,
  type DashboardRange,
} from "@/hooks/useDashboardData";

/**
 * Drill-down for a district bar: who is active there, and what they earned.
 */
export function DistrictDialog({
  district,
  range,
  rangeLabel,
  onClose,
}: {
  district: string | null;
  range: DashboardRange;
  rangeLabel: string;
  onClose: () => void;
}) {
  const { data, isPending, isError } = useDistrictInstallers(district, range);
  const rows = data ?? [];

  return (
    <Dialog open={Boolean(district)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border p-4 text-left">
          <DialogTitle className="text-xl font-semibold">
            {district}
          </DialogTitle>
          <DialogDescription>
            Installers with at least one installation in {rangeLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-1.5 overflow-y-auto p-4">
          {isPending ? (
            [0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3"
              >
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))
          ) : isError ? (
            <p className="py-8 text-center text-sm text-destructive-text">
              Could not load installers for this district.
            </p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No active installers in this district for the selected period.
            </p>
          ) : (
            rows.map((installer, index) => (
              <Link
                key={installer.installerCode}
                href={`/installers/${installer.installerCode}`}
                className="squircle flex items-center gap-3 rounded-2xl bg-muted/40 p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold tabular-nums text-primary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {installer.installerName}
                  </p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {installer.installerCode}
                    {installer.city ? ` · ${installer.city}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {installer.totalProducts.toLocaleString("en-US")}
                    <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                      units
                    </span>
                  </p>
                  <p className="text-[11px] tabular-nums text-muted-foreground">
                    {formatPkr(installer.rewardAmount)}
                    {installer.referralRewardAmount > 0
                      ? ` + ${formatPkr(installer.referralRewardAmount)} ref`
                      : ""}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
