/**
 * NextAuth Configuration
 *
 * Integrates NextAuth with Supabase for authentication.
 * Uses JWT strategy with custom session handling.
 */

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { supabaseAdmin } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";
import type { UserRole } from "@/types/database";

/**
 * Extend NextAuth types to include our custom fields
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

/**
 * NextAuth configuration options
 */
export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider (only for expats)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    // Email/Password Provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        // Fetch user from Supabase using admin client (bypasses RLS)
        const { data: userData, error } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("email", credentials.email)
          .single();

        if (error || !userData) {
          throw new Error("User not found");
        }

        // Type assertion for user data
        const user = userData as {
          id: string;
          email: string;
          name: string;
          password_hash: string;
          role: string;
          is_active: boolean;
        };

        // Check if user is active
        if (!user.is_active) {
          throw new Error("Account is disabled");
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        // TODO: Update last login timestamp once database is set up
        // await supabaseAdmin.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  callbacks: {
    /**
     * SignIn callback - runs when user signs in
     * Handle OAuth sign-ins by creating user in database if needed
     */
    async signIn({ user, account, profile }) {
      // For OAuth providers (Google), create user in database if doesn't exist
      if (account?.provider === "google") {
        try {
          // Check if user exists
          const { data: existingUser } = await supabaseAdmin
            .from("users")
            .select("id, role")
            .eq("email", user.email!)
            .single();

          if (!existingUser) {
            // Create new expat user (Google OAuth is only for expats)
            const { error: userError } = await supabaseAdmin
              .from("users")
              .insert({
                email: user.email!,
                name: user.name || "",
                role: "expat",
                email_verified: true, // OAuth emails are pre-verified
                is_active: true,
                password_hash: "", // No password for OAuth users
              });

            if (userError) {
              console.error("Error creating OAuth user:", userError);
              return false;
            }
          }
          return true;
        } catch (error) {
          console.error("Error in OAuth sign-in:", error);
          return false;
        }
      }

      // For credentials provider, authorization is already handled
      return true;
    },

    /**
     * JWT callback - runs whenever a JWT is created or updated
     * Store user ID and role in the token
     */
    async jwt({ token, user, trigger, session, account }) {
      // On sign-in, fetch user data from database
      if (user) {
        // For OAuth sign-ins, we need to fetch the user's role from database
        if (account?.provider === "google") {
          const { data: dbUser } = await supabaseAdmin
            .from("users")
            .select("id, role")
            .eq("email", user.email!)
            .single();

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role as UserRole;
          }
        } else {
          // For credentials, user object already has id and role
          token.id = user.id;
          token.role = user.role;
        }
      }

      // Handle session updates (e.g., when user profile changes)
      if (trigger === "update" && session) {
        token.name = session.name;
      }

      return token;
    },

    /**
     * Session callback - runs whenever session is checked
     * Add custom fields to the session object
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
    verifyRequest: "/verify",
    newUser: "/onboarding",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};
