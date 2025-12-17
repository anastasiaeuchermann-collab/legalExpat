-- Create enum types for reviews and messages
CREATE TYPE review_status AS ENUM ('pending', 'published', 'flagged', 'removed');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read', 'failed');
CREATE TYPE attachment_type AS ENUM ('image', 'document', 'video', 'other');

-- =============================================
-- REVIEWS TABLE
-- =============================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    expat_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,

    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT NOT NULL,

    -- Provider response
    provider_response TEXT,
    provider_responded_at TIMESTAMP WITH TIME ZONE,

    -- Status
    status review_status DEFAULT 'published',
    is_verified_booking BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,

    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,

    -- Moderation
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

-- =============================================
-- REVIEW HELPFUL VOTES TABLE
-- =============================================
CREATE TABLE review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_vote UNIQUE (review_id, user_id)
);

-- =============================================
-- FUNCTION TO UPDATE REVIEW COUNTS
-- =============================================
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

CREATE TRIGGER track_review_helpful_votes
    AFTER INSERT OR UPDATE OR DELETE ON review_helpful_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_helpful_counts();

-- =============================================
-- FUNCTION TO UPDATE PROVIDER RATING
-- =============================================
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

        UPDATE provider_profiles
        SET rating = COALESCE(avg_rating, 0),
            total_reviews = review_count
        WHERE id = NEW.provider_id;
    ELSIF (TG_OP = 'DELETE') THEN
        SELECT AVG(rating)::DECIMAL(3, 2), COUNT(*)
        INTO avg_rating, review_count
        FROM reviews
        WHERE provider_id = OLD.provider_id AND status = 'published';

        UPDATE provider_profiles
        SET rating = COALESCE(avg_rating, 0),
            total_reviews = review_count
        WHERE id = OLD.provider_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_provider_rating_on_review
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_provider_rating();

-- =============================================
-- MESSAGE THREADS TABLE
-- =============================================
CREATE TABLE message_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,

    -- Participants
    expat_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,

    -- Thread status
    is_active BOOLEAN DEFAULT TRUE,
    archived_by_expat BOOLEAN DEFAULT FALSE,
    archived_by_provider BOOLEAN DEFAULT FALSE,

    -- Last message info
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_preview TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MESSAGES TABLE
-- =============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,

    -- Sender and receiver
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Message content
    content TEXT NOT NULL,
    is_system_message BOOLEAN DEFAULT FALSE,

    -- Status
    status message_status DEFAULT 'sent',
    read_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

-- =============================================
-- MESSAGE ATTACHMENTS TABLE
-- =============================================
CREATE TABLE message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,

    -- File details
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    file_type VARCHAR(100),
    attachment_type attachment_type NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT file_size_positive CHECK (file_size_bytes IS NULL OR file_size_bytes > 0)
);

-- =============================================
-- FUNCTION TO UPDATE THREAD ON NEW MESSAGE
-- =============================================
CREATE OR REPLACE FUNCTION update_thread_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE message_threads
    SET last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        updated_at = NOW()
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_thread_after_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_thread_on_new_message();

-- =============================================
-- FUNCTION TO AUTO-CREATE MESSAGE THREAD FOR BOOKING
-- =============================================
CREATE OR REPLACE FUNCTION create_message_thread_for_booking()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO message_threads (booking_id, expat_id, provider_id)
    VALUES (NEW.id, NEW.expat_id, NEW.provider_id)
    ON CONFLICT (booking_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_thread_for_booking
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION create_message_thread_for_booking();

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_threads_updated_at BEFORE UPDATE ON message_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE reviews IS 'Provider reviews from expats';
COMMENT ON TABLE review_helpful_votes IS 'Helpful votes on reviews';
COMMENT ON TABLE message_threads IS 'Message threads for bookings';
COMMENT ON TABLE messages IS 'Messages between expats and providers';
COMMENT ON TABLE message_attachments IS 'File attachments in messages';
COMMENT ON COLUMN reviews.is_verified_booking IS 'Review is from a verified completed booking';
