// Shared types for rewards that can be used in both client and server code

export enum RewardStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
}

// Payment method options live in Settings (admin-editable); defaults in
// lib/constants PAYMENT_METHOD. Read them via usePaymentMethods().
