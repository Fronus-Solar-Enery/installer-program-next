import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import dbConnect from '@/lib/mongodb';
import GoogleAuth from '@/models/GoogleAuth';
import { encryptSecret } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // User ID
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/installers?auth_error=${error}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/installers?auth_error=missing_code`
      );
    }

    const CLIENT_ID = process.env.GOOGLE_CONTACTS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CONTACTS_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/google-auth/callback`
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/installers?auth_error=no_refresh_token`
      );
    }

    // Set the credentials to get user info
    oauth2Client.setCredentials(tokens);

    // Get authenticated account email
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const accountEmail = userInfo.data.email;

    if (!accountEmail) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/installers?auth_error=no_email`
      );
    }

    // Save to database (global authentication)
    await dbConnect();

    // Deactivate any existing auth first
    await GoogleAuth.updateMany({ isActive: true }, { isActive: false });

    // Create new global authentication
    await GoogleAuth.findOneAndUpdate(
      { accountEmail }, // Use email as unique identifier
      {
        accountEmail,
        // Encrypt durable OAuth credentials before they touch the database.
        refreshToken: tokens.refresh_token
          ? encryptSecret(tokens.refresh_token)
          : undefined,
        accessToken: tokens.access_token
          ? encryptSecret(tokens.access_token)
          : undefined,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        scope: 'https://www.googleapis.com/auth/contacts',
        isActive: true,
        needsReauth: false, // Fresh token — clear any prior invalid_grant flag
        lastError: null,
        lastErrorAt: null,
        authenticatedBy: state, // Track which user authenticated (audit trail)
      },
      { upsert: true, new: true }
    );

    console.log('✓ Google Contacts authenticated successfully');
    console.log('  Account:', accountEmail);
    console.log('  Authenticated by user ID:', state);

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/installers?auth_success=true`
    );
  } catch (error) {
    console.error('Error in Google auth callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/installers?auth_error=callback_failed`
    );
  }
}
