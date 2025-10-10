"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { Copy, Check, Edit, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function RewardDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const rewardId = params.id as string;
  const { copiedText, copyToClipboard } = useCopyToClipboard();

  const [loading, setLoading] = useState(true);
  const [reward, setReward] = useState<{
    serialNumber: string;
    productModel: string;
    installer?: { installerCode: string; fullName: string; cnic?: string; phoneNumber?: string };
    installerCode?: string;
    registeredBy?: { name: string; email: string };
    referrer?: { installerCode: string; fullName: string };
    referrerCode?: string;
    cityOfInstallation?: string;
    installationDate?: string;
    paymentStatus: string;
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

  const CopyButton = ({ text, label }: { text: string; label: string }) => {
    const isCopied = copiedText === text;

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => copyToClipboard(text)}
        className="ml-2 h-8 w-8 p-0"
        title={`Copy ${label}`}
      >
        {isCopied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    );
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
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/rewards")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rewards
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">Reward Details</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Serial Number: {reward.serialNumber}
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => router.push(`/rewards/${rewardId}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDeleteClick}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Payment Status Badge */}
        <div className="mb-6">
          <Badge
            variant={
              reward.paymentStatus === "PAID"
                ? "default"
                : reward.paymentStatus === "PENDING"
                ? "secondary"
                : "destructive"
            }
            className="text-sm px-4 py-2"
          >
            {reward.paymentStatus}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <CopyButton
                    text={reward.serialNumber}
                    label="Serial Number"
                  />
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
                  {reward.inverterSerialNumber || 'N/A'}
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
                  {reward.installerCode || reward.installer?.installerCode || 'N/A'}
                  {(reward.installerCode || reward.installer?.installerCode) && (
                    <CopyButton
                      text={reward.installerCode || reward.installer?.installerCode || ''}
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
                  {reward.accountNumber || 'N/A'}
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
                    {reward.referrerCode || reward.referrer?.installerCode || 'N/A'}
                    {(reward.referrerCode || reward.referrer?.installerCode) && (
                      <CopyButton
                        text={reward.referrerCode || reward.referrer?.installerCode || ''}
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
                  {reward.createdAt ? new Date(reward.createdAt).toLocaleString() : 'N/A'}
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
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              reward and remove it from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
