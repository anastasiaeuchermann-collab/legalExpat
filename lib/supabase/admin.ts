/**
 * Supabase Admin Client
 *
 * This client uses the service role key and BYPASSES all RLS policies.
 * Use with extreme caution - only for admin operations and trusted server code.
 *
 * ⚠️ WARNING: This client has unrestricted database access!
 *
 * Usage:
 * - Admin operations
 * - Background jobs
 * - Webhook handlers
 * - System operations that need to bypass RLS
 *
 * @example
 * ```tsx
 * import { supabaseAdmin } from '@/lib/supabase/admin';
 *
 * // Only use in trusted server code!
 * export async function POST(req: Request) {
 *   // Verify admin user first
 *   const user = await getCurrentUser();
 *   if (user?.role !== 'admin') {
 *     return new Response('Unauthorized', { status: 403 });
 *   }
 *
 *   // Now safe to use admin client
 *   const { data, error } = await supabaseAdmin
 *     .from('provider_profiles')
 *     .update({ verification_status: 'verified' })
 *     .eq('id', providerId);
 * }
 * ```
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Get environment variables with fallback for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY0NTE5MjgwMCwiZXhwIjoxOTYwNzY4ODAwfQ.placeholder';

/**
 * Admin Supabase client with service role key
 * ⚠️ BYPASSES ALL RLS POLICIES - Use with extreme caution!
 *
 * This client should only be used in:
 * - Verified admin endpoints
 * - Background jobs
 * - Webhook handlers
 * - System maintenance scripts
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);

// TODO: Re-enable these helper functions once database is properly set up
// They're currently commented out to avoid TypeScript errors during build

/*
export const verifyProvider = async (
  providerId: string,
  verifiedBy: string,
  documents?: string[]
) => {
  // Implementation will be added when database is set up
};

export const rejectProviderVerification = async (
  providerId: string,
  reason?: string
) => {
  // Implementation will be added when database is set up
};

export const getUsersByRole = async (role: 'expat' | 'provider' | 'admin') => {
  // Implementation will be added when database is set up
};

export const updatePaymentEscrowStatus = async (
  paymentId: string,
  status: 'held' | 'released_to_provider' | 'refunded_to_expat' | 'disputed'
) => {
  // Implementation will be added when database is set up
};
*/

/**
 * Type-safe admin Supabase client type
 */
export type AdminSupabaseClient = typeof supabaseAdmin;
