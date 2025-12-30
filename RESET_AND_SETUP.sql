-- =============================================
-- LEGALEXPAT - RESET AND COMPLETE SETUP
-- =============================================
-- This script will DROP all existing objects and recreate everything
-- WARNING: This will delete all data! Only use on a fresh database.
-- =============================================

-- Drop all tables (in reverse order of dependencies)
DROP TABLE IF EXISTS message_attachments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS message_threads CASCADE;
DROP TABLE IF EXISTS review_helpful_votes CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS provider_payouts CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS payment_events CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS booking_status_history CASCADE;
DROP TABLE IF EXISTS booking_documents CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS service_tags_mapping CASCADE;
DROP TABLE IF EXISTS service_tags CASCADE;
DROP TABLE IF EXISTS service_pricing_tiers CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS service_categories CASCADE;
DROP TABLE IF EXISTS provider_blocked_dates CASCADE;
DROP TABLE IF EXISTS provider_availability CASCADE;
DROP TABLE IF EXISTS provider_profiles CASCADE;
DROP TABLE IF EXISTS expat_profiles CASCADE;
DROP TABLE IF EXISTS auth_context CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop sequences
DROP SEQUENCE IF EXISTS booking_number_seq CASCADE;
DROP SEQUENCE IF EXISTS payment_number_seq CASCADE;
DROP SEQUENCE IF EXISTS refund_number_seq CASCADE;
DROP SEQUENCE IF EXISTS payout_number_seq CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_booking_status_history() CASCADE;
DROP FUNCTION IF EXISTS generate_booking_number() CASCADE;
DROP FUNCTION IF EXISTS generate_payment_number() CASCADE;
DROP FUNCTION IF EXISTS generate_refund_number() CASCADE;
DROP FUNCTION IF EXISTS generate_payout_number() CASCADE;
DROP FUNCTION IF EXISTS update_review_helpful_counts() CASCADE;
DROP FUNCTION IF EXISTS update_provider_rating() CASCADE;
DROP FUNCTION IF EXISTS update_thread_on_new_message() CASCADE;
DROP FUNCTION IF EXISTS create_message_thread_for_booking() CASCADE;
DROP FUNCTION IF EXISTS current_user_id() CASCADE;
DROP FUNCTION IF EXISTS current_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_authenticated() CASCADE;
DROP FUNCTION IF EXISTS has_role(TEXT) CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS set_auth_context(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS clear_auth_context() CASCADE;

-- Drop types
DROP TYPE IF EXISTS attachment_type CASCADE;
DROP TYPE IF EXISTS message_status CASCADE;
DROP TYPE IF EXISTS review_status CASCADE;
DROP TYPE IF EXISTS refund_reason CASCADE;
DROP TYPE IF EXISTS escrow_status CASCADE;
DROP TYPE IF EXISTS payment_method_type CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS document_visibility CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS cancellation_initiator CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS service_delivery CASCADE;
DROP TYPE IF EXISTS pricing_type CASCADE;
DROP TYPE IF EXISTS service_category CASCADE;
DROP TYPE IF EXISTS residence_status CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- =============================================
-- NOW CREATE EVERYTHING FRESH
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('expat', 'provider', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE residence_status AS ENUM ('tourist', 'student', 'work_visa', 'blue_card', 'permanent_resident', 'citizen', 'other');
CREATE TYPE service_category AS ENUM ('immigration', 'visa_support', 'work_permit', 'tax_filing', 'tax_advisory', 'employment', 'contract_review', 'company_formation', 'real_estate', 'family_law', 'residence_permit', 'citizenship', 'other');
CREATE TYPE pricing_type AS ENUM ('fixed', 'hourly', 'tiered');
CREATE TYPE service_delivery AS ENUM ('online', 'in_person', 'hybrid');
CREATE TYPE booking_status AS ENUM ('requested', 'pending_payment', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'refunded');
CREATE TYPE cancellation_initiator AS ENUM ('expat', 'provider', 'admin', 'system');
CREATE TYPE document_type AS ENUM ('identification', 'contract', 'permit', 'other');
CREATE TYPE document_visibility AS ENUM ('private', 'shared_with_provider', 'public');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'requires_payment_method', 'requires_confirmation', 'requires_action', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded');
CREATE TYPE payment_method_type AS ENUM ('card', 'sepa_debit', 'sofort', 'giropay', 'paypal', 'other');
CREATE TYPE escrow_status AS ENUM ('held', 'released_to_provider', 'refunded_to_expat', 'disputed');
CREATE TYPE refund_reason AS ENUM ('requested_by_customer', 'duplicate', 'fraudulent', 'service_not_provided', 'other');
CREATE TYPE review_status AS ENUM ('pending', 'published', 'flagged', 'removed');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read', 'failed');
CREATE TYPE attachment_type AS ENUM ('image', 'document', 'video', 'other');

-- USERS TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'expat',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- EXPAT PROFILES TABLE
CREATE TABLE expat_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    nationality VARCHAR(100),
    country_of_origin VARCHAR(100),
    residence_status residence_status,
    residence_permit_expiry DATE,
    location VARCHAR(255),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    preferred_languages TEXT[] DEFAULT '{}',
    date_of_birth DATE,
    occupation VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PROVIDER PROFILES TABLE
CREATE TABLE provider_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    description TEXT,
    specializations TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    address TEXT,
    license_number VARCHAR(100),
    bar_association VARCHAR(255),
    years_of_experience INTEGER DEFAULT 0,
    education TEXT,
    certifications TEXT[] DEFAULT '{}',
    hourly_rate DECIMAL(10, 2),
    consultation_fee DECIMAL(10, 2),
    accepts_online_meetings BOOLEAN DEFAULT TRUE,
    accepts_in_person_meetings BOOLEAN DEFAULT TRUE,
    verification_status verification_status DEFAULT 'pending',
    verification_documents TEXT[] DEFAULT '{}',
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    completed_bookings INTEGER DEFAULT 0,
    tax_id VARCHAR(50),
    business_registration_number VARCHAR(100),
    website_url TEXT,
    linkedin_url TEXT,
    is_accepting_clients BOOLEAN DEFAULT TRUE,
    response_time_hours INTEGER DEFAULT 24,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT rating_range CHECK (rating >= 0 AND rating <= 5),
    CONSTRAINT experience_positive CHECK (years_of_experience >= 0),
    CONSTRAINT response_time_positive CHECK (response_time_hours > 0)
);

-- PROVIDER AVAILABILITY TABLE
CREATE TABLE provider_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT unique_availability UNIQUE (provider_id, day_of_week, start_time, end_time)
);

