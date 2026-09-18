"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatPkr } from "@/lib/analytics";
import { SERIES } from "@/components/dashboard/chart-kit";
import type {
  RecentInstallation,
  RecentInstaller,
} from "@/hooks/useDashboardData";
import { IconPackage } from "@/components/icons";
import IconUser from "@/components/icons/User";

/**
 * The two "what just happened" feeds.
 *
 * These are not scoped by the range filter on purpose — they answer "is the
 * system live right now", which a historical window would hide.
 */

const STATUS_TONE: Record<string, { label: string; color: string }> = {
  PAID: { label: "Paid", color: SERIES.paid },
  PENDING: { label: "Pending", color: SERIES.pending },
  FAILED: { label: "Failed", color: SERIES.failed },
};

function FeedCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="border-b border-border pb-4">
        <h3 className="text-base font-medium leading-tight text-foreground">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col pt-4">
        {children}
      </CardContent>
    </Card>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3"
        >
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function RecentInstallationsFeed({
  rows,
  loading,
}: {
  rows: RecentInstallation[];
  loading?: boolean;
}) {
  return (
    <FeedCard
      title="Latest installations"
      description="The most recently registered installations"
    >
      {loading ? (
        <FeedSkeleton />
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No installations registered yet.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((row) => {
            const tone = STATUS_TONE[row.rewardStatus] ?? {
              label: row.rewardStatus,
              color: SERIES.muted,
            };
            return (
              <li key={row._id}>
                <Link
                  href={`/rewards/${row._id}`}
                  className="squircle flex items-center gap-3 rounded-2xl bg-muted/40 p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                    <IconPackage className="size-4 text-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {row.productModel}
                    </p>
                    <p className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                      <span
                        aria-hidden
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: tone.color }}
                      />
                      {tone.label}
                      <span aria-hidden>·</span>
                      <span className="truncate font-mono">
                        {row.installer?.installerCode ?? "Unassigned"}
                      </span>
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
            );
          })}
        </ul>
      )}
    </FeedCard>
  );
}

export function RecentInstallersFeed({
  rows,
  loading,
}: {
  rows: RecentInstaller[];
  loading?: boolean;
}) {
  return (
    <FeedCard
      title="Newest installers"
      description="Most recently registered installers"
    >
      {loading ? (
        <FeedSkeleton />
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No installers registered yet.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((row) => (
            <li key={row._id}>
              <Link
                href={`/installers/${row.installerCode}`}
                className={cn(
                  "squircle flex items-center gap-3 rounded-2xl bg-muted/40 p-3 transition-colors",
                  "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                  <IconUser className="size-4 text-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {row.fullName}
                  </p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {row.installerCode}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="truncate text-sm font-medium text-foreground">
                    {row.city}
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
      )}
    </FeedCard>
  );
}
