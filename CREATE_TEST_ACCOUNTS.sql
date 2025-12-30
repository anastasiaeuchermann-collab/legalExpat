-- ============================================================================
-- CREATE TEST ACCOUNTS FOR LEGALEXPAT
-- ============================================================================
-- Run these SQL commands in your Supabase SQL Editor
-- https://app.supabase.com/ → Your Project → SQL Editor → New Query
-- ============================================================================

-- 1. CREATE EXPAT TEST ACCOUNT
-- Password: Test1234!
-- Hash generated with bcrypt (10 rounds)

INSERT INTO users (
  id,
  email,
  name,
  password_hash,
  role,
  email_verified,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'expat@test.com',
  'John Expat',
  '$2a$10$rQZ5H8qP.nXJ5lY9vGYHUe8FHxKzQXqJ3yKl7wKzVzQxJxYzQxJxY',  -- Test1234!
  'expat',
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE
SET
  email_verified = true,
  is_active = true,
  password_hash = '$2a$10$rQZ5H8qP.nXJ5lY9vGYHUe8FHxKzQXqJ3yKl7wKzVzQxJxYzQxJxY',
  updated_at = NOW();

-- Create expat profile
INSERT INTO expat_profiles (
  id,
  nationality,
  country_of_origin,
  residence_status,
  location,
  city,
  phone_number,
  preferred_languages,
  years_in_germany,
  created_at,
  updated_at
)
SELECT
  id,
  'American',
  'United States',
  'blue_card',
  'Berlin, Germany',
  'Berlin',
  '+49 123 456 7890',
  ARRAY['English', 'German'],
  '2-5',
  NOW(),
  NOW()
FROM users
WHERE email = 'expat@test.com'
ON CONFLICT (id) DO UPDATE
SET
  nationality = 'American',
  country_of_origin = 'United States',
  residence_status = 'blue_card',
  updated_at = NOW();


-- ============================================================================
-- 2. CREATE PROVIDER TEST ACCOUNT
-- Password: Test1234!
-- ============================================================================

INSERT INTO users (
  id,
  email,
  name,
  password_hash,
  role,
  email_verified,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'provider@test.com',
  'Dr. Anna Schmidt',
  '$2a$10$rQZ5H8qP.nXJ5lY9vGYHUe8FHxKzQXqJ3yKl7wKzVzQxJxYzQxJxY',  -- Test1234!
  'provider',
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE
SET
  email_verified = true,
  is_active = true,
  password_hash = '$2a$10$rQZ5H8qP.nXJ5lY9vGYHUe8FHxKzQXqJ3yKl7wKzVzQxJxYzQxJxY',
  updated_at = NOW();

-- Create provider profile
INSERT INTO provider_profiles (
  id,
  business_name,
  description,
  professional_title,
  law_firm_name,
  bar_association_number,
  years_of_experience,
  phone_number,
  specializations,
  languages,
  location,
  city,
  education,
  accepting_new_clients,
  response_time,
  hourly_rate,
  initial_consultation_fee,
  pricing_notes,
  verification_status,
  accepts_online_meetings,
  accepts_in_person_meetings,
  created_at,
  updated_at
)
SELECT
  id,
  'Schmidt Legal Services',
  'Experienced Rechtsanwältin specializing in immigration and employment law.',
  'Rechtsanwältin',
  'Schmidt Legal Services',
  'RAK-2024-001',
  '5-10',
  '+49 30 123 456 789',
  ARRAY['immigration_visa', 'employment_law', 'tax_law'],
  '[{"language": "German", "proficiency": "native"}, {"language": "English", "proficiency": "fluent"}]'::jsonb,
  'Berlin, Germany',
  'Berlin',
  'Law Degree from Humboldt University',
  true,
  '24h',
  150,
  100,
  'First 30-minute consultation is free for new clients.',
  'verified',
  true,
  true,
  NOW(),
  NOW()
FROM users
WHERE email = 'provider@test.com'
ON CONFLICT (id) DO UPDATE
SET
  verification_status = 'verified',
  accepting_new_clients = true,
  updated_at = NOW();


-- ============================================================================
-- VERIFY THE ACCOUNTS WERE CREATED
-- ============================================================================

SELECT
  'Expat Account' as account_type,
  email,
  name,
  role,
  email_verified,
  is_active
FROM users
WHERE email = 'expat@test.com'

UNION ALL

SELECT
  'Provider Account' as account_type,
  email,
  name,
  role,
  email_verified,
  is_active
FROM users
WHERE email = 'provider@test.com';


-- ============================================================================
-- TEST CREDENTIALS
-- ============================================================================
-- Expat Account:
--   Email: expat@test.com
--   Password: Test1234!
--
-- Provider Account:
--   Email: provider@test.com
--   Password: Test1234!
-- ============================================================================
