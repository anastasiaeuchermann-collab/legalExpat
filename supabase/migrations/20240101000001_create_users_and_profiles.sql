-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('expat', 'provider', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE residence_status AS ENUM ('tourist', 'student', 'work_visa', 'blue_card', 'permanent_resident', 'citizen', 'other');

-- =============================================
-- USERS TABLE
-- =============================================
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

-- =============================================
-- EXPAT PROFILES TABLE
-- =============================================
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

-- =============================================
-- PROVIDER PROFILES TABLE
-- =============================================
CREATE TABLE provider_profiles (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    description TEXT,
    specializations TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',

    -- Location information
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    address TEXT,

    -- Professional information
    license_number VARCHAR(100),
    bar_association VARCHAR(255),
    years_of_experience INTEGER DEFAULT 0,
    education TEXT,
    certifications TEXT[] DEFAULT '{}',

    -- Pricing and availability
    hourly_rate DECIMAL(10, 2),
    consultation_fee DECIMAL(10, 2),
    accepts_online_meetings BOOLEAN DEFAULT TRUE,
    accepts_in_person_meetings BOOLEAN DEFAULT TRUE,

    -- Verification and ratings
    verification_status verification_status DEFAULT 'pending',
    verification_documents TEXT[] DEFAULT '{}',
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),

    -- Ratings
    rating DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    completed_bookings INTEGER DEFAULT 0,

    -- Business details
    tax_id VARCHAR(50),
    business_registration_number VARCHAR(100),
    website_url TEXT,
    linkedin_url TEXT,

    -- Availability
    is_accepting_clients BOOLEAN DEFAULT TRUE,
    response_time_hours INTEGER DEFAULT 24,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT rating_range CHECK (rating >= 0 AND rating <= 5),
    CONSTRAINT experience_positive CHECK (years_of_experience >= 0),
    CONSTRAINT response_time_positive CHECK (response_time_hours > 0)
);

-- =============================================
-- PROVIDER AVAILABILITY TABLE
-- =============================================
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

-- =============================================
-- PROVIDER BLOCKED DATES TABLE
-- =============================================
CREATE TABLE provider_blocked_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    blocked_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_blocked_date UNIQUE (provider_id, blocked_date)
);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expat_profiles_updated_at BEFORE UPDATE ON expat_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_profiles_updated_at BEFORE UPDATE ON provider_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_availability_updated_at BEFORE UPDATE ON provider_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE users IS 'Base user table for all user types';
COMMENT ON TABLE expat_profiles IS 'Extended profile information for expat users';
COMMENT ON TABLE provider_profiles IS 'Extended profile information for legal service providers';
COMMENT ON TABLE provider_availability IS 'Weekly availability schedule for providers';
COMMENT ON TABLE provider_blocked_dates IS 'Specific dates when providers are unavailable';
