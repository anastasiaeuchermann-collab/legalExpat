-- Create enum types for bookings
CREATE TYPE booking_status AS ENUM (
    'requested',
    'pending_payment',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
    'no_show',
    'refunded'
);

CREATE TYPE cancellation_initiator AS ENUM ('expat', 'provider', 'admin', 'system');
CREATE TYPE document_type AS ENUM ('identification', 'contract', 'permit', 'other');
CREATE TYPE document_visibility AS ENUM ('private', 'shared_with_provider', 'public');

-- =============================================
-- BOOKINGS TABLE
-- =============================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(50) UNIQUE NOT NULL,

    -- Relationships
    expat_id UUID NOT NULL REFERENCES users(id),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id),
    service_id UUID NOT NULL REFERENCES services(id),

    -- Booking details
    status booking_status NOT NULL DEFAULT 'requested',
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    scheduled_end_time TIME,
    duration_minutes INTEGER NOT NULL,

    -- Meeting details
    meeting_type service_delivery NOT NULL,
    meeting_url TEXT,
    meeting_location TEXT,
    meeting_notes TEXT,

    -- Pricing
    service_price DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',

    -- Additional information
    expat_notes TEXT,
    provider_notes TEXT,
    internal_notes TEXT,

    -- Status tracking
    confirmed_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    cancelled_by cancellation_initiator,

    -- Reminders
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    follow_up_sent_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT price_positive CHECK (service_price >= 0 AND total_amount >= 0),
    CONSTRAINT duration_positive CHECK (duration_minutes > 0),
    CONSTRAINT scheduled_in_future CHECK (scheduled_date >= CURRENT_DATE)
);

-- =============================================
-- BOOKING DOCUMENTS TABLE
-- =============================================
CREATE TABLE booking_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id),

    -- Document details
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    file_type VARCHAR(100),
    document_type document_type NOT NULL,
    visibility document_visibility DEFAULT 'shared_with_provider',

    -- Metadata
    title VARCHAR(255),
    description TEXT,
    notes TEXT,

    -- Status
    is_required BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT file_size_positive CHECK (file_size_bytes IS NULL OR file_size_bytes > 0)
);

-- =============================================
-- BOOKING STATUS HISTORY TABLE
-- =============================================
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

-- =============================================
-- FUNCTION TO AUTO-CREATE STATUS HISTORY
-- =============================================
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

CREATE TRIGGER track_booking_status_changes
    AFTER INSERT OR UPDATE OF status ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_booking_status_history();

-- =============================================
-- FUNCTION TO GENERATE BOOKING NUMBER
-- =============================================
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.booking_number := 'BK-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' || LPAD(nextval('booking_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE booking_number_seq START 1;

CREATE TRIGGER set_booking_number
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION generate_booking_number();

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_documents_updated_at BEFORE UPDATE ON booking_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE bookings IS 'Service bookings and appointments';
COMMENT ON TABLE booking_documents IS 'Documents uploaded for bookings';
COMMENT ON TABLE booking_status_history IS 'Audit trail for booking status changes';
COMMENT ON COLUMN bookings.booking_number IS 'Human-readable booking reference number';
