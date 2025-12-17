-- Create enum types for services
CREATE TYPE service_category AS ENUM (
    'immigration',
    'visa_support',
    'work_permit',
    'tax_filing',
    'tax_advisory',
    'employment',
    'contract_review',
    'company_formation',
    'real_estate',
    'family_law',
    'residence_permit',
    'citizenship',
    'other'
);

CREATE TYPE pricing_type AS ENUM ('fixed', 'hourly', 'tiered');
CREATE TYPE service_delivery AS ENUM ('online', 'in_person', 'hybrid');

-- =============================================
-- SERVICE CATEGORIES REFERENCE TABLE
-- =============================================
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

-- =============================================
-- SERVICES TABLE
-- =============================================
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    category service_category NOT NULL,
    category_id UUID REFERENCES service_categories(id),

    -- Service details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description VARCHAR(500),

    -- Pricing
    pricing_type pricing_type NOT NULL DEFAULT 'fixed',
    base_price DECIMAL(10, 2),
    hourly_rate DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'EUR',

    -- Duration
    estimated_duration_minutes INTEGER,
    duration_label VARCHAR(100),

    -- Delivery
    delivery_method service_delivery DEFAULT 'hybrid',

    -- Requirements
    required_documents TEXT[] DEFAULT '{}',
    prerequisites TEXT,
    what_to_prepare TEXT,

    -- Additional details
    included_items TEXT[] DEFAULT '{}',
    excluded_items TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Metadata
    views_count INTEGER DEFAULT 0,
    bookings_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT price_positive CHECK (
        (pricing_type = 'fixed' AND base_price > 0) OR
        (pricing_type = 'hourly' AND hourly_rate > 0) OR
        pricing_type = 'tiered'
    ),
    CONSTRAINT duration_positive CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0)
);

-- =============================================
-- SERVICE PRICING TIERS TABLE (for tiered pricing)
-- =============================================
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

-- =============================================
-- SERVICE TAGS TABLE
-- =============================================
CREATE TABLE service_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SERVICE TAGS MAPPING TABLE
-- =============================================
CREATE TABLE service_tags_mapping (
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES service_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    PRIMARY KEY (service_id, tag_id)
);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE ON service_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_pricing_tiers_updated_at BEFORE UPDATE ON service_pricing_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE service_categories IS 'Reference table for service categories';
COMMENT ON TABLE services IS 'Services offered by legal service providers';
COMMENT ON TABLE service_pricing_tiers IS 'Tiered pricing options for services';
COMMENT ON TABLE service_tags IS 'Tags for categorizing and filtering services';
COMMENT ON TABLE service_tags_mapping IS 'Many-to-many relationship between services and tags';
