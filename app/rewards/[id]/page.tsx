"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Trash2,
  Package,
  User,
  Clock,
  Calendar,
  UserPlus,
  Award,
  Check,
  Landmark,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IconArrowLeft, IconEdit2 } from "@/components/icons";
import PageHeader from "@/components/PageHeader";
import { CopyButton } from "@/components/CopyButton";
import { SimpleDeleteDialog } from "@/components/SimpleDeleteDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function RewardDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const rewardId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [reward, setReward] = useState<{
    serialNumber: string;
    productModel: string;
    installer?: {
      installerCode: string;
      fullName: string;
      cnic?: string;
      phoneNumber?: string;
    };
    installerCode?: string;
    registeredBy?: { name: string; email: string };
    referrer?: { installerCode: string; fullName: string };
    referrerCode?: string;
    cityOfInstallation?: string;
    installationDate?: string;
    rewardStatus: string;
    rewardAmount?: number;
    referrerRewardAmount?: number;
    transactionId?: string;
    referrerTransactionId?: string;
    sendingDate?: string;
    paymentMethod?: string;
    bankName?: string;
    accountNumber?: string;
    accountTitle?: string;
    serialNumberStatus?: string;
    inverterSerialNumber?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchReward = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rewards/${rewardId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch reward");
      }

      setReward(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch reward");
    } finally {
      setLoading(false);
    }
  }, [rewardId]);

  useEffect(() => {
    fetchReward();
  }, [fetchReward]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/rewards/${rewardId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/rewards");
      }
    } catch (error) {
      console.error("Failed to delete reward:", error);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto space-y-4">
        <div className="flex items-center gap-4 py-6 ml-6">
          <Skeleton round className="size-16" />
          <div className="space-y-3">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-36" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !reward) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Alert variant="destructive">
              <AlertDescription>{error || "Reward not found"}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/rewards")}>
              Back to Rewards
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {reward.productModel}
            <Badge
              variant={
                reward.rewardStatus === "PAID"
                  ? "success"
                  : reward.rewardStatus === "PENDING"
                    ? "warning"
                    : "destructive"
              }
            >
              {reward.rewardStatus}
            </Badge>
          </span>
        }
        description={
          <span className="flex items-center gap-2 text-muted-foreground">
            <CopyButton text={reward.serialNumber} label="Serial Number" />
            {reward.serialNumber}
          </span>
        }
        action={
          <div className="flex gap-3">
            <Button>
              <IconEdit2 className="mr-2" />
              Edit
            </Button>

            <Button variant="destructive" onClick={handleDeleteClick}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        }
        Icon={
          <Button
            onClick={() => router.push("/rewards")}
            variant={"outline"}
            className="flex items-center justify-center size-16 rounded-full nosquircle"
          >
            <IconArrowLeft className="size-5" />
          </Button>
        }
      />

      {/* Overview Card */}
      <Card className="shadow-layered bg-muted/20">
        <CardContent className="p-5 lg:p-6">
          <div className="flex items-start gap-5">
            <div className="size-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Package className="h-7 w-7 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold leading-tight font-mono">
                    {reward.serialNumber}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">
                      {reward.productModel}
                    </span>
                    {reward.installer && (
                      <Badge variant="secondary" className="gap-1">
                        <User className="h-3 w-3" />
                        {reward.installer.fullName}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-semibold text-success-text">
                    Rs. {reward.rewardAmount?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Reward Amount
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
                {reward.cityOfInstallation && (
                  <span className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    {reward.cityOfInstallation}
                  </span>
                )}
                {reward.installationDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(reward.installationDate).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" },
                    )}
                  </span>
                )}
                {reward.rewardStatus === "PAID" && reward.sendingDate && (
                  <span className="flex items-center gap-1.5 text-success-text">
                    <Check className="h-3.5 w-3.5" />
                    Paid{" "}
                    {new Date(reward.sendingDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product Information */}
        <Card className="transition-all duration-300 hover:shadow-layered">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-0 divide-y divide-border">
              <div className="flex items-center justify-between py-2.5 first:pt-0">
                <dt className="text-xs text-muted-foreground">Product Model</dt>
                <dd className="text-sm font-medium">{reward.productModel}</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-xs text-muted-foreground">Serial #</dt>
                <dd className="text-sm font-mono flex items-center gap-1.5">
                  {reward.serialNumber}
                  <CopyButton
                    text={reward.serialNumber}
                    label="Serial Number"
                  />
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-xs text-muted-foreground">Serial Status</dt>
                <dd className="text-sm">
                  {reward.serialNumberStatus || "N/A"}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5 last:pb-0">
                <dt className="text-xs text-muted-foreground">
                  Inverter Serial
                </dt>
                <dd className="text-sm font-mono flex items-center gap-1.5">
                  {reward.inverterSerialNumber || "N/A"}
                  {reward.inverterSerialNumber && (
                    <CopyButton
                      text={reward.inverterSerialNumber}
                      label="Inverter Serial Number"
                    />
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Installer Information */}
        <Card className="transition-all duration-300 hover:shadow-layered">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Installer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-0 divide-y divide-border">
              <div className="flex items-center justify-between py-2.5 first:pt-0">
                <dt className="text-xs text-muted-foreground">Name</dt>
                <dd className="text-sm font-medium">
                  {reward.installer?.fullName || "N/A"}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-xs text-muted-foreground">
                  Installer Code
                </dt>
                <dd className="text-sm font-mono flex items-center gap-1.5">
                  {reward.installerCode ||
                    reward.installer?.installerCode ||
                    "N/A"}
                  {(reward.installerCode ||
                    reward.installer?.installerCode) && (
                    <CopyButton
                      text={
                        reward.installerCode ||
                        reward.installer?.installerCode ||
                        ""
                      }
                      label="Installer Code"
                    />
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-xs text-muted-foreground">CNIC</dt>
                <dd className="text-sm font-mono">
                  {reward.installer?.cnic || "N/A"}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5 last:pb-0">
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd className="text-sm">
                  {reward.installer?.phoneNumber || "N/A"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card className="transition-all duration-300 hover:shadow-layered">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-0 divide-y divide-border">
              <div className="flex items-center justify-between py-2.5 first:pt-0">
                <dt className="text-xs text-muted-foreground">Reward Amount</dt>
                <dd className="text-base font-semibold text-success-text">
                  Rs. {reward.rewardAmount?.toLocaleString() || 0}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-xs text-muted-foreground">Bank</dt>
                <dd className="text-sm font-medium">
                  {reward.bankName || "N/A"}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-xs text-muted-foreground">Account #</dt>
                <dd className="text-sm font-mono flex items-center gap-1.5">
                  {reward.accountNumber || "N/A"}
                  {reward.accountNumber && (
                    <CopyButton
                      text={reward.accountNumber}
                      label="Account Number"
                    />
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-xs text-muted-foreground">Account Title</dt>
                <dd className="text-sm text-right max-w-[60%]">
                  {reward.accountTitle || "N/A"}
                </dd>
              </div>
              {reward.transactionId && (
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-xs text-muted-foreground">
                    Transaction ID
                  </dt>
                  <dd className="text-sm font-mono flex items-center gap-1.5">
                    {reward.transactionId}
                    <CopyButton
                      text={reward.transactionId}
                      label="Transaction ID"
                    />
                  </dd>
                </div>
              )}
              {reward.paymentMethod && (
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-xs text-muted-foreground">
                    Payment Method
                  </dt>
                  <dd className="text-sm">{reward.paymentMethod}</dd>
                </div>
              )}
              {reward.sendingDate && (
                <div className="flex items-center justify-between py-2.5 last:pb-0">
                  <dt className="text-xs text-muted-foreground">
                    Sending Date
                  </dt>
                  <dd className="text-sm">
                    {new Date(reward.sendingDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Registration Information */}
        <Card className="transition-all duration-300 hover:shadow-layered">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Registration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-0 divide-y divide-border">
              <div className="flex items-center justify-between py-2.5 first:pt-0">
                <dt className="text-xs text-muted-foreground">Registered By</dt>
                <dd className="text-sm text-right max-w-[60%]">
                  {reward.registeredBy?.name || "N/A"}
                  {reward.registeredBy?.email && (
                    <span className="block text-xs text-muted-foreground">
                      {reward.registeredBy.email}
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd className="text-sm">
                  {reward.createdAt
                    ? new Date(reward.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "N/A"}
                </dd>
              </div>
              {reward.updatedAt && (
                <div className="flex items-center justify-between py-2.5 last:pb-0">
                  <dt className="text-xs text-muted-foreground">Updated</dt>
                  <dd className="text-sm">
                    {new Date(reward.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Referrer Information (if exists) */}
        {reward.referrer && (
          <Card className="lg:col-span-2 transition-all duration-300 hover:shadow-layered">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                Referrer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 flex-1">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">
                      {reward.referrer.fullName}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                      {reward.referrerCode || reward.referrer.installerCode}
                      <CopyButton
                        text={
                          reward.referrerCode ||
                          reward.referrer.installerCode ||
                          ""
                        }
                        label="Referrer Code"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 flex-1">
                  <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-success-text">
                      Rs. {reward.referrerRewardAmount?.toLocaleString() || 500}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Referrer Reward
                    </div>
                  </div>
                </div>
              </div>
              {reward.referrerTransactionId && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Transaction:</span>
                  <span className="font-mono flex items-center gap-1">
                    {reward.referrerTransactionId}
                    <CopyButton
                      text={reward.referrerTransactionId}
                      label="Referrer Transaction ID"
                    />
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <SimpleDeleteDialog
        open={deleteDialogOpen}
        deleting={deleting}
        itemName={reward.serialNumber}
        entityType="reward"
        warningMessage="The reward will be permanently removed from the database."
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
