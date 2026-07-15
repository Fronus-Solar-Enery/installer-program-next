"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Loading from "@/components/ui/loading";
import { usePaymentMethods, useSettings } from "@/hooks/useSettings";
import {
  useMarkRewardPaid,
  type RewardDetails,
} from "@/hooks/useRewardDetails";
import { useTransactionIdCheck } from "@/hooks/useTransactionIdCheck";
import { RewardStatus } from "@/types/rewards";
import { IconSave } from "@/components/icons";
import { HyperText } from "@/components/ui/hypertext";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: RewardStatus.PENDING, label: "Pending" },
  { value: RewardStatus.PAID, label: "Paid" },
  { value: RewardStatus.FAILED, label: "Failed" },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Rendered inside DialogContent, which Radix unmounts on close — so field
// state re-seeds from the record naturally on every open, no effect needed.
function MarkPaidForm({
  reward,
  onOpenChange,
  edit,
}: {
  reward: RewardDetails;
  onOpenChange: (open: boolean) => void;
  edit?: boolean;
}) {
  const settings = useSettings().data;
  const paymentMethods = usePaymentMethods();
  const markPaid = useMarkRewardPaid(reward._id);

  const [transactionId, setTransactionId] = useState(
    reward.transactionId || "",
  );
  const [referrerTransactionId, setReferrerTransactionId] = useState(
    reward.referrerTransactionId || "",
  );
  const [paymentMethod, setPaymentMethod] = useState(
    reward.paymentMethod || paymentMethods[0],
  );
  // Keep a legacy/retired method selectable on old records.
  const methodOptions =
    paymentMethod && !paymentMethods.includes(paymentMethod)
      ? [paymentMethod, ...paymentMethods]
      : paymentMethods;
  const [sendingDate, setSendingDate] = useState(
    reward.sendingDate ? reward.sendingDate.slice(0, 10) : today(),
  );
  const [status, setStatus] = useState<RewardStatus>(
    reward.rewardStatus ?? RewardStatus.PAID,
  );
  const [fieldError, setFieldError] = useState<string | null>(null);

  const txnCheck = useTransactionIdCheck(
    transactionId,
    reward.transactionId || "",
    reward._id,
  );
  const txnChanged =
    transactionId.trim() !== (reward.transactionId || "").trim() &&
    transactionId.trim() !== "";

  // Status resolution: edit mode is user-controlled. In mark/retry mode the
  // status follows the transaction ID — with an ID it's PAID, blank keeps it
  // PENDING (so "Mark as Paid" can be saved without an ID).
  const resolvedStatus: RewardStatus = edit
    ? status
    : transactionId.trim()
      ? RewardStatus.PAID
      : RewardStatus.PENDING;
  const requireTxnSetting = settings?.requireTransactionIdForPaid ?? true;

  const handleSubmit = () => {
    // Block on a duplicate transaction ID (server also guards this).
    if (!txnCheck.isValid) {
      setFieldError("Transaction ID already used");
      return;
    }
    // Require an ID only when a reward is *becoming* paid (matches the server).
    // Editing an already-paid reward may clear the ID without being blocked.
    const becomingPaid =
      reward.rewardStatus !== RewardStatus.PAID &&
      resolvedStatus === RewardStatus.PAID;
    if (becomingPaid && requireTxnSetting && !transactionId.trim()) {
      setFieldError("Transaction ID is required to mark as paid");
      return;
    }
    setFieldError(null);
    markPaid.mutate(
      {
        // Send the trimmed value (empty string included) so clearing the field
        // actually persists — `|| undefined` would drop the key and leave the
        // old transaction ID in the database.
        transactionId: transactionId.trim(),
        referrerTransactionId: reward.referrer
          ? referrerTransactionId.trim()
          : undefined,
        paymentMethod,
        sendingDate,
        rewardStatus: resolvedStatus,
      },
      {
        onSuccess: () => {
          const paid = resolvedStatus === RewardStatus.PAID;
          toast.success(
            edit
              ? paid
                ? "Payment details updated"
                : `Status changed to ${resolvedStatus.toLowerCase()}`
              : paid
                ? `Rs. ${(reward.rewardAmount ?? 0).toLocaleString()} recorded as paid`
                : "Saved as pending — add a transaction ID to mark it paid",
          );
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to record payment");
        },
      },
    );
  };

  return (
    <>
      <div className="space-y-4 py-2 p-4">
        {edit && (
          <div className="space-y-1.5">
            <Label htmlFor="mark-paid-status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as RewardStatus)}
            >
              <SelectTrigger id="mark-paid-status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="mark-paid-txn">Transaction ID</Label>
          <div className="relative">
            <Input
              id="mark-paid-txn"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. TXN-2026-00123"
              className="font-mono pr-16"
              aria-invalid={!!fieldError || !txnCheck.isValid}
              autoFocus
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {txnCheck.isChecking ? (
                <Loading />
              ) : txnChanged ? (
                <HyperText
                  className={cn(
                    "tracking-widest text-xs uppercase pointer-events-none select-none leading-none",
                    txnCheck.isValid
                      ? "text-success-text"
                      : "text-destructive-text",
                  )}
                >
                  {txnCheck.isValid ? "Valid" : "Invalid"}
                </HyperText>
              ) : null}
            </div>
          </div>
          {fieldError ? (
            <p role="alert" className="text-xs text-destructive-text">
              {fieldError}
            </p>
          ) : txnChanged && txnCheck.message ? (
            <p
              className={cn(
                "text-xs",
                txnCheck.isValid
                  ? "text-muted-foreground"
                  : "text-destructive-text",
              )}
            >
              {txnCheck.isValid ? `✓ ${txnCheck.message}` : `✗ ${txnCheck.message}`}
            </p>
          ) : (
            !edit && (
              <p className="text-xs text-muted-foreground">
                Leave blank to save as pending.
              </p>
            )
          )}
        </div>

        {reward.referrer && (
          <div className="space-y-1.5">
            <Label htmlFor="mark-paid-referrer-txn">
              Referrer Transaction ID
            </Label>
            <Input
              id="mark-paid-referrer-txn"
              value={referrerTransactionId}
              onChange={(e) => setReferrerTransactionId(e.target.value)}
              placeholder={`Payment to ${reward.referrer.fullName}`}
              className="font-mono"
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="mark-paid-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="mark-paid-method">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {methodOptions.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mark-paid-date">Sending Date</Label>
            <Input
              id="mark-paid-date"
              type="date"
              value={sendingDate}
              onChange={(e) => setSendingDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <DialogFooter className="border-t border-border p-6">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={markPaid.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            markPaid.isPending || txnCheck.isChecking || !txnCheck.isValid
          }
          className="pl-3"
        >
          {markPaid.isPending ? (
            <span className="flex items-center gap-2">
              <Loading className="text-background" /> Recording…
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <IconSave /> Save
            </div>
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

interface MarkPaidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reward: RewardDetails;
  retry?: boolean;
  edit?: boolean;
}

export default function MarkPaidDialog({
  open,
  onOpenChange,
  reward,
  retry,
  edit,
}: MarkPaidDialogProps) {
  const title = edit
    ? "Edit payment"
    : retry
      ? "Retry payment"
      : "Mark as Paid";
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0">
        <DialogHeader className="border-b border-border p-6">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {edit ? "Update the recorded payment of" : "Record the payment of"}{" "}
            <span className="font-semibold text-foreground tabular-nums">
              Rs. {(reward.rewardAmount ?? 0).toLocaleString()}
            </span>{" "}
            to{" "}
            {reward.installer?.fullName || reward.installerCode || "installer"}.
          </DialogDescription>
        </DialogHeader>
        <MarkPaidForm reward={reward} onOpenChange={onOpenChange} edit={edit} />
      </DialogContent>
    </Dialog>
  );
}
