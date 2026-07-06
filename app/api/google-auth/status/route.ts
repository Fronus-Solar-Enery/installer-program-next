import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import GoogleAuth from "@/models/GoogleAuth";
import { TeamRole } from "@/models/TeamMember";
import { verifyGoogleAuthLiveness } from "@/lib/googleContacts";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Proactively probe the stored token (throttled) so a dead/undecryptable
    // token surfaces on page load, not only after a sync happens to fail.
    const liveness = await verifyGoogleAuthLiveness();

    const isAuthenticated = liveness.status === "authenticated";
    const needsReauth = liveness.status === "needs_reauth";
    const configError = liveness.status === "misconfigured";

    return NextResponse.json({
      // "Authenticated" means the refresh token was just proven usable.
      isAuthenticated,
      needsReauth,
      // Server-side config problem (bad/missing encryption key or OAuth creds);
      // re-authenticating will NOT fix this.
      configError,
      configErrorReason: configError ? liveness.reason : undefined,
      hasRefreshToken: liveness.status !== "not_authenticated",
      accountEmail:
        "accountEmail" in liveness ? liveness.accountEmail : null,
    });
  } catch (error) {
    console.error("Error checking Google auth status:", error);
    return NextResponse.json(
      { error: "Failed to check authentication status" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admin users to revoke global auth
    if (session.user.role !== TeamRole.ADMIN) {
      return NextResponse.json(
        { error: "Only admins can revoke authentication" },
        { status: 403 }
      );
    }

    await dbConnect();

    // Revoke the global authentication
    await GoogleAuth.findOneAndUpdate({ isActive: true }, { isActive: false });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking Google auth:", error);
    return NextResponse.json(
      { error: "Failed to revoke authentication" },
      { status: 500 }
    );
  }
}
