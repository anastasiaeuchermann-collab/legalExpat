-- =============================================
-- USERS TABLE INDEXES
-- =============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_is_active ON users(is_active) WHERE is_active = true;

-- =============================================
-- EXPAT PROFILES INDEXES
-- =============================================
CREATE INDEX idx_expat_profiles_location ON expat_profiles(location);
CREATE INDEX idx_expat_profiles_city ON expat_profiles(city);
CREATE INDEX idx_expat_profiles_nationality ON expat_profiles(nationality);
CREATE INDEX idx_expat_profiles_residence_status ON expat_profiles(residence_status);

-- =============================================
-- PROVIDER PROFILES INDEXES
-- =============================================
CREATE INDEX idx_provider_profiles_verification_status ON provider_profiles(verification_status);
CREATE INDEX idx_provider_profiles_rating ON provider_profiles(rating DESC);
CREATE INDEX idx_provider_profiles_city ON provider_profiles(city);
CREATE INDEX idx_provider_profiles_is_accepting_clients ON provider_profiles(is_accepting_clients) WHERE is_accepting_clients = true;
CREATE INDEX idx_provider_profiles_specializations ON provider_profiles USING GIN(specializations);
CREATE INDEX idx_provider_profiles_languages ON provider_profiles USING GIN(languages);
CREATE INDEX idx_provider_profiles_created_at ON provider_profiles(created_at DESC);

-- Composite index for popular queries
CREATE INDEX idx_provider_profiles_verified_active ON provider_profiles(verification_status, is_accepting_clients, rating DESC)
    WHERE verification_status = 'verified' AND is_accepting_clients = true;

-- =============================================
-- PROVIDER AVAILABILITY INDEXES
-- =============================================
CREATE INDEX idx_provider_availability_provider_id ON provider_availability(provider_id);
CREATE INDEX idx_provider_availability_day_of_week ON provider_availability(day_of_week);
CREATE INDEX idx_provider_availability_active ON provider_availability(provider_id, is_active) WHERE is_active = true;

-- =============================================
-- PROVIDER BLOCKED DATES INDEXES
-- =============================================
CREATE INDEX idx_provider_blocked_dates_provider_id ON provider_blocked_dates(provider_id);
CREATE INDEX idx_provider_blocked_dates_date ON provider_blocked_dates(blocked_date);
CREATE INDEX idx_provider_blocked_dates_provider_date ON provider_blocked_dates(provider_id, blocked_date);

-- =============================================
-- SERVICE CATEGORIES INDEXES
-- =============================================
CREATE INDEX idx_service_categories_slug ON service_categories(slug);
CREATE INDEX idx_service_categories_is_active ON service_categories(is_active) WHERE is_active = true;
CREATE INDEX idx_service_categories_display_order ON service_categories(display_order);

