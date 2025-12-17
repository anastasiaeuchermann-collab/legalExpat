-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expat_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_tags_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS UUID AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.sub', true), ''),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.role', true), ''),
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text;
$$ LANGUAGE sql STABLE;

-- =============================================
-- USERS TABLE POLICIES
-- =============================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.user_id() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.user_id() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (auth.role() = 'admin');

-- =============================================
-- EXPAT PROFILES POLICIES
-- =============================================
CREATE POLICY "Expats can view own profile"
    ON expat_profiles FOR SELECT
    USING (auth.user_id() = id);

CREATE POLICY "Expats can insert own profile"
    ON expat_profiles FOR INSERT
    WITH CHECK (auth.user_id() = id);

CREATE POLICY "Expats can update own profile"
    ON expat_profiles FOR UPDATE
    USING (auth.user_id() = id);

-- Providers can view expat profiles for their bookings
CREATE POLICY "Providers can view expat profiles for bookings"
    ON expat_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.expat_id = expat_profiles.id
            AND b.provider_id = auth.user_id()
        )
    );

-- =============================================
-- PROVIDER PROFILES POLICIES
-- =============================================
-- Anyone can view verified provider profiles (public)
CREATE POLICY "Anyone can view verified provider profiles"
    ON provider_profiles FOR SELECT
    USING (verification_status = 'verified' OR auth.user_id() = id);

-- Providers can insert own profile
CREATE POLICY "Providers can insert own profile"
    ON provider_profiles FOR INSERT
    WITH CHECK (auth.user_id() = id);

-- Providers can update own profile
CREATE POLICY "Providers can update own profile"
    ON provider_profiles FOR UPDATE
    USING (auth.user_id() = id);

-- Admins can update any provider profile (for verification)
CREATE POLICY "Admins can update provider profiles"
    ON provider_profiles FOR UPDATE
    USING (auth.role() = 'admin');

-- =============================================
-- PROVIDER AVAILABILITY POLICIES
-- =============================================
CREATE POLICY "Anyone can view provider availability"
    ON provider_availability FOR SELECT
    USING (true);

CREATE POLICY "Providers can manage own availability"
    ON provider_availability FOR ALL
    USING (auth.user_id() = provider_id);

-- =============================================
-- SERVICES POLICIES
-- =============================================
-- Anyone can view active services
CREATE POLICY "Anyone can view active services"
    ON services FOR SELECT
    USING (is_active = true OR provider_id = auth.user_id());

-- Providers can insert their own services
CREATE POLICY "Providers can insert own services"
    ON services FOR INSERT
    WITH CHECK (auth.user_id() = provider_id);

-- Providers can update their own services
CREATE POLICY "Providers can update own services"
    ON services FOR UPDATE
    USING (auth.user_id() = provider_id);

-- Providers can delete their own services
CREATE POLICY "Providers can delete own services"
    ON services FOR DELETE
    USING (auth.user_id() = provider_id);

-- =============================================
-- SERVICE CATEGORIES POLICIES (PUBLIC)
-- =============================================
CREATE POLICY "Anyone can view service categories"
    ON service_categories FOR SELECT
    USING (true);

-- =============================================
-- SERVICE PRICING TIERS POLICIES
-- =============================================
CREATE POLICY "Anyone can view pricing tiers"
    ON service_pricing_tiers FOR SELECT
    USING (true);

CREATE POLICY "Providers can manage own pricing tiers"
    ON service_pricing_tiers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM services s
            WHERE s.id = service_pricing_tiers.service_id
            AND s.provider_id = auth.user_id()
        )
    );

-- =============================================
-- BOOKINGS POLICIES
-- =============================================
-- Expats can view their own bookings
CREATE POLICY "Expats can view own bookings"
    ON bookings FOR SELECT
    USING (auth.user_id() = expat_id);

-- Providers can view their bookings
CREATE POLICY "Providers can view own bookings"
    ON bookings FOR SELECT
    USING (auth.user_id() = provider_id);

-- Expats can create bookings
CREATE POLICY "Expats can create bookings"
    ON bookings FOR INSERT
    WITH CHECK (auth.user_id() = expat_id);

-- Expats can update their own bookings (limited fields)
CREATE POLICY "Expats can update own bookings"
    ON bookings FOR UPDATE
    USING (auth.user_id() = expat_id);

