// Shared types for rewards that can be used in both client and server code

export enum RewardStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
}

// Product eligibility — orthogonal to RewardStatus (payment lifecycle).
// Only ELIGIBLE products flow into payment format, bulk-update templates and
// WhatsApp payment messages.
export enum ProductStatus {
  ELIGIBLE = "ELIGIBLE",
  NOT_ELIGIBLE = "NOT_ELIGIBLE",
  REJECTED = "REJECTED",
}

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  [ProductStatus.ELIGIBLE]: "Eligible",
  [ProductStatus.NOT_ELIGIBLE]: "Not Eligible",
  [ProductStatus.REJECTED]: "Rejected",
};

// Payment method options live in Settings (admin-editable); defaults in
// lib/constants PAYMENT_METHOD. Read them via usePaymentMethods().
