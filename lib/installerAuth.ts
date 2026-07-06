import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/**
 * Installer session — a lightweight JWT cookie, fully separate from the
 * NextAuth team-member session. Signed with INSTALLER_JWT_SECRET
 * (falls back to NEXTAUTH_SECRET).
 */

export const INSTALLER_COOKIE = "installer_token";
const SESSION_DAYS = 30;

export interface InstallerSession {
  installerId: string;
  installerCode: string;
}

function getSecret(): Uint8Array {
  const secret =
    process.env.INSTALLER_JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Missing INSTALLER_JWT_SECRET / NEXTAUTH_SECRET");
  }
  return new TextEncoder().encode(secret);
}

/** Sign a session JWT and set it as an httpOnly cookie. */
export async function createInstallerSession(
  session: InstallerSession
): Promise<void> {
  const token = await new SignJWT({
    installerId: session.installerId,
    installerCode: session.installerCode,
    role: "INSTALLER",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(INSTALLER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

/** Read + verify the installer session cookie. Null when absent/invalid. */
export async function getInstallerFromCookie(): Promise<InstallerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(INSTALLER_COOKIE);
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token.value, getSecret());
    if (!payload.installerId || !payload.installerCode) return null;
    return {
      installerId: payload.installerId as string,
      installerCode: payload.installerCode as string,
    };
  } catch {
    return null;
  }
}

/** Clear the installer session cookie. */
export async function clearInstallerSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(INSTALLER_COOKIE);
}
