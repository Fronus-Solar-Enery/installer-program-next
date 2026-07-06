import { HydratedDocument } from "mongoose";
import dbConnect from "@/lib/mongodb";
import PasswordReset, { IPasswordReset } from "@/models/PasswordReset";

/** A 6-digit PIN can be guessed at most this many times before it is destroyed. */
export const MAX_PIN_ATTEMPTS = 5;

export type VerifyPinResult =
  | { ok: true; record: HydratedDocument<IPasswordReset> }
  | { ok: false; status: number; error: string };

/**
 * Verify a password-reset PIN and enforce a per-record attempt lock.
 *
 * There is one active reset record per email (forgot-password deletes prior
 * ones). A wrong PIN atomically increments that record's attempt counter; once
 * MAX_PIN_ATTEMPTS is reached the record is destroyed regardless of expiry, so
 * the 1,000,000-value PIN space can only be probed 5 times before a fresh PIN
 * must be requested — which requires access to the target's mailbox. This is
 * IP-independent, so it cannot be bypassed by rotating source addresses.
 *
 * Callers should pair this with the (email, IP) rate limiter for coarse
 * request-flood protection.
 */
export async function verifyResetPin(
  email: string,
  pin: string
): Promise<VerifyPinResult> {
  await dbConnect();
  const normalizedEmail = email.trim().toLowerCase();

  const record = await PasswordReset.findOne({
    email: normalizedEmail,
    used: false,
  });

  if (!record) {
    return { ok: false, status: 400, error: "Invalid or expired PIN." };
  }

  if (new Date() > record.expiresAt) {
    await PasswordReset.deleteOne({ _id: record._id });
    return {
      ok: false,
      status: 400,
      error: "PIN has expired. Please request a new one.",
    };
  }

  if (record.attempts >= MAX_PIN_ATTEMPTS) {
    await PasswordReset.deleteOne({ _id: record._id });
    return {
      ok: false,
      status: 429,
      error: "Too many incorrect attempts. Please request a new PIN.",
    };
  }

  if (record.pin !== pin.trim()) {
    // Atomically count the failure and burn the record if it crossed the cap.
    const updated = await PasswordReset.findOneAndUpdate(
      { _id: record._id },
      { $inc: { attempts: 1 } },
      { new: true }
    );
    if (updated && updated.attempts >= MAX_PIN_ATTEMPTS) {
      await PasswordReset.deleteOne({ _id: record._id });
      return {
        ok: false,
        status: 429,
        error: "Too many incorrect attempts. Please request a new PIN.",
      };
    }
    return {
      ok: false,
      status: 400,
      error: "Invalid PIN. Please check and try again.",
    };
  }

  return { ok: true, record };
}
