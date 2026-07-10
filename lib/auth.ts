import NextAuth, { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import TeamMember, { TeamRole } from "@/models/TeamMember";
import { isRateLimited, recordFailedAttempt } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";

// Login throttle: cap failed password guesses per (email, IP).
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_LIMIT = 5;

// Re-check the user's role/existence against the DB at most this often, so a
// demotion or deletion revokes access within minutes instead of the 30-day
// token lifetime. One indexed query per user per interval.
const ROLE_REVALIDATE_MS = 5 * 60 * 1000;

function ipFromRequest(request: Request | undefined): string {
  const headers = request?.headers;
  const forwarded = headers?.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    headers?.get("x-real-ip") ||
    "unknown"
  );
}

// Custom error class for passing specific error messages to client
// This is required for NextAuth v5 to properly pass error messages
class CustomAuthError extends AuthError {
  static type = "CredentialsSignin";
  constructor(message: string) {
    super(message);
    this.name = "CredentialsSignin";
  }
}

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  console.error("CRITICAL: NEXTAUTH_SECRET environment variable is not set");
  throw new Error("Missing NEXTAUTH_SECRET - check environment variables in deployment settings");
}

if (!process.env.NEXTAUTH_URL) {
  console.error("CRITICAL: NEXTAUTH_URL environment variable is not set");
  console.error("Current environment:", process.env.NODE_ENV);
}

if (!process.env.MONGODB_URI) {
  console.error("CRITICAL: MONGODB_URI environment variable is not set");
}

export const authConfig: NextAuthConfig = {
  trustHost: true, // Required for NextAuth v5 in production
  logger: {
    error(error: Error) {
      // Suppress credential-related errors in development
      const isCredentialError = error.name === 'CredentialsSignin' ||
        error.message?.includes('No account found') ||
        error.message?.includes('Incorrect password') ||
        error.message?.includes('Email cannot be empty') ||
        error.message?.includes('Password cannot be empty');

      // Only log non-credential errors in development, or all errors in production
      if (process.env.NODE_ENV === 'production' || !isCredentialError) {
        console.error(error);
      }
    },
    warn(code: string) {
      if (process.env.NODE_ENV === 'production') {
        console.warn(code);
      }
    },
    debug(message: string, metadata?: unknown) {
      // Suppress debug logs in development
      if (process.env.NEXTAUTH_DEBUG === 'true') {
        console.log(message, metadata);
      }
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          throw new CustomAuthError("Please enter both email and password");
        }

        const email = String(credentials.email);
        const password = String(credentials.password);

        if (!email.trim()) {
          throw new CustomAuthError("Email cannot be empty");
        }

        if (!password.trim()) {
          throw new CustomAuthError("Password cannot be empty");
        }

        // Throttle password guessing per (email, IP). Only failed attempts are
        // recorded, so a legitimate login never consumes the budget.
        const normalizedEmail = email.trim().toLowerCase();
        const rateLimitKey = `login:${normalizedEmail}:${ipFromRequest(
          request as Request | undefined
        )}`;
        const rl = await isRateLimited(rateLimitKey, {
          limit: LOGIN_LIMIT,
          windowMs: LOGIN_WINDOW_MS,
        });
        if (rl.limited) {
          throw new CustomAuthError(
            "Too many login attempts. Please try again later."
          );
        }

        await dbConnect();
        const user = await TeamMember.findOne({
          email: normalizedEmail,
        });

        // Generic message for every failure case (no user / Google-only /
        // wrong password) so an attacker can't enumerate which emails are
        // accounts or which use Google SSO. Real reason stays in server logs.
        const INVALID_CREDENTIALS = "Invalid email or password";

        if (!user) {
          logger.info("Login failed: no account", { email: normalizedEmail });
          await recordFailedAttempt(rateLimitKey, { windowMs: LOGIN_WINDOW_MS });
          throw new CustomAuthError(INVALID_CREDENTIALS);
        }

        if (!user.password) {
          logger.info("Login failed: Google-only account", {
            email: normalizedEmail,
          });
          await recordFailedAttempt(rateLimitKey, { windowMs: LOGIN_WINDOW_MS });
          throw new CustomAuthError(INVALID_CREDENTIALS);
        }

        const passwordHash: string = user.password as string;
        const isValid = await bcrypt.compare(password, passwordHash);

        if (!isValid) {
          logger.info("Login failed: wrong password", {
            email: normalizedEmail,
          });
          await recordFailedAttempt(rateLimitKey, { windowMs: LOGIN_WINDOW_MS });
          throw new CustomAuthError(INVALID_CREDENTIALS);
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in - save user data to token
      if (user) {
        token.id = user.id;
        token.role = user.role || TeamRole.USER;
        token.name = user.name;
        token.email = user.email;
        token.lastChecked = Date.now();
      }

      // Update token on session update
      if (trigger === "update" && session) {
        token.name = session.name;
        token.email = session.email;

        // Refresh user data from database when explicitly updating session
        if (token.email) {
          try {
            await dbConnect();
            const dbUser = await TeamMember.findOne({ email: token.email });
            if (dbUser) {
              token.id = dbUser._id.toString();
              token.role = dbUser.role;
              token.name = dbUser.name;
              token.lastChecked = Date.now();
            }
          } catch (error) {
            console.error("Error fetching user in JWT callback:", error);
          }
        }
      }

      // Revalidate role/existence periodically so demotions and deletions take
      // effect within ROLE_REVALIDATE_MS instead of the 30-day token lifetime.
      const lastChecked = (token.lastChecked as number | undefined) ?? 0;
      if (token.email && Date.now() - lastChecked > ROLE_REVALIDATE_MS) {
        try {
          await dbConnect();
          const dbUser = await TeamMember.findOne({ email: token.email });
          // User was deleted -> invalidate the session entirely.
          if (!dbUser) return null;
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.lastChecked = Date.now();
        } catch (error) {
          // On a transient DB error, keep the existing token rather than
          // locking everyone out; it will be retried on the next request.
          console.error("Error revalidating user in JWT callback:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as TeamRole;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// For backward compatibility
export const authOptions = authConfig;
