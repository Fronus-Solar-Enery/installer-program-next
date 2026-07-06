"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  if (status === "PAID") {
    return (
      <Badge className="bg-success/15 text-success-text border-transparent">
        Paid
      </Badge>
    );
  }
  if (status === "FAILED") {
    return <Badge variant="destructive">Failed</Badge>;
  }
  return <Badge variant="secondary">Pending</Badge>;
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
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
              onChange={(e) => setConfirmPin(digits(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
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
            {saving ? "Saving…" : "Save PIN"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MyStatsDashboard() {
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
        if (e.message !== "unauthorized")
          setError("Failed to load your stats");
      });
  }, []);

  const handleShare = () => {
    const url = `${window.location.origin}/installer/${data?.installer.installerCode}`;
    if (navigator.share) {
      navigator.share({ title: "My Fronus Installer Profile", url }).catch(() => {});
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
        <Card className="max-w-md w-full text-center p-8">
          <p className="text-destructive-text">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ProgramLogo className="w-28" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setChangePinOpen(true)}>
              Change PIN
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </header>

        {data ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="space-y-8"
          >
            {/* Identity */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{data.installer.fullName}</h1>
                <p className="text-muted-foreground mt-1">
                  <span className="font-mono tracking-wider">
                    {data.installer.installerCode}
                  </span>
                  {" · "}
                  {data.installer.city}, {data.installer.district}
                  {data.installer.certified && (
                    <Badge className="ml-2 bg-brand-700/20 text-brand-1000 dark:text-brand-600 border-transparent align-middle">
                      Verified Installer
                    </Badge>
                  )}
                </p>
              </div>
              <Button onClick={handleShare}>Share your page</Button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(
                [
                  ["Total Rewards", data.stats.totalRewards],
                  ["Paid", data.stats.paidRewards],
                  ["Pending", data.stats.pendingRewards],
                ] as const
              ).map(([label, amount]) => (
                <Card key={label}>
                  <CardHeader className="pb-2">
                    <CardDescription>{label}</CardDescription>
                    <CardTitle className="text-2xl tabular-nums">
                      {rs(amount)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {/* Installation history */}
            <Card>
              <CardHeader>
                <CardTitle>Installation History</CardTitle>
                <CardDescription>
                  {data.stats.installationCount} installation
                  {data.stats.installationCount === 1 ? "" : "s"} recorded
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                          <TableHead>Product</TableHead>
                          <TableHead>Serial #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.rewards.map((reward) => (
                          <TableRow key={reward._id}>
                            <TableCell className="font-medium">
                              {reward.productModel}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {reward.serialNumber}
                            </TableCell>
                            <TableCell>
                              {new Date(
                                reward.installationDate || reward.createdAt
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={reward.rewardStatus} />
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
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

            {/* Referrals */}
            {data.referredInstallers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Referrals</CardTitle>
                  <CardDescription>
                    Referral earnings: {rs(data.stats.referralEarnings)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {data.referredInstallers.map((ref) => (
                      <li
                        key={ref._id}
                        className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3"
                      >
                        <span className="font-medium">{ref.fullName}</span>
                        <span className="text-sm text-muted-foreground font-mono">
                          {ref.installerCode}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </motion.div>
        ) : (
          <div className="space-y-8">
            <Skeleton className="h-16 w-72" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-64" />
          </div>
        )}

        <ChangePinDialog open={changePinOpen} onOpenChange={setChangePinOpen} />
      </div>
    </div>
  );
}
