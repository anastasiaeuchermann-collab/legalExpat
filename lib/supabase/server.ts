/**
 * Supabase Server Client
 *
 * This client is for use in server components and API routes.
 * It can access the auth session from cookies/headers.
 *
 * Usage:
 * - Server Components
 * - API Routes
 * - Server Actions
 * - Middleware
 *
 * @example
 * ```tsx
 * import { createServerClient } from '@/lib/supabase/server';
 * import { cookies } from 'next/headers';
 *
 * export async function GET() {
 *   const supabase = createServerClient();
 *   const { data } = await supabase
 *     .from('bookings')
 *     .select('*')
 *     .eq('expat_id', userId);
 * }
 * ```
 */

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

/**
 * Create a Supabase client for server-side use
 * This client respects RLS policies based on the authenticated user
 *
 * @returns Supabase client with auth context from cookies
 */
export const createServerClient = () => {
  const cookieStore = cookies();

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        // Pass cookies to Supabase for auth context
        cookie: cookieStore.toString(),
      },
    },
  });
};

/**
 * Get the current authenticated user from the server
 * Returns null if no user is authenticated
 *
 * @example
 * ```tsx
 * const user = await getServerUser();
 * if (!user) {
 *   return redirect('/login');
 * }
 * ```
 */
export const getServerUser = async () => {
  const supabase = createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
};

/**
 * Get the current session from the server
 * Returns null if no session exists
 */
export const getServerSession = async () => {
  const supabase = createServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
};

/**
 * Type-safe server Supabase client type
 */
export type ServerSupabaseClient = ReturnType<typeof createServerClient>;
