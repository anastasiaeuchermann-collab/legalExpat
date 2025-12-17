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

// Get environment variables with fallback for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder';

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
