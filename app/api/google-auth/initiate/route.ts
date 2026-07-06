import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { google } from "googleapis";
import { TeamRole } from "@/models/TeamMember";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admin users to authenticate Google Contacts (global)
    if (session.user.role !== TeamRole.ADMIN) {
      return NextResponse.json(
        { error: "Only administrators can authenticate Google Contacts" },
        { status: 403 }
      );
    }

    const CLIENT_ID =
      process.env.GOOGLE_CONTACTS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET =
      process.env.GOOGLE_CONTACTS_CLIENT_SECRET ||
      process.env.GOOGLE_CLIENT_SECRET;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      return NextResponse.json(
        { error: "Google OAuth credentials not configured" },
        { status: 500 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/google-auth/callback`
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/contacts",
        "https://www.googleapis.com/auth/userinfo.email", // To get authenticated account email
      ],
      prompt: "consent", // Force consent to get refresh token
      state: session.user.id, // Pass user ID for audit trail
      login_hint: "installerprogram2025@gmail.com", // Suggest the correct account
    });

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error initiating Google auth:", error);
    return NextResponse.json(
      { error: "Failed to initiate authentication" },
      { status: 500 }
    );
  }
}
