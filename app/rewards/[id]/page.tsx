"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  IconArrowLeft,
  IconEdit2,
  IconInstaller,
  IconSerialNumber,
} from "@/components/icons";
import PageHeader from "@/components/PageHeader";
import { CopyButton } from "@/components/CopyButton";
import { SimpleDeleteDialog } from "@/components/SimpleDeleteDialog";

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

      // const data = await response.json();

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
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading reward details...</p>
        </div>
      </div>
    );
  }

  if (error || !reward) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <Card className="w-full max-w-md">
            <CardContent className="text-center pt-6">
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>
                  {error || "Reward not found"}
                </AlertDescription>
              </Alert>
              <Button onClick={() => router.push("/rewards")}>
                Back to Rewards
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={
          <div className="flex items-center gap-2">
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
          </div>
        }
        description={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <IconInstaller fill duotone opacity={0.1} className="size-6" />
              <span className="space-y-1">
                <p className="text-xs text-muted-foreground leading-none">
                  Installer
                </p>
                <p className="leading-none text-xs text-foreground">
                  {reward.installer?.fullName}
                </p>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <IconSerialNumber fill duotone opacity={0.1} className="size-6" />
              <span className="space-y-1">
                <p className="text-xs text-muted-foreground leading-none">
                  Serial Number
                </p>
                <p className="leading-none text-xs text-foreground flex items-center">
                  {reward.serialNumber}{" "}
                  <CopyButton className="size-4" text={reward.serialNumber} />
                </p>
              </span>
            </div>
          </div>
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
          <>
            <Button
              onClick={() => router.push("/rewards")}
              variant={"outline"}
              className="flex items-center justify-center size-16 rounded-full nosquircle"
            >
              <IconArrowLeft className="size-5" />
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Serial Number
              </div>
              <div className="mt-1 text-sm flex items-center">
                {reward.serialNumber}
                <CopyButton text={reward.serialNumber} label="Serial Number" />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Product Model
              </div>
              <div className="mt-1 text-sm">{reward.productModel}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Serial Number Status
              </div>
              <div className="mt-1 text-sm">{reward.serialNumberStatus}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Inverter Serial Number
              </div>
              <div className="mt-1 text-sm flex items-center">
                {reward.inverterSerialNumber || "N/A"}
                {reward.inverterSerialNumber && (
                  <CopyButton
                    text={reward.inverterSerialNumber}
                    label="Inverter Serial Number"
                  />
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                City of Installation
              </div>
              <div className="mt-1 text-sm">{reward.cityOfInstallation}</div>
            </div>
            {reward.installationDate && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Installation Date
                </div>
                <div className="mt-1 text-sm">
                  {new Date(reward.installationDate).toLocaleDateString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Installer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Installer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Installer Code
              </div>
              <div className="mt-1 text-sm flex items-center">
                {reward.installerCode ||
                  reward.installer?.installerCode ||
                  "N/A"}
                {(reward.installerCode || reward.installer?.installerCode) && (
                  <CopyButton
                    text={
                      reward.installerCode ||
                      reward.installer?.installerCode ||
                      ""
                    }
                    label="Installer Code"
                  />
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Installer Name
              </div>
              <div className="mt-1 text-sm">
                {reward.installer?.fullName || "N/A"}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Installer CNIC
              </div>
              <div className="mt-1 text-sm">
                {reward.installer?.cnic || "N/A"}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Installer Phone
              </div>
              <div className="mt-1 text-sm">
                {reward.installer?.phoneNumber || "N/A"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Reward Amount
              </div>
              <div className="mt-1 text-lg font-semibold text-green-600">
                Rs. {reward.rewardAmount?.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Bank Name
              </div>
              <div className="mt-1 text-sm">{reward.bankName}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Account Number
              </div>
              <div className="mt-1 text-sm flex items-center">
                {reward.accountNumber || "N/A"}
                {reward.accountNumber && (
                  <CopyButton
                    text={reward.accountNumber}
                    label="Account Number"
                  />
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Account Title
              </div>
              <div className="mt-1 text-sm">{reward.accountTitle}</div>
            </div>
            {reward.transactionId && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Transaction ID
                </div>
                <div className="mt-1 text-sm flex items-center">
                  {reward.transactionId}
                  <CopyButton
                    text={reward.transactionId}
                    label="Transaction ID"
                  />
                </div>
              </div>
            )}
            {reward.paymentMethod && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Payment Method
                </div>
                <div className="mt-1 text-sm">{reward.paymentMethod}</div>
              </div>
            )}
            {reward.sendingDate && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Sending Date
                </div>
                <div className="mt-1 text-sm">
                  {new Date(reward.sendingDate).toLocaleDateString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referrer Information (if exists) */}
        {reward.referrer && (
          <Card>
            <CardHeader>
              <CardTitle>Referrer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Referrer Code
                </div>
                <div className="mt-1 text-sm flex items-center">
                  {reward.referrerCode ||
                    reward.referrer?.installerCode ||
                    "N/A"}
                  {(reward.referrerCode || reward.referrer?.installerCode) && (
                    <CopyButton
                      text={
                        reward.referrerCode ||
                        reward.referrer?.installerCode ||
                        ""
                      }
                      label="Referrer Code"
                    />
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Referrer Name
                </div>
                <div className="mt-1 text-sm">{reward.referrer.fullName}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Referrer Reward Amount
                </div>
                <div className="mt-1 text-lg font-semibold text-green-600">
                  Rs. {reward.referrerRewardAmount || 500}
                </div>
              </div>
              {reward.referrerTransactionId && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Referrer Transaction ID
                  </div>
                  <div className="mt-1 text-sm flex items-center">
                    {reward.referrerTransactionId}
                    <CopyButton
                      text={reward.referrerTransactionId}
                      label="Referrer Transaction ID"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Registration Information */}
        <Card>
          <CardHeader>
            <CardTitle>Registration Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Registered By
              </div>
              <div className="mt-1 text-sm">
                {reward.registeredBy?.name || "N/A"} (
                {reward.registeredBy?.email || "N/A"})
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Created At
              </div>
              <div className="mt-1 text-sm">
                {reward.createdAt
                  ? new Date(reward.createdAt).toLocaleString()
                  : "N/A"}
              </div>
            </div>
            {reward.updatedAt && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </div>
                <div className="mt-1 text-sm">
                  {new Date(reward.updatedAt).toLocaleString()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
