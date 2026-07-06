import { NextRequest, NextResponse } from "next/server";
import { clearInstallerSession } from "@/lib/installerAuth";

// POST — clear the installer session cookie and send them to the landing page.
export async function POST(request: NextRequest) {
  await clearInstallerSession();
  return NextResponse.redirect(new URL("/", request.url));
}
