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
import { RewardStatus } from "@/types/rewards";
import { IconSave } from "@/components/icons";

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

  // In edit mode the status is user-controlled; mark/retry always resolve PAID.
  const willBePaid = edit ? status === RewardStatus.PAID : true;
  const requireTxn =
    (settings?.requireTransactionIdForPaid ?? true) && willBePaid;

  const handleSubmit = () => {
    if (requireTxn && !transactionId.trim()) {
      setFieldError("Transaction ID is required");
      return;
    }
    setFieldError(null);
    markPaid.mutate(
      {
        transactionId: transactionId.trim() || undefined,
        referrerTransactionId: reward.referrer
          ? referrerTransactionId.trim() || undefined
          : undefined,
        paymentMethod,
        sendingDate,
        rewardStatus: edit ? status : undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            edit
              ? status === RewardStatus.PAID
                ? "Payment details updated"
                : `Status changed to ${status.toLowerCase()}`
              : `Rs. ${(reward.rewardAmount ?? 0).toLocaleString()} recorded as paid`,
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
          <Label htmlFor="mark-paid-txn">
            Transaction ID
            {requireTxn && <span className="text-destructive-text"> *</span>}
          </Label>
          <Input
            id="mark-paid-txn"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="e.g. TXN-2026-00123"
            className="font-mono"
            aria-invalid={!!fieldError}
            autoFocus
          />
          {fieldError && (
            <p role="alert" className="text-xs text-destructive-text">
              {fieldError}
            </p>
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
          disabled={markPaid.isPending}
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
