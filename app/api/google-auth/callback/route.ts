import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import dbConnect from '@/lib/mongodb';
import GoogleAuth from '@/models/GoogleAuth';

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

    // Save to database
    await dbConnect();

    await GoogleAuth.findOneAndUpdate(
      { userId: state },
      {
        userId: state,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        scope: 'https://www.googleapis.com/auth/contacts',
        isActive: true,
      },
      { upsert: true, new: true }
    );

    console.log('✓ Google Contacts authenticated successfully for user:', state);

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
