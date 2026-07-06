import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import Installer from "@/models/Installer";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { getInstallerFromCookie } from "@/lib/installerAuth";

const changePinSchema = z.object({
  currentPin: z.string().regex(/^\d{6}$/, "Current PIN must be 6 digits"),
  newPin: z.string().regex(/^\d{6}$/, "New PIN must be 6 digits"),
});

// POST — installer changes their own PIN (requires current PIN).
export async function POST(request: NextRequest) {
  try {
    const session = await getInstallerFromCookie();
    if (!session) {
      return ApiResponse.unauthorized("Not signed in");
    }

    const body = await request.json().catch(() => null);
    const parsed = changePinSchema.safeParse(body);
    if (!parsed.success) {
      return ApiResponse.badRequest(
        parsed.error.issues[0]?.message || "Invalid input"
      );
    }

    await dbConnect();

    const installer = await Installer.findById(session.installerId).select(
      "+pin"
    );
    if (!installer || !installer.pin) {
      return ApiResponse.notFound("Installer not found");
    }

    const match = await bcrypt.compare(parsed.data.currentPin, installer.pin);
    if (!match) {
      return ApiResponse.badRequest("Current PIN is incorrect");
    }

    installer.pin = await bcrypt.hash(parsed.data.newPin, 10);
    installer.lastPinChangeAt = new Date();
    installer.pinAttempts = 0;
    installer.pinLockedUntil = undefined;
    await installer.save();

    return ApiResponse.success(null, "PIN changed successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