-- PROVIDER BLOCKED DATES TABLE
CREATE TABLE provider_blocked_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_blocked_date UNIQUE (provider_id, blocked_date)
);

-- SERVICE CATEGORIES TABLE
CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SERVICES TABLE
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    category service_category NOT NULL,
    category_id UUID REFERENCES service_categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),
    pricing_type pricing_type NOT NULL DEFAULT 'fixed',
    base_price DECIMAL(10, 2),
    hourly_rate DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'EUR',
    estimated_duration_minutes INTEGER,
    duration_label VARCHAR(100),
    delivery_method service_delivery DEFAULT 'hybrid',
    required_documents TEXT[] DEFAULT '{}',
    prerequisites TEXT,
    what_to_prepare TEXT,
    included_items TEXT[] DEFAULT '{}',
    excluded_items TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    bookings_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT price_positive CHECK ((pricing_type = 'fixed' AND base_price > 0) OR (pricing_type = 'hourly' AND hourly_rate > 0) OR pricing_type = 'tiered'),
    CONSTRAINT duration_positive CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0)
);

-- SERVICE PRICING TIERS TABLE
CREATE TABLE service_pricing_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    tier_name VARCHAR(100) NOT NULL,
    tier_description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    features TEXT[] DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT price_positive CHECK (price > 0)
);

