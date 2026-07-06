import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import PasswordReset from "@/models/PasswordReset";
import bcrypt from "bcryptjs";
import { verifyResetPin } from "@/lib/passwordReset";
import { isRateLimited, recordFailedAttempt } from "@/lib/rateLimit";
import { getClientInfo } from "@/lib/requestUtils";

// Shared budget/key namespace with verify-pin.
const PIN_WINDOW_MS = 10 * 60 * 1000;
const PIN_LIMIT = 5;

// POST - Verify PIN and reset password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, pin, newPassword } = body;

    // Validate inputs
    if (!email || !pin || !newPassword) {
      return NextResponse.json(
        { error: "Email, PIN, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
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

    await dbConnect();

    // Find user
    const user = await TeamMember.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    // Consume the reset request
    await PasswordReset.deleteOne({ _id: result.record._id });

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
