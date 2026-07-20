"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FormField } from "@/components/ui/form-field";
import { useRejectionReasons } from "@/hooks/useSettings";
import { FALSE_CLAIM_REASON } from "@/lib/constants";
import { ProductStatus, PRODUCT_STATUS_LABELS } from "@/types/rewards";

const STATUS_OPTIONS = [
  ProductStatus.ELIGIBLE,
  ProductStatus.NOT_ELIGIBLE,
  ProductStatus.REJECTED,
].map((value) => ({ value, label: PRODUCT_STATUS_LABELS[value] }));

const STATUS_HINTS: Record<ProductStatus, string> = {
  [ProductStatus.ELIGIBLE]:
    "Claim qualifies for a reward payment",
  [ProductStatus.NOT_ELIGIBLE]:
    "Valid claim, but this product is outside the reward program — no warning is issued",
  [ProductStatus.REJECTED]:
    "Claim is refused. A False Claim rejection issues a warning against the installer",
};

interface ProductStatusFieldsProps {
  productStatus: ProductStatus;
  rejectionReason: string;
  onProductStatusChange: (status: ProductStatus) => void;
  onRejectionReasonChange: (reason: string) => void;
  disabled?: boolean;
  idPrefix?: string;
}

/**
 * Product eligibility plus the reason a rejection was made.
 *
 * Picking Rejected pre-selects False Claim — the common case and the one that
 * issues a warning — while leaving the team free to pick a milder reason.
 */
export function ProductStatusFields({
  productStatus,
  rejectionReason,
  onProductStatusChange,
  onRejectionReasonChange,
  disabled,
  idPrefix = "reward",
}: ProductStatusFieldsProps) {
  const reduceMotion = useReducedMotion();
  const reasons = useRejectionReasons();
  const isRejected = productStatus === ProductStatus.REJECTED;

  const handleStatusChange = (value: string) => {
    const next = value as ProductStatus;
    onProductStatusChange(next);

    if (next === ProductStatus.REJECTED) {
      if (!rejectionReason) onRejectionReasonChange(FALSE_CLAIM_REASON);
    } else if (rejectionReason) {
      // A non-rejected product must not carry a stale reason into the payload.
      onRejectionReasonChange("");
    }
  };

  return (
    <>
      <FormField
        type="select"
        label="Product Status"
        id={`${idPrefix}-product-status`}
        value={productStatus}
        onChange={handleStatusChange}
        placeholder="Select product status"
        hint={STATUS_HINTS[productStatus]}
        options={STATUS_OPTIONS}
        disabled={disabled}
        required
        aria-label="Product eligibility status"
        aria-required="true"
      />

      <AnimatePresence initial={false}>
        {isRejected && (
          <motion.div
            key="rejection-reason"
            initial={reduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 380, damping: 32 }
            }
          >
            <FormField
              type="select"
              label="Rejection Reason"
              id={`${idPrefix}-rejection-reason`}
              value={rejectionReason}
              onChange={onRejectionReasonChange}
              placeholder="Select a rejection reason"
              hint={
                rejectionReason === FALSE_CLAIM_REASON
                  ? "This issues a warning against the installer and may suspend the account"
                  : "No warning is issued for this reason"
              }
              options={reasons.map((reason) => ({
                value: reason,
                label: reason,
              }))}
              disabled={disabled}
              required
              aria-label="Reason the product was rejected"
              aria-required="true"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