-- =============================================
-- SERVICES INDEXES
-- =============================================
CREATE INDEX idx_services_provider_id ON services(provider_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_category_id ON services(category_id);
CREATE INDEX idx_services_is_active ON services(is_active) WHERE is_active = true;
CREATE INDEX idx_services_is_featured ON services(is_featured) WHERE is_featured = true;
CREATE INDEX idx_services_created_at ON services(created_at DESC);
CREATE INDEX idx_services_views_count ON services(views_count DESC);
CREATE INDEX idx_services_bookings_count ON services(bookings_count DESC);
CREATE INDEX idx_services_languages ON services USING GIN(languages);

-- Composite index for service listings
CREATE INDEX idx_services_active_provider ON services(provider_id, is_active) WHERE is_active = true;
CREATE INDEX idx_services_active_category ON services(category, is_active) WHERE is_active = true;

-- =============================================
-- SERVICE PRICING TIERS INDEXES
-- =============================================
CREATE INDEX idx_service_pricing_tiers_service_id ON service_pricing_tiers(service_id);
CREATE INDEX idx_service_pricing_tiers_display_order ON service_pricing_tiers(display_order);

-- =============================================
-- SERVICE TAGS INDEXES
-- =============================================
CREATE INDEX idx_service_tags_slug ON service_tags(slug);
CREATE INDEX idx_service_tags_name ON service_tags(name);

-- =============================================
-- SERVICE TAGS MAPPING INDEXES
-- =============================================
CREATE INDEX idx_service_tags_mapping_service_id ON service_tags_mapping(service_id);
CREATE INDEX idx_service_tags_mapping_tag_id ON service_tags_mapping(tag_id);

-- =============================================
-- BOOKINGS INDEXES
-- =============================================
CREATE INDEX idx_bookings_booking_number ON bookings(booking_number);
CREATE INDEX idx_bookings_expat_id ON bookings(expat_id);
CREATE INDEX idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_scheduled_date ON bookings(scheduled_date);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_bookings_expat_status ON bookings(expat_id, status);
CREATE INDEX idx_bookings_provider_status ON bookings(provider_id, status);
CREATE INDEX idx_bookings_provider_date ON bookings(provider_id, scheduled_date);
CREATE INDEX idx_bookings_expat_date ON bookings(expat_id, scheduled_date DESC);

-- Index for upcoming bookings
CREATE INDEX idx_bookings_upcoming ON bookings(scheduled_date, scheduled_time)
    WHERE status IN ('confirmed', 'in_progress');

-- =============================================
-- BOOKING DOCUMENTS INDEXES
-- =============================================
CREATE INDEX idx_booking_documents_booking_id ON booking_documents(booking_id);
CREATE INDEX idx_booking_documents_uploaded_by ON booking_documents(uploaded_by);
CREATE INDEX idx_booking_documents_document_type ON booking_documents(document_type);
CREATE INDEX idx_booking_documents_visibility ON booking_documents(visibility);

-- =============================================
-- BOOKING STATUS HISTORY INDEXES
-- =============================================
CREATE INDEX idx_booking_status_history_booking_id ON booking_status_history(booking_id);
CREATE INDEX idx_booking_status_history_created_at ON booking_status_history(created_at DESC);

-- =============================================
-- PAYMENTS INDEXES
-- =============================================
CREATE INDEX idx_payments_payment_number ON payments(payment_number);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_expat_id ON payments(expat_id);
CREATE INDEX idx_payments_provider_id ON payments(provider_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_stripe_customer_id ON payments(stripe_customer_id);
CREATE INDEX idx_payments_escrow_status ON payments(escrow_status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Composite index for payment queries
CREATE INDEX idx_payments_provider_status ON payments(provider_id, status);
CREATE INDEX idx_payments_expat_status ON payments(expat_id, status);

-- =============================================
-- PAYMENT EVENTS INDEXES
-- =============================================
CREATE INDEX idx_payment_events_payment_id ON payment_events(payment_id);
CREATE INDEX idx_payment_events_stripe_event_id ON payment_events(stripe_event_id);
CREATE INDEX idx_payment_events_event_type ON payment_events(event_type);
CREATE INDEX idx_payment_events_processed ON payment_events(processed, created_at) WHERE processed = false;

-- =============================================
-- REFUNDS INDEXES
-- =============================================
CREATE INDEX idx_refunds_refund_number ON refunds(refund_number);
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_booking_id ON refunds(booking_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_stripe_refund_id ON refunds(stripe_refund_id);
CREATE INDEX idx_refunds_created_at ON refunds(created_at DESC);

-- =============================================
-- PROVIDER PAYOUTS INDEXES
-- =============================================
CREATE INDEX idx_provider_payouts_payout_number ON provider_payouts(payout_number);
CREATE INDEX idx_provider_payouts_provider_id ON provider_payouts(provider_id);
CREATE INDEX idx_provider_payouts_status ON provider_payouts(status);
CREATE INDEX idx_provider_payouts_stripe_transfer_id ON provider_payouts(stripe_transfer_id);
CREATE INDEX idx_provider_payouts_created_at ON provider_payouts(created_at DESC);

-- =============================================
-- REVIEWS INDEXES
-- =============================================
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX idx_reviews_expat_id ON reviews(expat_id);
CREATE INDEX idx_reviews_service_id ON reviews(service_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- Composite indexes for review queries
CREATE INDEX idx_reviews_provider_status ON reviews(provider_id, status, created_at DESC)
    WHERE status = 'published';
CREATE INDEX idx_reviews_provider_rating ON reviews(provider_id, rating DESC)
    WHERE status = 'published';

-- Index for featured reviews
CREATE INDEX idx_reviews_featured ON reviews(is_featured, created_at DESC)
    WHERE is_featured = true AND status = 'published';

-- =============================================
-- REVIEW HELPFUL VOTES INDEXES
-- =============================================
CREATE INDEX idx_review_helpful_votes_review_id ON review_helpful_votes(review_id);
CREATE INDEX idx_review_helpful_votes_user_id ON review_helpful_votes(user_id);

-- =============================================
-- MESSAGE THREADS INDEXES
-- =============================================
CREATE INDEX idx_message_threads_booking_id ON message_threads(booking_id);
CREATE INDEX idx_message_threads_expat_id ON message_threads(expat_id);
CREATE INDEX idx_message_threads_provider_id ON message_threads(provider_id);
CREATE INDEX idx_message_threads_last_message_at ON message_threads(last_message_at DESC);
CREATE INDEX idx_message_threads_is_active ON message_threads(is_active) WHERE is_active = true;

-- Composite indexes for thread queries
CREATE INDEX idx_message_threads_expat_active ON message_threads(expat_id, is_active, last_message_at DESC);
CREATE INDEX idx_message_threads_provider_active ON message_threads(provider_id, is_active, last_message_at DESC);

-- =============================================
-- MESSAGES INDEXES
-- =============================================
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Composite index for message queries
CREATE INDEX idx_messages_thread_created ON messages(thread_id, created_at DESC);
CREATE INDEX idx_messages_receiver_status ON messages(receiver_id, status) WHERE status != 'read';

-- =============================================
-- MESSAGE ATTACHMENTS INDEXES
-- =============================================
CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX idx_message_attachments_attachment_type ON message_attachments(attachment_type);

-- =============================================
-- FULL TEXT SEARCH INDEXES
-- =============================================
-- Provider profiles full-text search
CREATE INDEX idx_provider_profiles_fts ON provider_profiles
    USING GIN(to_tsvector('english',
        COALESCE(business_name, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(education, '')
    ));

-- Services full-text search
CREATE INDEX idx_services_fts ON services
    USING GIN(to_tsvector('english',
        COALESCE(title, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(short_description, '')
    ));

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON INDEX idx_provider_profiles_verified_active IS 'Optimized index for finding available verified providers';
COMMENT ON INDEX idx_bookings_upcoming IS 'Optimized index for finding upcoming confirmed bookings';
COMMENT ON INDEX idx_provider_profiles_fts IS 'Full-text search index for provider profiles';
COMMENT ON INDEX idx_services_fts IS 'Full-text search index for services';
