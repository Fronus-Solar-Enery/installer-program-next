// Shared types for rewards that can be used in both client and server code

export enum RewardStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
}

export const PAYMENT_METHODS = [
  "Bank Transfer",
  "Cheque",
  "Cash",
  "Online Payment",
  "Mobile Banking",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