-- SERVICE TAGS TABLE
CREATE TABLE service_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SERVICE TAGS MAPPING TABLE
CREATE TABLE service_tags_mapping (
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES service_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (service_id, tag_id)
);

-- BOOKINGS TABLE
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    expat_id UUID NOT NULL REFERENCES users(id),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id),
    service_id UUID NOT NULL REFERENCES services(id),
    status booking_status NOT NULL DEFAULT 'requested',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    scheduled_end_time TIME,
    duration_minutes INTEGER NOT NULL,
    meeting_type service_delivery NOT NULL,
    meeting_url TEXT,
    meeting_location TEXT,
    meeting_notes TEXT,
    service_price DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    expat_notes TEXT,
    provider_notes TEXT,
    internal_notes TEXT,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    cancelled_by cancellation_initiator,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    follow_up_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT price_positive CHECK (service_price >= 0 AND total_amount >= 0),
    CONSTRAINT duration_positive CHECK (duration_minutes > 0),
    CONSTRAINT scheduled_in_future CHECK (scheduled_date >= CURRENT_DATE)
);

-- BOOKING DOCUMENTS TABLE
CREATE TABLE booking_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    file_type VARCHAR(100),
    document_type document_type NOT NULL,
    visibility document_visibility DEFAULT 'shared_with_provider',
    title VARCHAR(255),
    description TEXT,
    notes TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT file_size_positive CHECK (file_size_bytes IS NULL OR file_size_bytes > 0)
);

-- BOOKING STATUS HISTORY TABLE
CREATE TABLE booking_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    from_status booking_status,
    to_status booking_status NOT NULL,
    changed_by UUID REFERENCES users(id),
    reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PAYMENTS TABLE
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    expat_id UUID NOT NULL REFERENCES users(id),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id),
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) DEFAULT 0,
    provider_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status payment_status NOT NULL DEFAULT 'pending',
    payment_method_type payment_method_type,
    escrow_status escrow_status DEFAULT 'held',
    escrowed_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    metadata JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT amount_positive CHECK (amount > 0 AND provider_amount >= 0),
    CONSTRAINT platform_fee_valid CHECK (platform_fee >= 0 AND platform_fee <= amount),
    CONSTRAINT provider_amount_valid CHECK (provider_amount = amount - platform_fee)
);

-- PAYMENT EVENTS TABLE
CREATE TABLE payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REFUNDS TABLE
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    refund_number VARCHAR(50) UNIQUE NOT NULL,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    stripe_refund_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    reason refund_reason NOT NULL,
    description TEXT,
    status payment_status NOT NULL DEFAULT 'pending',
    initiated_by UUID REFERENCES users(id),
    refunded_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT amount_positive CHECK (amount > 0)
);

-- PROVIDER PAYOUTS TABLE
CREATE TABLE provider_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payout_number VARCHAR(50) UNIQUE NOT NULL,
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE RESTRICT,
    stripe_transfer_id VARCHAR(255) UNIQUE,
    stripe_account_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    payment_ids UUID[] DEFAULT '{}',
    status payment_status NOT NULL DEFAULT 'pending',
    transferred_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    metadata JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT amount_positive CHECK (amount > 0)
);

-- REVIEWS TABLE
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    expat_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT NOT NULL,
    provider_response TEXT,
    provider_responded_at TIMESTAMP WITH TIME ZONE,
    status review_status DEFAULT 'published',
    is_verified_booking BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    flagged_at TIMESTAMP WITH TIME ZONE,
    flagged_by UUID REFERENCES users(id),
    flag_reason TEXT,
    moderated_at TIMESTAMP WITH TIME ZONE,
    moderated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT helpful_count_positive CHECK (helpful_count >= 0 AND not_helpful_count >= 0)
);

