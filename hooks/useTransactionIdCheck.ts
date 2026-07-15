import { useEffect, useState } from "react";

export interface FieldCheckState {
  isChecking: boolean;
  isValid: boolean;
  message: string;
}

/**
 * Live duplicate check for a Transaction ID, mirroring the serial-number check
 * in the reward edit modal. Debounced 500ms; skips when empty or unchanged from
 * the record's current value. Idle (valid) while empty so it never blocks a
 * "leave blank to keep pending" flow.
 *
 * State is only written from the async lookup (never synchronously in the effect
 * body); the checking/idle states are derived so we don't trigger cascading
 * renders.
 */
export function useTransactionIdCheck(
  transactionId: string,
  originalTransactionId: string,
  rewardId: string,
): FieldCheckState {
  // Result of the last completed lookup, keyed by the exact value checked.
  const [result, setResult] = useState<{ value: string; exists: boolean }>({
    value: "",
    exists: false,
  });

  const trimmed = transactionId.trim();
  const changed = !!trimmed && trimmed !== originalTransactionId.trim();

  useEffect(() => {
    if (!changed) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/rewards/check-transaction?transactionId=${encodeURIComponent(
            trimmed,
          )}&excludeRewardId=${encodeURIComponent(rewardId)}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "check failed");
        setResult({ value: trimmed, exists: !!data.data?.exists });
      } catch {
        // Network/parse failure: treat as available; the server-side duplicate
        // guard on PUT is the backstop.
        setResult({ value: trimmed, exists: false });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [changed, trimmed, rewardId]);

  if (!changed) {
    return { isChecking: false, isValid: true, message: "" };
  }

  // Still waiting for this exact value's result.
  if (result.value !== trimmed) {
    return {
      isChecking: true,
      isValid: true,
      message: "Checking transaction ID...",
    };
  }

  return result.exists
    ? { isChecking: false, isValid: false, message: "Transaction ID already used" }
    : { isChecking: false, isValid: true, message: "Transaction ID is available" };
}
