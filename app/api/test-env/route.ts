import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasMongoUri: !!process.env.MONGODB_URI,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL, // Safe to show URL
    nodeEnv: process.env.NODE_ENV,
  });
}
