/**
 * Authentication Helper Functions
 *
 * Utilities for managing authentication, authorization, and user sessions.
 * These functions integrate NextAuth with Supabase for seamless auth flow.
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './auth.config';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { UserRole } from '@/types/database';

/**
 * Extended session user type with role information
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Get the currently authenticated user from the session
 * Returns null if no user is authenticated
 *
 * @example
 * ```tsx
 * const user = await getCurrentUser();
 * if (!user) {
 *   return <div>Please log in</div>;
 * }
 * ```
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id as string,
    email: session.user.email as string,
    name: session.user.name as string,
    role: session.user.role as UserRole,
  };
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this in server components and route handlers that require auth
 *
 * @param redirectTo - Path to redirect after login (default: current path)
 * @returns The authenticated user
 *
 * @example
 * ```tsx
 * export default async function ProtectedPage() {
 *   const user = await requireAuth();
 *   // User is guaranteed to be authenticated here
 *   return <div>Welcome, {user.name}</div>;
 * }
 * ```
 */
export async function requireAuth(redirectTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    const callbackUrl = redirectTo || '/dashboard';
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return user;
}

/**
 * Check if the current user has a specific role
 * Returns false if not authenticated or doesn't have the role
 *
 * @param role - The role to check for
 * @returns True if user has the role, false otherwise
 *
 * @example
 * ```tsx
 * const isAdmin = await checkUserRole('admin');
 * if (!isAdmin) {
 *   return <div>Access denied</div>;
 * }
 * ```
 */
export async function checkUserRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  return user.role === role;
}

/**
 * Require a specific role - redirects to unauthorized page if not authorized
 * Use this for admin-only or provider-only pages
 *
 * @param role - The required role
 * @param redirectTo - Where to redirect if unauthorized (default: /unauthorized)
 * @returns The authenticated user with the required role
 *
 * @example
 * ```tsx
 * export default async function AdminPage() {
 *   const admin = await requireRole('admin');
 *   // User is guaranteed to be an admin here
 * }
 * ```
 */
export async function requireRole(
  role: UserRole,
  redirectTo: string = '/unauthorized'
): Promise<SessionUser> {
  const user = await requireAuth();

  if (user.role !== role) {
    redirect(redirectTo);
  }

  return user;
}

/**
 * Check if user has any of the specified roles
 *
 * @param roles - Array of roles to check
 * @returns True if user has any of the roles
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  return roles.includes(user.role);
}

/**
 * Require any of the specified roles
 *
 * @param roles - Array of acceptable roles
 * @param redirectTo - Where to redirect if unauthorized
 * @returns The authenticated user
 */
export async function requireAnyRole(
  roles: UserRole[],
  redirectTo: string = '/unauthorized'
): Promise<SessionUser> {
  const user = await requireAuth();

  if (!roles.includes(user.role)) {
    redirect(redirectTo);
  }

  return user;
}

/**
 * Get user's full profile from database
 * Fetches expat_profile or provider_profile based on role
 *
 * @param userId - User ID to fetch profile for (default: current user)
 * @returns User profile data
 */
export async function getUserProfile(userId?: string) {
  const user = userId ? { id: userId } : await getCurrentUser();

  if (!user) {
    return null;
  }

  // Get the base user data
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return null;
  }

  // Fetch the appropriate profile based on role
  if (userData.role === 'expat') {
    const { data: profile } = await supabaseAdmin
      .from('expat_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      ...userData,
      profile,
    };
  } else if (userData.role === 'provider') {
    const { data: profile } = await supabaseAdmin
      .from('provider_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return {
      ...userData,
      profile,
    };
  }

  return userData;
}

/**
 * Check if current user owns a resource
 * Useful for authorization checks
 *
 * @param resourceUserId - The user ID that owns the resource
 * @returns True if current user owns the resource or is an admin
 */
export async function isResourceOwner(resourceUserId: string): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  // Admins can access all resources
  if (user.role === 'admin') {
    return true;
  }

  return user.id === resourceUserId;
}

/**
 * Authorize access to a resource
 * Throws an error or redirects if unauthorized
 *
 * @param resourceUserId - The user ID that owns the resource
 * @param redirectTo - Where to redirect if unauthorized
 */
export async function authorizeResourceAccess(
  resourceUserId: string,
  redirectTo: string = '/unauthorized'
): Promise<void> {
  const isOwner = await isResourceOwner(resourceUserId);

  if (!isOwner) {
    redirect(redirectTo);
  }
}

/**
 * Create auth context for RLS policies
 * Sets the user_id and role in Supabase for RLS
 *
 * This is used internally by the server client
 */
export async function getAuthContext() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return {
    user_id: user.id,
    role: user.role,
  };
}
