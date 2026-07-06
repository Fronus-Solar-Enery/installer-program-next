"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import Installer from "@/models/Installer";
import { createInstallerSession } from "@/lib/installerAuth";
import { logger } from "@/lib/logger";

const MAX_ATTEMPTS = 3;
const LOCK_MINUTES = 15;

const loginSchema = z.object({
  installerCode: z.string().trim().min(1, "Installer code is required"),
  pin: z.string().regex(/^\d{6}$/, "PIN must be 6 digits"),
});

export async function installerLogin(
  installerCode: string,
  pin: string
): Promise<{ success: boolean; error?: string }> {
  const parsed = loginSchema.safeParse({ installerCode, pin });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  try {
    await dbConnect();

    const installer = await Installer.findOne({
      installerCode: parsed.data.installerCode.toUpperCase(),
    }).select("+pin");

    // Same generic error for unknown code and wrong PIN — don't leak which.
    const invalid = { success: false, error: "Invalid installer code or PIN" };

    if (!installer) return invalid;

    if (installer.pinLockedUntil && installer.pinLockedUntil > new Date()) {
      const minutes = Math.ceil(
        (installer.pinLockedUntil.getTime() - Date.now()) / 60_000
      );
      return {
        success: false,
        error: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      };
    }

    if (!installer.pin) {
      return {
        success: false,
        error: "No PIN set for this account. Ask your team to send one.",
      };
    }

    const match = await bcrypt.compare(parsed.data.pin, installer.pin);
    if (!match) {
      const attempts = (installer.pinAttempts ?? 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        installer.pinAttempts = 0;
        installer.pinLockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000);
      } else {
        installer.pinAttempts = attempts;
      }
      await installer.save();
      return invalid;
    }

    installer.pinAttempts = 0;
    installer.pinLockedUntil = undefined;
    await installer.save();

    await createInstallerSession({
      installerId: String(installer._id),
      installerCode: installer.installerCode,
    });

    return { success: true };
  } catch (error) {
    logger.error("Installer login failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: "Unable to sign in right now. Please try again.",
    };
  }
}
