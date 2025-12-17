-- =============================================
-- SEED SERVICE CATEGORIES
-- =============================================
INSERT INTO service_categories (slug, name, description, icon, display_order) VALUES
    (
        'immigration',
        'Immigration Law',
        'Visa applications, residence permits, and citizenship matters',
        'passport',
        1
    ),
    (
        'visa-support',
        'Visa Support',
        'Assistance with various visa types including work, student, and family reunion visas',
        'plane',
        2
    ),
    (
        'work-permit',
        'Work Permit Services',
        'Work visa applications, Blue Card support, and employment authorization',
        'briefcase',
        3
    ),
    (
        'residence-permit',
        'Residence Permits',
        'Temporary and permanent residence permit applications and renewals',
        'home',
        4
    ),
    (
        'citizenship',
        'Citizenship & Naturalization',
        'German citizenship applications and naturalization processes',
        'flag',
        5
    ),
    (
        'tax-filing',
        'Tax Filing',
        'Individual and business tax return preparation and filing',
        'calculator',
        6
    ),
    (
        'tax-advisory',
        'Tax Advisory',
        'Tax planning, optimization, and consulting services',
        'chart-bar',
        7
    ),
    (
        'employment',
        'Employment Law',
        'Employment contracts, workplace disputes, and labor law matters',
        'user-tie',
        8
    ),
    (
        'contract-review',
        'Contract Review',
        'Review and advice on rental agreements, employment contracts, and other legal documents',
        'file-contract',
        9
    ),
    (
        'company-formation',
        'Company Formation',
        'Business registration, GmbH formation, and freelance registration (Gewerbeanmeldung)',
        'building',
        10
    ),
    (
        'real-estate',
        'Real Estate Law',
        'Property purchases, rental law, and real estate transactions',
        'house',
        11
    ),
    (
        'family-law',
        'Family Law',
        'Marriage, divorce, child custody, and family reunification matters',
        'users',
        12
    ),
    (
        'other',
        'Other Legal Services',
        'Additional legal services not covered in other categories',
        'gavel',
        99
    )
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- SEED SERVICE TAGS
-- =============================================
INSERT INTO service_tags (slug, name) VALUES
    ('urgent', 'Urgent'),
    ('online-consultation', 'Online Consultation'),
    ('in-person-only', 'In-Person Only'),
    ('english-speaking', 'English Speaking'),
    ('document-translation', 'Document Translation'),
    ('government-forms', 'Government Forms Assistance'),
    ('eu-citizens', 'EU Citizens'),
    ('non-eu-citizens', 'Non-EU Citizens'),
    ('students', 'Students'),
    ('professionals', 'Professionals'),
    ('families', 'Families'),
    ('entrepreneurs', 'Entrepreneurs'),
    ('freelancers', 'Freelancers'),
    ('berlin', 'Berlin'),
    ('munich', 'Munich'),
    ('frankfurt', 'Frankfurt'),
    ('hamburg', 'Hamburg'),
    ('cologne', 'Cologne'),
    ('stuttgart', 'Stuttgart'),
    ('dusseldorf', 'Düsseldorf'),
    ('dortmund', 'Dortmund'),
    ('essen', 'Essen'),
    ('leipzig', 'Leipzig'),
    ('bremen', 'Bremen'),
    ('dresden', 'Dresden'),
    ('hanover', 'Hanover'),
    ('nuremberg', 'Nuremberg'),
    ('initial-consultation', 'Initial Consultation'),
    ('follow-up', 'Follow-up Session'),
    ('package-deal', 'Package Deal'),
    ('payment-plan', 'Payment Plan Available'),
    ('same-day', 'Same Day Service'),
    ('weekend-availability', 'Weekend Availability'),
    ('evening-hours', 'Evening Hours')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- SEED DEMO ADMIN USER (OPTIONAL - REMOVE IN PRODUCTION)
-- =============================================
-- Password: Admin123! (hashed with bcrypt)
-- Note: This should be removed or changed in production
INSERT INTO users (id, email, name, password_hash, role, email_verified) VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'admin@legalexpat.com',
        'Admin User',
        '$2a$10$rB5VvLKJEm7z7z7z7z7z7uzqO8vJFkGFQWlV1yG5OzH8P6JQXN9KG',
        'admin',
        true
    )
ON CONFLICT (email) DO NOTHING;

-- =============================================
-- HELPFUL QUERIES FOR REFERENCE
-- =============================================
-- Find all verified providers in a city:
-- SELECT * FROM provider_profiles WHERE verification_status = 'verified' AND city = 'Berlin';

-- Find services by category:
-- SELECT s.*, pp.business_name, pp.rating
-- FROM services s
-- JOIN provider_profiles pp ON s.provider_id = pp.id
-- WHERE s.category = 'immigration' AND s.is_active = true
-- ORDER BY pp.rating DESC;

-- Find available time slots for a provider:
-- SELECT * FROM provider_availability
-- WHERE provider_id = 'provider-uuid'
-- AND is_active = true
-- AND day_of_week = 1 -- Monday
-- ORDER BY start_time;

-- Get provider statistics:
-- SELECT
--     pp.business_name,
--     pp.rating,
--     pp.total_reviews,
--     COUNT(DISTINCT b.id) as total_bookings,
--     COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings
-- FROM provider_profiles pp
-- LEFT JOIN bookings b ON pp.id = b.provider_id
-- WHERE pp.id = 'provider-uuid'
-- GROUP BY pp.id, pp.business_name, pp.rating, pp.total_reviews;

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE service_categories IS 'Seeded with default legal service categories relevant to expats in Germany';
COMMENT ON TABLE service_tags IS 'Seeded with common tags for filtering and categorizing services';
