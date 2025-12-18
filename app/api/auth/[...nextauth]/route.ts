/**
 * NextAuth API Route Handler
 *
 * This file configures NextAuth to handle all authentication routes:
 * - /api/auth/signin
 * - /api/auth/signout
 * - /api/auth/callback
 * - /api/auth/session
 * - etc.
 */

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
