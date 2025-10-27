import { NextResponse } from "next/server";

export const runtime = 'nodejs';

// This endpoint helps debug auth configuration issues
export async function GET() {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envVars: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT SET",
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET (hidden)" : "NOT SET",
        MONGODB_URI: process.env.MONGODB_URI ? "SET (hidden)" : "NOT SET",
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? "SET (hidden)" : "NOT SET",
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? "SET (hidden)" : "NOT SET",
      },
      // Try to check if auth module loads
      authModuleError: null as string | null,
    };

    // Try to load the auth module
    try {
      await import("@/lib/auth");
    } catch (error) {
      diagnostics.authModuleError = error instanceof Error ? error.message : String(error);
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
