-- =============================================
-- UPDATE RLS POLICIES FOR NEXTAUTH INTEGRATION
-- =============================================
-- This migration updates RLS policies to work with NextAuth
-- Since NextAuth manages auth separately from Supabase Auth,
-- we need to adjust our approach to RLS

-- =============================================
-- IMPORTANT NOTE
-- =============================================
-- When using NextAuth with Supabase, you have two options:
--
-- Option 1 (Recommended): Use service role key on server
-- - Use supabaseAdmin client for all authenticated operations
-- - RLS is bypassed, so implement authorization in your API routes
-- - More control, easier to debug
--
-- Option 2: Custom RLS with JWT claims
-- - Pass user context via custom headers
-- - More complex but maintains RLS benefits
-- - Requires custom middleware
--
-- This migration provides helper functions for Option 2
-- For Option 1, you can keep RLS disabled or use these as templates

-- =============================================
-- CREATE CUSTOM AUTH CONTEXT TABLE
-- =============================================
-- This table stores temporary auth context for the current transaction
-- It's set by the application and read by RLS policies

CREATE TABLE IF NOT EXISTS auth_context (
    user_id UUID,
    user_role user_role,
    transaction_id UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on auth_context itself
ALTER TABLE auth_context ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert their own auth context
CREATE POLICY "Users can set own auth context"
    ON auth_context FOR INSERT
    WITH CHECK (true);

-- Only allow reading own context
CREATE POLICY "Users can read own auth context"
    ON auth_context FOR SELECT
    USING (user_id = current_setting('app.user_id', true)::uuid);

-- =============================================
-- UPDATED AUTH HELPER FUNCTIONS
-- =============================================

-- Drop old functions if they exist
DROP FUNCTION IF EXISTS auth.user_id();
DROP FUNCTION IF EXISTS auth.role();

-- Get current user ID from app settings
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.user_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get current user role from app settings
CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$
BEGIN
    RETURN NULLIF(current_setting('app.user_role', true), '')::text;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user is authenticated
CREATE OR REPLACE FUNCTION is_authenticated() RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_user_id() IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user has a specific role
CREATE OR REPLACE FUNCTION has_role(check_role TEXT) RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_user_role() = check_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN has_role('admin');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================
-- UPDATE EXISTING POLICIES TO USE NEW FUNCTIONS
-- =============================================

-- Drop and recreate users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (current_user_id() = id OR is_admin());

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (current_user_id() = id);

CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (is_admin());

-- Update expat profiles policies
DROP POLICY IF EXISTS "Expats can view own profile" ON expat_profiles;
DROP POLICY IF EXISTS "Expats can insert own profile" ON expat_profiles;
DROP POLICY IF EXISTS "Expats can update own profile" ON expat_profiles;
DROP POLICY IF EXISTS "Providers can view expat profiles for bookings" ON expat_profiles;

CREATE POLICY "Expats can view own profile"
    ON expat_profiles FOR SELECT
    USING (current_user_id() = id OR is_admin());

CREATE POLICY "Expats can insert own profile"
    ON expat_profiles FOR INSERT
    WITH CHECK (current_user_id() = id);

CREATE POLICY "Expats can update own profile"
    ON expat_profiles FOR UPDATE
    USING (current_user_id() = id);

CREATE POLICY "Providers can view expat profiles for bookings"
    ON expat_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.expat_id = expat_profiles.id
            AND b.provider_id = current_user_id()
        ) OR is_admin()
    );

-- Update provider profiles policies
DROP POLICY IF EXISTS "Anyone can view verified provider profiles" ON provider_profiles;
DROP POLICY IF EXISTS "Providers can insert own profile" ON provider_profiles;
DROP POLICY IF EXISTS "Providers can update own profile" ON provider_profiles;
DROP POLICY IF EXISTS "Admins can update provider profiles" ON provider_profiles;

CREATE POLICY "Anyone can view verified provider profiles"
    ON provider_profiles FOR SELECT
    USING (verification_status = 'verified' OR current_user_id() = id OR is_admin());

CREATE POLICY "Providers can insert own profile"
    ON provider_profiles FOR INSERT
    WITH CHECK (current_user_id() = id);

CREATE POLICY "Providers can update own profile"
    ON provider_profiles FOR UPDATE
    USING (current_user_id() = id);

