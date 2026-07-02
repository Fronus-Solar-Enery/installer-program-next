import NextAuth, { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import TeamMember, { TeamRole } from "@/models/TeamMember";

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
      async authorize(credentials) {
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

        await dbConnect();
        const user = await TeamMember.findOne({
          email: email.trim().toLowerCase(),
        });

        if (!user) {
          throw new CustomAuthError("No account found with this email address");
        }

        if (!user.password) {
          throw new CustomAuthError(
            "This account uses Google Sign-In. Please sign in with Google."
          );
        }

        const passwordHash: string = user.password as string;
        const isValid = await bcrypt.compare(password, passwordHash);

        if (!isValid) {
          throw new CustomAuthError("Incorrect password. Please try again.");
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
            }
          } catch (error) {
            console.error("Error fetching user in JWT callback:", error);
          }
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
