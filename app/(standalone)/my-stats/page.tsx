"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  TrendingUp,
  Package,
  Clock,
  Users,
  Calendar,
  Share2,
  Settings,
  LogOut,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import ProgramLogo from "@/components/ProgramLogo";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { MilestoneProgress } from "@/components/MilestoneProgress";
import { InstallationTrendChart } from "@/components/InstallationTrendChart";
import { ProductDistributionChart } from "@/components/ProductDistributionChart";
import { MotivationalNudge } from "@/components/MotivationalNudge";
import { staggerContainer, slideUp } from "@/lib/motion";
import {
  IconAward,
  IconGift,
  IconLogout2,
  IconSave,
  IconShare,
} from "@/components/icons";
import { getInitials } from "@/lib/getInitials";
import dynamic from "next/dynamic";
const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then((m) => m.ThemeToggle),
  { ssr: false },
);
import Loading from "@/components/ui/loading";
import { CopyButton } from "@/components/CopyButton";

const PAGE_TITLE = "My Stats — Fronus Installer Program";

interface MyStatsData {
  installer: {
    _id: string;
    installerCode: string;
    fullName: string;
    companyName?: string;
    city: string;
    district: string;
    certified: boolean;
    createdAt: string;
  };
  stats: {
    totalRewards: number;
    paidRewards: number;
    pendingRewards: number;
    installationCount: number;
    referralEarnings: number;
  };
  rewards: Array<{
    _id: string;
    productModel: string;
    serialNumber: string;
    installationDate?: string;
    rewardStatus: "PENDING" | "PAID" | "FAILED";
    rewardAmount: number;
    createdAt: string;
  }>;
  referredInstallers: Array<{
    _id: string;
    installerCode: string;
    fullName: string;
    createdAt: string;
  }>;
}

const rs = (n: number) => `Rs. ${n.toLocaleString()}`;

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={
        status === "PAID"
          ? "success"
          : status === "PENDING"
            ? "warning"
            : "destructive"
      }
    >
      {status}
    </Badge>
  );
}

function ChangePinDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [saving, setSaving] = useState(false);

  const digits = (v: string) => v.replace(/\D/g, "").slice(0, 6);

  const handleSave = async () => {
    if (newPin !== confirmPin) {
      toast.error("New PINs do not match");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/installer/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("PIN changed successfully");
        onOpenChange(false);
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
      } else {
        toast.error(data.error || data.message || "Failed to change PIN");
      }
    } catch {
      toast.error("Failed to change PIN");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader className="text-left">
          <DialogTitle>Change PIN</DialogTitle>
          <DialogDescription>
            Enter your current PIN and choose a new 6-digit PIN.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPin">Current PIN</Label>
            <Input
              id="currentPin"
              type="password"
              inputMode="numeric"
              value={currentPin}
              placeholder="e.g: 654321"
              onChange={(e) => setCurrentPin(digits(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPin">New PIN</Label>
            <Input
              id="newPin"
              type="password"
              inputMode="numeric"
              value={newPin}
              placeholder="e.g: 123456"
              onChange={(e) => setNewPin(digits(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirm New PIN</Label>
            <Input
              id="confirmPin"
              type="password"
              inputMode="numeric"
              value={confirmPin}
              placeholder="e.g: 123456"
              onChange={(e) => setConfirmPin(digits(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                currentPin.length !== 6 ||
                newPin.length !== 6 ||
                confirmPin.length !== 6
              }
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <Loading className="size-4 text-foreground dark:text-background" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <IconSave />
                  Save
                </div>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  label,
  value,
  prefix,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  prefix?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <div className={`rounded-lg p-1.5 ${color}`}>
            <Icon className="size-4" />
          </div>
        </div>
        <CardTitle className="text-2xl tabular-nums">
          <AnimatedCounter value={value} prefix={prefix} />
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

export default function MyStatsPage() {
  const [data, setData] = useState<MyStatsData | null>(null);
  const [error, setError] = useState("");
  const [changePinOpen, setChangePinOpen] = useState(false);

  useEffect(() => {
    fetch("/api/installer/my-stats")
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/auth/installer";
          throw new Error("unauthorized");
        }
        return res.json();
      })
      .then((json) => {
        if (json.success) setData(json.data);
        else setError(json.error || "Failed to load your stats");
      })
      .catch((e) => {
        if (e.message !== "unauthorized") setError("Failed to load your stats");
      });
  }, []);

  const thisMonthCount = useMemo(() => {
    if (!data) return 0;
    const now = new Date();
    return data.rewards.filter((r) => {
      const d = new Date(r.createdAt);
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    }).length;
  }, [data]);

  const memberSince = useMemo(() => {
    if (!data) return "";
    return new Date(data.installer.createdAt).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [data]);

  const handleShare = () => {
    const url = `${window.location.origin}/installer/${data?.installer.installerCode}`;
    if (navigator.share) {
      navigator
        .share({ title: "My Fronus Installer Profile", url })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Profile link copied to clipboard");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/installer/logout", { method: "POST" });
    window.location.href = "/";
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <title>{PAGE_TITLE}</title>
        <Card className="max-w-md w-full text-center p-8">
          <p className="text-destructive-text">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/70 dark:bg-background">
      <title>{PAGE_TITLE}</title>
      <div className="max-w-5xl mx-auto p-4 space-y-6">
        {/* Hero Header Card */}

        {/* Top row: Logo + Actions */}
        <div className="flex items-center justify-between mb-8 bg-card/60 backdrop-blur-md squircle rounded-full p-4 sticky top-4 z-100 border border-border">
          <ProgramLogo className="w-24 sm:w-28 h-10!" />
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleShare}
              className="size-9"
              title="Share profile"
            >
              <IconShare className="size-4" />
            </Button>
            <ThemeToggle triggerClass="text-foreground/80 hover:text-foreground bg-muted hover:bg-muted/80 border-none size-9 rounded-full [&>svg]:size-4!" />
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setChangePinOpen(true)}
              className="size-9"
              title="Change PIN"
            >
              <Settings className="size-4" />
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="h-9 border-none gap-2 pr-2.5"
              title="Sign out"
            >
              Logout
              <IconLogout2 className="size-4" />
            </Button>
          </div>
        </div>

        {data ? (
          <Card>
            {/* Middle row: Avatar + Identity */}
            <div className="flex flex-wrap items-center gap-5 p-4">
              {/* Initials Avatar */}
              <div className="size-16 rounded-full bg-card/50 flex items-center justify-center text-2xl font-bold text-foreground shrink-0 ring-2 ring-border">
                {getInitials(data.installer.fullName)}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                  {data.installer.fullName}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {data.installer.companyName && (
                    <span>{data.installer.companyName} · </span>
                  )}
                  {data.installer.city}, {data.installer.district}
                </p>
              </div>
              <div className="space-y-0.5 ml-auto text-right">
                <div className="text-muted-foreground text-xs">
                  Member since
                </div>
                <div className="text-foreground font-mono text-sm font-medium tracking-wide uppercase">
                  {memberSince}
                </div>
              </div>
            </div>

            {/* Bottom row: Code + Total Earned */}
            <div className="flex flex-wrap items-end justify-between gap-4 pt-4 border-t border-border/70 p-4">
              <div className="space-y-0.5">
                <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">
                  Installer Code
                </p>
                <div className="transition-colors cursor-pointer p-0 h-max font-mono font-bold text-2xl flex items-center">
                  {data.installer.installerCode}
                  <CopyButton
                    text={data.installer.installerCode}
                    label="Installer Code"
                    className="size-5"
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-[10px] font-bold  uppercase tracking-wider mb-0.5">
                  Total Earned
                </p>
                <p className="text-2xl font-bold text-foreground tabular-nums font-mono">
                  <AnimatedCounter
                    value={data.stats.paidRewards}
                    prefix="Rs. "
                  />
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex flex-wrap items-center gap-5 p-4">
              <Skeleton className="size-16 rounded-full" round />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="space-y-0.5 ml-auto text-right">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4 pt-4 border-t border-border/70 p-4">
              <div className="space-y-0.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-32" />
              </div>
              <div className="text-right space-y-0.5">
                <Skeleton className="h-3 w-20 ml-auto" />
                <Skeleton className="h-7 w-28 ml-auto" />
              </div>
            </div>
          </Card>
        )}

        {data ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* 2. Motivational Nudge */}
            <motion.div variants={slideUp}>
              <MotivationalNudge rewards={data.rewards} />
            </motion.div>

            {/* 3. Stats Cards */}
            <motion.div
              variants={slideUp}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
            >
              {/* <StatCard
                label="Total Earned"
                value={data.stats.paidRewards}
                prefix="Rs. "
                icon={TrendingUp}
                color="bg-success/15 text-success-text"
              /> */}
              <StatCard
                label="Installations"
                value={data.stats.installationCount}
                icon={Package}
                color="bg-brand-700/15 text-brand-800 dark:text-brand-600"
              />
              <StatCard
                label="Pending"
                value={data.stats.pendingRewards}
                prefix="Rs. "
                icon={Clock}
                color="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400"
              />
              {/* <StatCard
                label="Referral Earnings"
                value={data.stats.referralEarnings}
                prefix="Rs. "
                icon={Users}
                color="bg-sky-500/15 text-sky-700 dark:text-sky-400"
              /> */}
              <StatCard
                label="This Month"
                value={thisMonthCount}
                icon={Calendar}
                color="bg-purple-500/15 text-purple-700 dark:text-purple-400"
              />
            </motion.div>

            {/* 4. Milestone Progress */}
            {/* <motion.div variants={slideUp}>
              <MilestoneProgress
                installationCount={data.stats.installationCount}
              />
            </motion.div> */}

            {/* 5 & 6. Charts Row */}
            <motion.div
              variants={slideUp}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Card>
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base">
                    Installation Trend
                  </CardTitle>
                </CardHeader>
                <CardContent className="pl-0!">
                  <InstallationTrendChart rewards={data.rewards} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="border-b border-border">
                  <CardTitle className="text-base">
                    Product Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductDistributionChart rewards={data.rewards} />
                </CardContent>
              </Card>
            </motion.div>

            {/* 7. Installation History */}
            <motion.div variants={slideUp}>
              <Card>
                <CardHeader className="border-b border-border">
                  <div className="text-lg font-semibold">
                    Installation History
                  </div>
                </CardHeader>
                <CardContent className="p-0!">
                  {data.rewards.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                      No installations yet. Your registered installations will
                      appear here.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-4">Product</TableHead>
                            <TableHead>Serial #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right pr-6">
                              Amount
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.rewards.map((reward) => (
                            <TableRow key={reward._id}>
                              <TableCell className="font-medium pl-4">
                                {reward.productModel}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {reward.serialNumber}
                              </TableCell>
                              <TableCell>
                                {new Date(
                                  reward.installationDate || reward.createdAt,
                                ).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={reward.rewardStatus} />
                              </TableCell>
                              <TableCell className="text-right tabular-nums pr-6">
                                {rs(reward.rewardAmount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* 8. Referrals */}
            {data.referredInstallers.length > 0 && (
              <motion.div variants={slideUp}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Your Referrals</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Referral earnings:{" "}
                          <span className="font-medium text-foreground">
                            {rs(data.stats.referralEarnings)}
                          </span>
                        </p>
                      </div>
                      <IconGift className="size-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {data.referredInstallers.map((ref) => (
                        <li
                          key={ref._id}
                          className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3"
                        >
                          <div>
                            <span className="font-medium">{ref.fullName}</span>
                            <p className="text-xs text-muted-foreground">
                              Joined{" "}
                              {new Date(ref.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-sm text-muted-foreground font-mono">
                            {ref.installerCode}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* MotivationalNudge skeleton */}
            <div className="flex items-center gap-3 rounded-3xl squircle border border-border bg-card px-4 py-3">
              <Skeleton className="size-7 rounded-lg" />
              <Skeleton className="h-4 flex-1" />
            </div>

            {/* Stats Cards - 3 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>

            {/* Charts Row - 2 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-48" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-48" />
                </CardContent>
              </Card>
            </div>

            {/* Installation History skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <ChangePinDialog open={changePinOpen} onOpenChange={setChangePinOpen} />
      </div>
    </div>
  );
}
