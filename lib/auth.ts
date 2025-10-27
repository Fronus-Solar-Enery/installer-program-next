import NextAuth, { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import TeamMember, { TeamRole } from "@/models/TeamMember";

// Validate required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  console.error("CRITICAL: NEXTAUTH_SECRET environment variable is not set");
  throw new Error("Missing NEXTAUTH_SECRET - check environment variables in deployment settings");
}

if (!process.env.NEXTAUTH_URL) {
  console.error("CRITICAL: NEXTAUTH_URL environment variable is not set");
  console.error("Current environment:", process.env.NODE_ENV);
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("WARNING: Google OAuth credentials are not set");
}

if (!process.env.MONGODB_URI) {
  console.error("CRITICAL: MONGODB_URI environment variable is not set");
}

export const authConfig: NextAuthConfig = {
  trustHost: true, // Required for NextAuth v5 in production
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        const email = String(credentials.email);
        const password = String(credentials.password);

        if (!email.trim()) {
          throw new Error("Email cannot be empty");
        }

        if (!password.trim()) {
          throw new Error("Password cannot be empty");
        }

        await dbConnect();
        const user = await TeamMember.findOne({
          email: email.trim().toLowerCase(),
        });

        if (!user) {
          throw new Error("No account found with this email address");
        }

        if (!user.password) {
          throw new Error(
            "This account uses Google Sign-In. Please sign in with Google."
          );
        }

        const passwordHash: string = user.password as string;
        const isValid = await bcrypt.compare(password, passwordHash);

        if (!isValid) {
          throw new Error("Incorrect password. Please try again.");
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
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await dbConnect();

          const existingUser = await TeamMember.findOne({ email: user.email });

          if (!existingUser) {
            // Create new user with Google account
            const newUser = await TeamMember.create({
              name: user.name,
              email: user.email,
              googleId: account.providerAccountId,
              image: user.image,
              role: TeamRole.USER, // Default role
            });
            user.id = newUser._id.toString();
          } else {
            // Update existing user with Google ID if not set
            if (!existingUser.googleId) {
              existingUser.googleId = account.providerAccountId;
              existingUser.image = user.image || undefined;
              await existingUser.save();
            }
            user.id = existingUser._id.toString();
          }
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false; // Prevent sign in if database operation fails
        }
      }
      return true;
    },
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
    error: "/auth/error",
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
