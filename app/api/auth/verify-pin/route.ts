import { NextRequest, NextResponse } from "next/server";
import { verifyResetPin } from "@/lib/passwordReset";
import { isRateLimited, recordFailedAttempt } from "@/lib/rateLimit";
import { getClientInfo } from "@/lib/requestUtils";

// Shared budget with reset-password so alternating endpoints can't dodge it.
const PIN_WINDOW_MS = 10 * 60 * 1000;
const PIN_LIMIT = 5;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, pin } = body;

    // Validate input
    if (!email || !pin) {
      return NextResponse.json(
        { error: "Email and PIN are required" },
        { status: 400 }
      );
    }

    const ip = (getClientInfo(request).ipAddress ?? "unknown")
      .split(",")[0]
      .trim();
    const key = `pin:${String(email).trim().toLowerCase()}:${ip}`;

    const rl = await isRateLimited(key, {
      limit: PIN_LIMIT,
      windowMs: PIN_WINDOW_MS,
    });
    if (rl.limited) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rl.retryAfterSeconds) },
        }
      );
    }

    const result = await verifyResetPin(email, pin);
    if (!result.ok) {
      await recordFailedAttempt(key, { windowMs: PIN_WINDOW_MS });
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // PIN is valid (record is consumed later, by reset-password)
    return NextResponse.json({
      success: true,
      message: "PIN verified successfully",
    });
  } catch (error) {
    console.error("Error verifying PIN:", error);
    return NextResponse.json(
      { error: "An error occurred while verifying PIN" },
      { status: 500 }
    );
  }
}