-- REVIEW HELPFUL VOTES TABLE
CREATE TABLE review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_vote UNIQUE (review_id, user_id)
);

-- MESSAGE THREADS TABLE
CREATE TABLE message_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    expat_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    archived_by_expat BOOLEAN DEFAULT FALSE,
    archived_by_provider BOOLEAN DEFAULT FALSE,
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_preview TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MESSAGES TABLE
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_system_message BOOLEAN DEFAULT FALSE,
    status message_status DEFAULT 'sent',
    read_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

-- MESSAGE ATTACHMENTS TABLE
CREATE TABLE message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    file_type VARCHAR(100),
    attachment_type attachment_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT file_size_positive CHECK (file_size_bytes IS NULL OR file_size_bytes > 0)
);

-- AUTH CONTEXT TABLE
CREATE TABLE auth_context (
    user_id UUID,
    user_role user_role,
    transaction_id UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CREATE SEQUENCES
-- =============================================

CREATE SEQUENCE booking_number_seq START 1;
CREATE SEQUENCE payment_number_seq START 1;
CREATE SEQUENCE refund_number_seq START 1;
CREATE SEQUENCE payout_number_seq START 1;

-- =============================================
-- CREATE FUNCTIONS AND TRIGGERS
-- =============================================

-- Function: update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expat_profiles_updated_at BEFORE UPDATE ON expat_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provider_profiles_updated_at BEFORE UPDATE ON provider_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provider_availability_updated_at BEFORE UPDATE ON provider_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE ON service_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_pricing_tiers_updated_at BEFORE UPDATE ON service_pricing_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_booking_documents_updated_at BEFORE UPDATE ON booking_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provider_payouts_updated_at BEFORE UPDATE ON provider_payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_threads_updated_at BEFORE UPDATE ON message_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: create_booking_status_history
CREATE OR REPLACE FUNCTION create_booking_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO booking_status_history (booking_id, from_status, to_status)
        VALUES (NEW.id, OLD.status, NEW.status);
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO booking_status_history (booking_id, to_status)
        VALUES (NEW.id, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_booking_status_changes AFTER INSERT OR UPDATE OF status ON bookings FOR EACH ROW EXECUTE FUNCTION create_booking_status_history();

-- Function: generate_booking_number
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.booking_number := 'BK-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' || LPAD(nextval('booking_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_number BEFORE INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION generate_booking_number();

-- Function: generate_payment_number
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.payment_number := 'PAY-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' || LPAD(nextval('payment_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_payment_number BEFORE INSERT ON payments FOR EACH ROW EXECUTE FUNCTION generate_payment_number();

-- Function: generate_refund_number
CREATE OR REPLACE FUNCTION generate_refund_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.refund_number := 'REF-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' || LPAD(nextval('refund_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_refund_number BEFORE INSERT ON refunds FOR EACH ROW EXECUTE FUNCTION generate_refund_number();

-- Function: generate_payout_number
CREATE OR REPLACE FUNCTION generate_payout_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.payout_number := 'PO-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' || LPAD(nextval('payout_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_payout_number BEFORE INSERT ON provider_payouts FOR EACH ROW EXECUTE FUNCTION generate_payout_number();

-- Function: update_review_helpful_counts
CREATE OR REPLACE FUNCTION update_review_helpful_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.is_helpful THEN
            UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
        ELSE
            UPDATE reviews SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF OLD.is_helpful AND NOT NEW.is_helpful THEN
            UPDATE reviews SET helpful_count = helpful_count - 1, not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
        ELSIF NOT OLD.is_helpful AND NEW.is_helpful THEN
            UPDATE reviews SET helpful_count = helpful_count + 1, not_helpful_count = not_helpful_count - 1 WHERE id = NEW.review_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.is_helpful THEN
            UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
        ELSE
            UPDATE reviews SET not_helpful_count = not_helpful_count - 1 WHERE id = OLD.review_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_review_helpful_votes AFTER INSERT OR UPDATE OR DELETE ON review_helpful_votes FOR EACH ROW EXECUTE FUNCTION update_review_helpful_counts();

-- Function: update_provider_rating
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3, 2);
    review_count INTEGER;
BEGIN
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        SELECT AVG(rating)::DECIMAL(3, 2), COUNT(*)
        INTO avg_rating, review_count
        FROM reviews
        WHERE provider_id = NEW.provider_id AND status = 'published';
        UPDATE provider_profiles SET rating = COALESCE(avg_rating, 0), total_reviews = review_count WHERE id = NEW.provider_id;
    ELSIF (TG_OP = 'DELETE') THEN
        SELECT AVG(rating)::DECIMAL(3, 2), COUNT(*)
        INTO avg_rating, review_count
        FROM reviews
        WHERE provider_id = OLD.provider_id AND status = 'published';
        UPDATE provider_profiles SET rating = COALESCE(avg_rating, 0), total_reviews = review_count WHERE id = OLD.provider_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_provider_rating_on_review AFTER INSERT OR UPDATE OR DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION update_provider_rating();

-- Function: update_thread_on_new_message
CREATE OR REPLACE FUNCTION update_thread_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE message_threads SET last_message_at = NEW.created_at, last_message_preview = LEFT(NEW.content, 100), updated_at = NOW() WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_after_message AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION update_thread_on_new_message();

-- Function: create_message_thread_for_booking
CREATE OR REPLACE FUNCTION create_message_thread_for_booking()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO message_threads (booking_id, expat_id, provider_id)
    VALUES (NEW.id, NEW.expat_id, NEW.provider_id)
    ON CONFLICT (booking_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_thread_for_booking AFTER INSERT ON bookings FOR EACH ROW EXECUTE FUNCTION create_message_thread_for_booking();

-- Auth helper functions
CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.user_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_user_role() RETURNS TEXT AS $$
BEGIN
    RETURN NULLIF(current_setting('app.user_role', true), '')::text;
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_authenticated() RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_user_id() IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_role(check_role TEXT) RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_user_role() = check_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN has_role('admin');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_auth_context(p_user_id UUID, p_user_role TEXT) RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.user_id', p_user_id::text, true);
    PERFORM set_config('app.user_role', p_user_role, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION clear_auth_context() RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.user_id', '', true);
    PERFORM set_config('app.user_role', '', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
ALTER TABLE auth_context ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CREATE RLS POLICIES
-- =============================================

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (current_user_id() = id OR is_admin());
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (current_user_id() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (is_admin());

-- Expat profiles policies
CREATE POLICY "Expats can view own profile" ON expat_profiles FOR SELECT USING (current_user_id() = id OR is_admin());
CREATE POLICY "Expats can insert own profile" ON expat_profiles FOR INSERT WITH CHECK (current_user_id() = id);
CREATE POLICY "Expats can update own profile" ON expat_profiles FOR UPDATE USING (current_user_id() = id);
CREATE POLICY "Providers can view expat profiles for bookings" ON expat_profiles FOR SELECT USING (EXISTS (SELECT 1 FROM bookings b WHERE b.expat_id = expat_profiles.id AND b.provider_id = current_user_id()) OR is_admin());

-- Provider profiles policies
CREATE POLICY "Anyone can view verified provider profiles" ON provider_profiles FOR SELECT USING (verification_status = 'verified' OR current_user_id() = id OR is_admin());
CREATE POLICY "Providers can insert own profile" ON provider_profiles FOR INSERT WITH CHECK (current_user_id() = id);
CREATE POLICY "Providers can update own profile" ON provider_profiles FOR UPDATE USING (current_user_id() = id);
CREATE POLICY "Admins can update provider profiles" ON provider_profiles FOR UPDATE USING (is_admin());

-- Provider availability policies
CREATE POLICY "Anyone can view provider availability" ON provider_availability FOR SELECT USING (true);
CREATE POLICY "Providers can manage own availability" ON provider_availability FOR ALL USING (current_user_id() = provider_id);

-- Services policies
CREATE POLICY "Anyone can view active services" ON services FOR SELECT USING (is_active = true OR provider_id = current_user_id());
CREATE POLICY "Providers can insert own services" ON services FOR INSERT WITH CHECK (current_user_id() = provider_id);
CREATE POLICY "Providers can update own services" ON services FOR UPDATE USING (current_user_id() = provider_id);
CREATE POLICY "Providers can delete own services" ON services FOR DELETE USING (current_user_id() = provider_id);

-- Service categories policies
CREATE POLICY "Anyone can view service categories" ON service_categories FOR SELECT USING (true);

-- Service pricing tiers policies
CREATE POLICY "Anyone can view pricing tiers" ON service_pricing_tiers FOR SELECT USING (true);
CREATE POLICY "Providers can manage own pricing tiers" ON service_pricing_tiers FOR ALL USING (EXISTS (SELECT 1 FROM services s WHERE s.id = service_pricing_tiers.service_id AND s.provider_id = current_user_id()));

-- Bookings policies
CREATE POLICY "Expats can view own bookings" ON bookings FOR SELECT USING (current_user_id() = expat_id OR is_admin());
CREATE POLICY "Providers can view own bookings" ON bookings FOR SELECT USING (current_user_id() = provider_id OR is_admin());
CREATE POLICY "Expats can create bookings" ON bookings FOR INSERT WITH CHECK (current_user_id() = expat_id AND is_authenticated());
CREATE POLICY "Expats can update own bookings" ON bookings FOR UPDATE USING (current_user_id() = expat_id);
CREATE POLICY "Providers can update bookings" ON bookings FOR UPDATE USING (current_user_id() = provider_id);

-- Booking documents policies
CREATE POLICY "Users can view booking documents" ON booking_documents FOR SELECT USING (current_user_id() = uploaded_by OR EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_documents.booking_id AND (b.expat_id = current_user_id() OR b.provider_id = current_user_id())));
CREATE POLICY "Users can upload booking documents" ON booking_documents FOR INSERT WITH CHECK (current_user_id() = uploaded_by);

-- Payments policies
CREATE POLICY "Expats can view own payments" ON payments FOR SELECT USING (current_user_id() = expat_id OR is_admin());
CREATE POLICY "Providers can view payments for their services" ON payments FOR SELECT USING (current_user_id() = provider_id OR is_admin());
CREATE POLICY "System can manage payments" ON payments FOR ALL USING (is_admin());

-- Reviews policies
CREATE POLICY "Anyone can view published reviews" ON reviews FOR SELECT USING (status = 'published' OR expat_id = current_user_id() OR provider_id = current_user_id());
CREATE POLICY "Expats can create reviews" ON reviews FOR INSERT WITH CHECK (current_user_id() = expat_id AND is_authenticated() AND EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.expat_id = current_user_id() AND b.status = 'completed'));
CREATE POLICY "Expats can update own reviews" ON reviews FOR UPDATE USING (current_user_id() = expat_id AND created_at > NOW() - INTERVAL '7 days');
CREATE POLICY "Providers can respond to reviews" ON reviews FOR UPDATE USING (current_user_id() = provider_id) WITH CHECK (current_user_id() = provider_id);

-- Review helpful votes policies
CREATE POLICY "Users can vote on reviews" ON review_helpful_votes FOR ALL USING (current_user_id() = user_id);

-- Message threads policies
CREATE POLICY "Users can view own message threads" ON message_threads FOR SELECT USING (current_user_id() = expat_id OR current_user_id() = provider_id);
CREATE POLICY "Users can update own message threads" ON message_threads FOR UPDATE USING (current_user_id() = expat_id OR current_user_id() = provider_id);

-- Messages policies
CREATE POLICY "Users can view messages in their threads" ON messages FOR SELECT USING (current_user_id() = sender_id OR current_user_id() = receiver_id);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (current_user_id() = sender_id AND EXISTS (SELECT 1 FROM message_threads mt WHERE mt.id = thread_id AND (mt.expat_id = current_user_id() OR mt.provider_id = current_user_id())));
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (current_user_id() = sender_id OR current_user_id() = receiver_id);

-- Message attachments policies
CREATE POLICY "Users can view attachments in their messages" ON message_attachments FOR SELECT USING (EXISTS (SELECT 1 FROM messages m WHERE m.id = message_attachments.message_id AND (m.sender_id = current_user_id() OR m.receiver_id = current_user_id())));

-- Auth context policies
CREATE POLICY "Users can set own auth context" ON auth_context FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read own auth context" ON auth_context FOR SELECT USING (user_id = current_setting('app.user_id', true)::uuid);

-- =============================================
-- CREATE INDEXES
-- =============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_is_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_expat_profiles_location ON expat_profiles(location);
CREATE INDEX idx_expat_profiles_city ON expat_profiles(city);
CREATE INDEX idx_provider_profiles_verification_status ON provider_profiles(verification_status);
CREATE INDEX idx_provider_profiles_rating ON provider_profiles(rating DESC);
CREATE INDEX idx_provider_profiles_city ON provider_profiles(city);
CREATE INDEX idx_provider_profiles_verified_active ON provider_profiles(verification_status, is_accepting_clients, rating DESC) WHERE verification_status = 'verified' AND is_accepting_clients = true;
CREATE INDEX idx_services_provider_id ON services(provider_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_is_active ON services(is_active) WHERE is_active = true;
CREATE INDEX idx_bookings_expat_id ON bookings(expat_id);
CREATE INDEX idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_message_threads_expat_id ON message_threads(expat_id);
CREATE INDEX idx_message_threads_provider_id ON message_threads(provider_id);
CREATE INDEX idx_messages_thread_id ON messages(thread_id);

-- =============================================
-- SEED DATA
-- =============================================

INSERT INTO service_categories (slug, name, description, icon, display_order) VALUES
    ('immigration', 'Immigration Law', 'Visa applications, residence permits, and citizenship matters', 'passport', 1),
    ('visa-support', 'Visa Support', 'Assistance with various visa types including work, student, and family reunion visas', 'plane', 2),
    ('work-permit', 'Work Permit Services', 'Work visa applications, Blue Card support, and employment authorization', 'briefcase', 3),
    ('residence-permit', 'Residence Permits', 'Temporary and permanent residence permit applications and renewals', 'home', 4),
    ('citizenship', 'Citizenship & Naturalization', 'German citizenship applications and naturalization processes', 'flag', 5),
    ('tax-filing', 'Tax Filing', 'Individual and business tax return preparation and filing', 'calculator', 6),
    ('tax-advisory', 'Tax Advisory', 'Tax planning, optimization, and consulting services', 'chart-bar', 7),
    ('employment', 'Employment Law', 'Employment contracts, workplace disputes, and labor law matters', 'user-tie', 8),
    ('contract-review', 'Contract Review', 'Review and advice on rental agreements, employment contracts, and other legal documents', 'file-contract', 9),
    ('company-formation', 'Company Formation', 'Business registration, GmbH formation, and freelance registration (Gewerbeanmeldung)', 'building', 10),
    ('real-estate', 'Real Estate Law', 'Property purchases, rental law, and real estate transactions', 'house', 11),
    ('family-law', 'Family Law', 'Marriage, divorce, child custody, and family reunification matters', 'users', 12),
    ('other', 'Other Legal Services', 'Additional legal services not covered in other categories', 'gavel', 99)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO service_tags (slug, name) VALUES
    ('urgent', 'Urgent'), ('online-consultation', 'Online Consultation'), ('english-speaking', 'English Speaking'),
    ('document-translation', 'Document Translation'), ('berlin', 'Berlin'), ('munich', 'Munich')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- COMPLETE!
-- =============================================