-- Providers can update their bookings (status, notes, etc.)
CREATE POLICY "Providers can update bookings"
    ON bookings FOR UPDATE
    USING (auth.user_id() = provider_id);

-- =============================================
-- BOOKING DOCUMENTS POLICIES
-- =============================================
CREATE POLICY "Users can view booking documents"
    ON booking_documents FOR SELECT
    USING (
        auth.user_id() = uploaded_by OR
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = booking_documents.booking_id
            AND (b.expat_id = auth.user_id() OR b.provider_id = auth.user_id())
        )
    );

CREATE POLICY "Users can upload booking documents"
    ON booking_documents FOR INSERT
    WITH CHECK (auth.user_id() = uploaded_by);

-- =============================================
-- PAYMENTS POLICIES
-- =============================================
CREATE POLICY "Expats can view own payments"
    ON payments FOR SELECT
    USING (auth.user_id() = expat_id);

CREATE POLICY "Providers can view payments for their services"
    ON payments FOR SELECT
    USING (auth.user_id() = provider_id);

-- Payment creation and updates are handled by backend
CREATE POLICY "System can manage payments"
    ON payments FOR ALL
    USING (auth.role() = 'admin' OR auth.role() = 'service_role');

-- =============================================
-- REVIEWS POLICIES
-- =============================================
-- Anyone can view published reviews
CREATE POLICY "Anyone can view published reviews"
    ON reviews FOR SELECT
    USING (status = 'published' OR expat_id = auth.user_id() OR provider_id = auth.user_id());

-- Expats can create reviews for their completed bookings
CREATE POLICY "Expats can create reviews"
    ON reviews FOR INSERT
    WITH CHECK (
        auth.user_id() = expat_id AND
        EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = booking_id
            AND b.expat_id = auth.user_id()
            AND b.status = 'completed'
        )
    );

-- Expats can update their own reviews (within time limit)
CREATE POLICY "Expats can update own reviews"
    ON reviews FOR UPDATE
    USING (auth.user_id() = expat_id AND created_at > NOW() - INTERVAL '7 days');

-- Providers can respond to reviews
CREATE POLICY "Providers can respond to reviews"
    ON reviews FOR UPDATE
    USING (auth.user_id() = provider_id)
    WITH CHECK (auth.user_id() = provider_id);

-- =============================================
-- REVIEW HELPFUL VOTES POLICIES
-- =============================================
CREATE POLICY "Users can vote on reviews"
    ON review_helpful_votes FOR ALL
    USING (auth.user_id() = user_id);

-- =============================================
-- MESSAGE THREADS POLICIES
-- =============================================
CREATE POLICY "Users can view own message threads"
    ON message_threads FOR SELECT
    USING (auth.user_id() = expat_id OR auth.user_id() = provider_id);

CREATE POLICY "Users can update own message threads"
    ON message_threads FOR UPDATE
    USING (auth.user_id() = expat_id OR auth.user_id() = provider_id);

-- =============================================
-- MESSAGES POLICIES
-- =============================================
CREATE POLICY "Users can view messages in their threads"
    ON messages FOR SELECT
    USING (
        auth.user_id() = sender_id OR auth.user_id() = receiver_id
    );

CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        auth.user_id() = sender_id AND
        EXISTS (
            SELECT 1 FROM message_threads mt
            WHERE mt.id = thread_id
            AND (mt.expat_id = auth.user_id() OR mt.provider_id = auth.user_id())
        )
    );

CREATE POLICY "Users can update own messages"
    ON messages FOR UPDATE
    USING (auth.user_id() = sender_id OR auth.user_id() = receiver_id);

-- =============================================
-- MESSAGE ATTACHMENTS POLICIES
-- =============================================
CREATE POLICY "Users can view attachments in their messages"
    ON message_attachments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM messages m
            WHERE m.id = message_attachments.message_id
            AND (m.sender_id = auth.user_id() OR m.receiver_id = auth.user_id())
        )
    );

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON POLICY "Users can view own profile" ON users IS 'Users can only view their own profile';
COMMENT ON POLICY "Anyone can view verified provider profiles" ON provider_profiles IS 'Public access to verified providers';
COMMENT ON POLICY "Anyone can view active services" ON services IS 'Public marketplace visibility';
