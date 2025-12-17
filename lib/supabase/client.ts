/**
 * Supabase Browser Client
 *
 * This client is for use in browser/client components.
 * It uses the public anon key which is safe to expose.
 *
 * Usage:
 * - Client Components
 * - Browser-side data fetching
 * - Real-time subscriptions
 *
 * @example
 * ```tsx
 * 'use client';
 * import { supabase } from '@/lib/supabase/client';
 *
 * const { data, error } = await supabase
 *   .from('services')
 *   .select('*')
 *   .eq('is_active', true);
 * ```
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
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
 * Create a Supabase client for browser/client components
 * This client uses the public anon key
 */
export const createClient = () => {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};

/**
 * Default browser client instance
 * Use this in client components
 */
export const supabase = createClient();

/**
 * Type-safe Supabase client type
 * Provides autocomplete and type checking for all database operations
 */
export type SupabaseClient = ReturnType<typeof createClient>;
