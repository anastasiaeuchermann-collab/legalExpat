-- Create enum types for payments
CREATE TYPE payment_status AS ENUM (
    'pending',
    'processing',
    'requires_payment_method',
    'requires_confirmation',
    'requires_action',
    'succeeded',
    'failed',
    'cancelled',
    'refunded',
    'partially_refunded'
);

CREATE TYPE payment_method_type AS ENUM ('card', 'sepa_debit', 'sofort', 'giropay', 'paypal', 'other');
CREATE TYPE escrow_status AS ENUM ('held', 'released_to_provider', 'refunded_to_expat', 'disputed');
CREATE TYPE refund_reason AS ENUM ('requested_by_customer', 'duplicate', 'fraudulent', 'service_not_provided', 'other');

-- =============================================
-- PAYMENTS TABLE
-- =============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(50) UNIQUE NOT NULL,

    -- Relationships
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    expat_id UUID NOT NULL REFERENCES users(id),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id),

    -- Stripe information
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),

    -- Payment details
    amount DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2) DEFAULT 0,
    provider_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',

    -- Status
    status payment_status NOT NULL DEFAULT 'pending',
    payment_method_type payment_method_type,

    -- Escrow
    escrow_status escrow_status DEFAULT 'held',
    escrowed_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,

    -- Metadata
    metadata JSONB,
    description TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT amount_positive CHECK (amount > 0 AND provider_amount >= 0),
    CONSTRAINT platform_fee_valid CHECK (platform_fee >= 0 AND platform_fee <= amount),
    CONSTRAINT provider_amount_valid CHECK (provider_amount = amount - platform_fee)
);

-- =============================================
-- PAYMENT EVENTS TABLE (Stripe webhook events)
-- =============================================
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

-- =============================================
-- REFUNDS TABLE
-- =============================================
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    refund_number VARCHAR(50) UNIQUE NOT NULL,

    -- Relationships
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,

    -- Stripe information
    stripe_refund_id VARCHAR(255) UNIQUE,

    -- Refund details
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    reason refund_reason NOT NULL,
    description TEXT,

    -- Status
    status payment_status NOT NULL DEFAULT 'pending',
    initiated_by UUID REFERENCES users(id),

    -- Timestamps
    refunded_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,

    -- Metadata
    metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT amount_positive CHECK (amount > 0)
);

-- =============================================
-- PROVIDER PAYOUTS TABLE
-- =============================================
CREATE TABLE provider_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payout_number VARCHAR(50) UNIQUE NOT NULL,

    -- Relationships
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE RESTRICT,

    -- Stripe information
    stripe_transfer_id VARCHAR(255) UNIQUE,
    stripe_account_id VARCHAR(255),

    -- Payout details
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    payment_ids UUID[] DEFAULT '{}',

    -- Status
    status payment_status NOT NULL DEFAULT 'pending',

    -- Timestamps
    transferred_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,

    -- Metadata
    metadata JSONB,
    description TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT amount_positive CHECK (amount > 0)
);

-- =============================================
-- FUNCTION TO GENERATE PAYMENT NUMBER
-- =============================================
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.payment_number := 'PAY-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' || LPAD(nextval('payment_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE payment_number_seq START 1;

CREATE TRIGGER set_payment_number
    BEFORE INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION generate_payment_number();

-- =============================================
-- FUNCTION TO GENERATE REFUND NUMBER
-- =============================================
CREATE OR REPLACE FUNCTION generate_refund_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.refund_number := 'REF-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' || LPAD(nextval('refund_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE refund_number_seq START 1;

CREATE TRIGGER set_refund_number
    BEFORE INSERT ON refunds
    FOR EACH ROW
    EXECUTE FUNCTION generate_refund_number();

-- =============================================
-- FUNCTION TO GENERATE PAYOUT NUMBER
-- =============================================
CREATE OR REPLACE FUNCTION generate_payout_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.payout_number := 'PO-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' || LPAD(nextval('payout_number_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE payout_number_seq START 1;

CREATE TRIGGER set_payout_number
    BEFORE INSERT ON provider_payouts
    FOR EACH ROW
    EXECUTE FUNCTION generate_payout_number();

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at BEFORE UPDATE ON refunds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_payouts_updated_at BEFORE UPDATE ON provider_payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE payments IS 'Payment transactions via Stripe';
COMMENT ON TABLE payment_events IS 'Stripe webhook events for payment tracking';
COMMENT ON TABLE refunds IS 'Refund transactions';
COMMENT ON TABLE provider_payouts IS 'Payouts to providers';
COMMENT ON COLUMN payments.escrow_status IS 'Payment held in escrow until service completion';
