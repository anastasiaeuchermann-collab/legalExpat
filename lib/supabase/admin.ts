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

/**
 * Verify a provider and update their verification status
 * This is an admin-only operation
 *
 * @param providerId - The provider's user ID
 * @param verifiedBy - The admin user ID performing the verification
 * @param documents - Array of verification document URLs
 * @returns Updated provider profile
 */
export const verifyProvider = async (
  providerId: string,
  verifiedBy: string,
  documents?: string[]
) => {
  const { data, error } = await supabaseAdmin
    .from('provider_profiles')
    .update({
      verification_status: 'verified',
      verified_at: new Date().toISOString(),
      verified_by: verifiedBy,
      ...(documents && { verification_documents: documents }),
    })
    .eq('id', providerId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to verify provider: ${error.message}`);
  }

  return data;
};

/**
 * Reject a provider's verification request
 *
 * @param providerId - The provider's user ID
 * @param reason - Reason for rejection (optional)
 * @returns Updated provider profile
 */
export const rejectProviderVerification = async (
  providerId: string,
  reason?: string
) => {
  const { data, error } = await supabaseAdmin
    .from('provider_profiles')
    .update({
      verification_status: 'rejected',
      verified_at: null,
      verified_by: null,
    })
    .eq('id', providerId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to reject provider: ${error.message}`);
  }

  return data;
};

/**
 * Get all users with a specific role
 * Admin operation to manage users
 *
 * @param role - User role to filter by
 * @returns Array of users
 */
export const getUsersByRole = async (role: 'expat' | 'provider' | 'admin') => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('role', role);

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return data;
};

/**
 * Update payment escrow status (admin operation)
 *
 * @param paymentId - Payment ID
 * @param status - New escrow status
 * @returns Updated payment
 */
export const updatePaymentEscrowStatus = async (
  paymentId: string,
  status: 'held' | 'released_to_provider' | 'refunded_to_expat' | 'disputed'
) => {
  const updates: any = {
    escrow_status: status,
  };

  if (status === 'released_to_provider') {
    updates.released_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('payments')
    .update(updates)
    .eq('id', paymentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update payment escrow: ${error.message}`);
  }

  return data;
};

/**
 * Type-safe admin Supabase client type
 */
export type AdminSupabaseClient = typeof supabaseAdmin;
