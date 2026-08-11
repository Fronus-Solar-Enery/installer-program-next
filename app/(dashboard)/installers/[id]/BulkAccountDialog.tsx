"use client";

import { useMemo, useState } from "react";
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
import { FormField } from "@/components/ui/form-field";
import { BANKS } from "@/lib/constants";
import {
  phoneNumberToDBFormat,
  stripAccountNumberSpaces,
} from "@/lib/validation-helpers";
import { useBulkUpdateRewardAccount } from "@/hooks/useInstallerDetails";
import Loading from "@/components/ui/loading";

interface AccountDefaults {
  bankName?: string;
  accountNumber?: string;
  accountTitle?: string;
}

interface BulkAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rewardIds: string[];
  /** Prefill — the installer's current profile account details. */
  defaults: AccountDefaults;
  onSuccess: () => void;
}

// Digital wallets are keyed by phone number: accept 03xxxxxxxxx or +92xxxxxxxxxx
// and normalise back to local form for the length/prefix check.
function localDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length >= 12) return "0" + digits.slice(2);
  if (digits.startsWith("3") && digits.length === 10) return "0" + digits;
  return digits;
}

export default function BulkAccountDialog(props: BulkAccountDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {/* Radix unmounts content on close, so the form re-mounts prefilled
            from the installer's profile on every open — no reset effect. */}
        <BulkAccountForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function BulkAccountForm({
  onOpenChange,
  rewardIds,
  defaults,
  onSuccess,
}: BulkAccountDialogProps) {
  const [bankName, setBankName] = useState(defaults.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(
    defaults.accountNumber ?? "",
  );
  const [accountTitle, setAccountTitle] = useState(defaults.accountTitle ?? "");

  const bulkUpdate = useBulkUpdateRewardAccount();

  const bankGroups = useMemo(
    () => [
      {
        label: "Digital Payment Methods",
        options: BANKS.filter((b) => b.mobile).map((b) => ({
          value: b.label,
          label: b.label,
        })),
      },
      {
        label: "Commercial Banks",
        options: BANKS.filter((b) => !b.mobile).map((b) => ({
          value: b.label,
          label: b.label,
        })),
      },
    ],
    [],
  );

  const isDigital = useMemo(
    () => BANKS.find((b) => b.label === bankName)?.mobile ?? false,
    [bankName],
  );

  const accountError = useMemo(() => {
    if (!accountNumber.trim()) return undefined;
    if (!isDigital) return undefined;
    const digits = localDigits(accountNumber);
    if (digits.length !== 11 || !digits.startsWith("03")) {
      return "Enter a valid mobile wallet number (03XX-XXXXXXX)";
    }
    return undefined;
  }, [accountNumber, isDigital]);

  const canSubmit =
    !!bankName &&
    accountTitle.trim().length >= 2 &&
    accountNumber.trim().length >= 5 &&
    !accountError &&
    !bulkUpdate.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    bulkUpdate.mutate(
      {
        rewardIds,
        bankName,
        accountNumber: isDigital
          ? phoneNumberToDBFormat(accountNumber)
          : accountNumber.trim(),
        accountTitle: accountTitle.trim(),
      },
      {
        onSuccess: (result) => {
          toast.success(result.message);
          onOpenChange(false);
          onSuccess();
        },
        onError: (err) =>
          toast.error(err.message || "Failed to update account details"),
      },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Update Account Details</DialogTitle>
        <DialogDescription>
          Applies to {rewardIds.length} selected product
          {rewardIds.length === 1 ? "" : "s"}. Only the payment destination on
          these rewards changes — the installer&apos;s profile is untouched.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <FormField
          type="select"
          label="Bank / Payment Method"
          id="bulkBankName"
          value={bankName}
          onChange={(value) => {
            setBankName(value);
            setAccountNumber("");
          }}
          placeholder="Select Bank / Payment Method"
          groups={bankGroups}
          searchable
          searchPlaceholder="Search banks..."
          emptyMessage="No bank found."
          required
        />

        <FormField
          type="text"
          label="Account Title"
          id="bulkAccountTitle"
          value={accountTitle}
          onChange={setAccountTitle}
          placeholder="Account holder name"
          required
        />

        <FormField
          type="text"
          label={isDigital ? "Mobile Wallet Number" : "Account Number"}
          id="bulkAccountNumber"
          value={accountNumber}
          onChange={(val) => setAccountNumber(stripAccountNumberSpaces(val))}
          placeholder={isDigital ? "03XX-XXXXXXX" : "Account / IBAN number"}
          error={accountError}
          hint={
            isDigital
              ? "Saved as +92 format, matching the installer registration form."
              : "Spaces are removed automatically — account numbers are stored unspaced."
          }
          required
        />
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={bulkUpdate.isPending}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {bulkUpdate.isPending ? (
            <>
              <Loading /> Updating…
            </>
          ) : (
            `Update ${rewardIds.length} product${rewardIds.length === 1 ? "" : "s"}`
          )}
        </Button>
      </DialogFooter>
    </>
  );
}