CREATE POLICY "Admins can update provider profiles"
    ON provider_profiles FOR UPDATE
    USING (is_admin());

-- Update booking policies
DROP POLICY IF EXISTS "Expats can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Providers can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Expats can create bookings" ON bookings;
DROP POLICY IF EXISTS "Expats can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Providers can update bookings" ON bookings;

CREATE POLICY "Expats can view own bookings"
    ON bookings FOR SELECT
    USING (current_user_id() = expat_id OR is_admin());

CREATE POLICY "Providers can view own bookings"
    ON bookings FOR SELECT
    USING (current_user_id() = provider_id OR is_admin());

CREATE POLICY "Expats can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (current_user_id() = expat_id AND is_authenticated());

CREATE POLICY "Expats can update own bookings"
    ON bookings FOR UPDATE
    USING (current_user_id() = expat_id);

CREATE POLICY "Providers can update bookings"
    ON bookings FOR UPDATE
    USING (current_user_id() = provider_id);

-- Update payment policies
DROP POLICY IF EXISTS "Expats can view own payments" ON payments;
DROP POLICY IF EXISTS "Providers can view payments for their services" ON payments;

CREATE POLICY "Expats can view own payments"
    ON payments FOR SELECT
    USING (current_user_id() = expat_id OR is_admin());

CREATE POLICY "Providers can view payments for their services"
    ON payments FOR SELECT
    USING (current_user_id() = provider_id OR is_admin());

-- Update review policies
DROP POLICY IF EXISTS "Expats can create reviews" ON reviews;
DROP POLICY IF EXISTS "Expats can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Providers can respond to reviews" ON reviews;

CREATE POLICY "Expats can create reviews"
    ON reviews FOR INSERT
    WITH CHECK (
        current_user_id() = expat_id AND
        is_authenticated() AND
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = booking_id
            AND b.expat_id = current_user_id()
            AND b.status = 'completed'
        )
    );

CREATE POLICY "Expats can update own reviews"
    ON reviews FOR UPDATE
    USING (current_user_id() = expat_id AND created_at > NOW() - INTERVAL '7 days');

CREATE POLICY "Providers can respond to reviews"
    ON reviews FOR UPDATE
    USING (current_user_id() = provider_id)
    WITH CHECK (current_user_id() = provider_id);

-- =============================================
-- HELPER FUNCTION TO SET AUTH CONTEXT
-- =============================================
-- This function should be called at the start of each authenticated request
-- Example: SELECT set_auth_context('user-uuid', 'expat');

CREATE OR REPLACE FUNCTION set_auth_context(
    p_user_id UUID,
    p_user_role TEXT
) RETURNS VOID AS $$
BEGIN
    -- Set session variables
    PERFORM set_config('app.user_id', p_user_id::text, true);
    PERFORM set_config('app.user_role', p_user_role, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- HELPER FUNCTION TO CLEAR AUTH CONTEXT
-- =============================================
CREATE OR REPLACE FUNCTION clear_auth_context() RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.user_id', '', true);
    PERFORM set_config('app.user_role', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON FUNCTION current_user_id() IS 'Get the current authenticated user ID from session variables';
COMMENT ON FUNCTION current_user_role() IS 'Get the current authenticated user role from session variables';
COMMENT ON FUNCTION is_authenticated() IS 'Check if a user is currently authenticated';
COMMENT ON FUNCTION has_role(TEXT) IS 'Check if current user has a specific role';
COMMENT ON FUNCTION is_admin() IS 'Check if current user is an admin';
COMMENT ON FUNCTION set_auth_context(UUID, TEXT) IS 'Set authentication context for the current transaction';
COMMENT ON FUNCTION clear_auth_context() IS 'Clear authentication context';

-- =============================================
-- USAGE NOTES
-- =============================================
-- To use these policies with NextAuth:
--
-- 1. In your API routes, after verifying the user:
--    await supabase.rpc('set_auth_context', {
--      p_user_id: user.id,
--      p_user_role: user.role
--    });
--
-- 2. Then perform your database operations
--
-- 3. Optionally clear context at the end:
--    await supabase.rpc('clear_auth_context');
--
-- OR (Recommended): Use supabaseAdmin for all authenticated operations
-- and implement authorization checks in your application code.
