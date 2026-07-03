import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import GoogleAuth from "@/models/GoogleAuth";
import { TeamRole } from "@/models/TeamMember";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Check for ANY active Google auth (global, not per-user)
    const googleAuth = await GoogleAuth.findOne({
      isActive: true,
    });

    const needsReauth = !!googleAuth?.needsReauth;

    return NextResponse.json({
      // "Authenticated" means usable: a record exists AND its refresh token
      // hasn't been rejected. A dead token (invalid_grant) reads as unauthenticated.
      isAuthenticated: !!googleAuth && !needsReauth,
      needsReauth,
      hasRefreshToken: !!googleAuth?.refreshToken,
      accountEmail: googleAuth?.accountEmail || null,
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
