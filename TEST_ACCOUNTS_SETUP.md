# Test Accounts Setup Guide

Since you're having trouble creating accounts through registration, here are multiple ways to set up test accounts.

## Quick Setup - Option 1: Through Browser (Recommended)

**The development server is running at http://localhost:3000**

### Create Expat Test Account

1. **Open registration page:**
   ```
   http://localhost:3000/register
   ```

2. **Fill the form:**
   - Select: **Expat**
   - Full Name: `Test Expat`
   - Email: `expat@test.com`
   - Password: `Test1234!`
   - Confirm Password: `Test1234!`
   - Check: "I agree to Terms and Privacy"

3. **Click "Create account"**

4. **Skip email verification (for testing):**
   - Open Supabase Dashboard → Authentication → Users
   - Find user `expat@test.com`
   - Click the user
   - Toggle "Email Confirmed" to ON
   - OR run this SQL in Supabase SQL Editor:
   ```sql
   UPDATE auth.users
   SET email_confirmed_at = NOW()
   WHERE email = 'expat@test.com';

   UPDATE public.users
   SET email_verified = true,
       verification_token = null,
       verification_token_expires = null
   WHERE email = 'expat@test.com';
   ```

5. **Login:**
   ```
   http://localhost:3000/login
   ```
   - Email: `expat@test.com`
   - Password: `Test1234!`

6. **Complete onboarding:**
   - You'll be redirected to `/onboarding/expat`
   - Fill in profile details
   - Submit to complete setup

### Create Provider Test Account

1. **Open registration page:**
   ```
   http://localhost:3000/register
   ```

2. **Fill the form:**
   - Select: **Legal Expert**
   - Full Name: `Test Provider`
   - Email: `provider@test.com`
   - Password: `Test1234!`
   - Confirm Password: `Test1234!`
   - Check: "I agree to Terms and Privacy"

3. **Click "Create account"**

4. **Verify email (same as above):**
   ```sql
   UPDATE auth.users
   SET email_confirmed_at = NOW()
   WHERE email = 'provider@test.com';

   UPDATE public.users
   SET email_verified = true,
       is_active = true,
       verification_token = null,
       verification_token_expires = null
   WHERE email = 'provider@test.com';
   ```

5. **Login and complete onboarding:**
   - Login at `/login`
   - Complete `/onboarding/provider` form
   - You'll be sent to pending approval page

6. **Approve provider (in Supabase SQL Editor):**
   ```sql
   UPDATE public.provider_profiles
   SET verification_status = 'verified'
   WHERE id = (SELECT id FROM public.users WHERE email = 'provider@test.com');
   ```

---

## Quick Setup - Option 2: Direct SQL in Supabase

Run these SQL commands in **Supabase SQL Editor** to create fully configured test accounts:

### 1. Create Expat Account

```sql
-- Create user
INSERT INTO public.users (id, email, name, password_hash, role, email_verified, is_active)
VALUES (
  gen_random_uuid(),
  'expat@test.com',
  'John Expat',
  '$2a$10$YourHashedPasswordHere', -- You'll need to hash Test1234!
  'expat',
  true,
  true
) ON CONFLICT (email) DO UPDATE
SET email_verified = true, is_active = true
RETURNING id;

-- Create expat profile (use the ID from above)
INSERT INTO public.expat_profiles (
  id,
  nationality,
  country_of_origin,
  residence_status,
  location,
  city,
  phone_number,
  preferred_languages,
  years_in_germany
) VALUES (
  (SELECT id FROM public.users WHERE email = 'expat@test.com'),
  'American',
  'United States',
  'blue_card',
  'Berlin, Germany',
  'Berlin',
  '+49 123 456 7890',
  ARRAY['English', 'German'],
  '2-5'
) ON CONFLICT (id) DO UPDATE
SET nationality = EXCLUDED.nationality,
    country_of_origin = EXCLUDED.country_of_origin,
    residence_status = EXCLUDED.residence_status;
```

### 2. Create Provider Account

```sql
-- Create user
INSERT INTO public.users (id, email, name, password_hash, role, email_verified, is_active)
VALUES (
  gen_random_uuid(),
  'provider@test.com',
  'Dr. Anna Schmidt',
  '$2a$10$YourHashedPasswordHere', -- You'll need to hash Test1234!
  'provider',
  true,
  true
) ON CONFLICT (email) DO UPDATE
SET email_verified = true, is_active = true
RETURNING id;

-- Create provider profile (use the ID from above)
INSERT INTO public.provider_profiles (
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
  accepts_in_person_meetings
) VALUES (
  (SELECT id FROM public.users WHERE email = 'provider@test.com'),
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
  true
) ON CONFLICT (id) DO UPDATE
SET verification_status = 'verified';
```

---

## Quick Setup - Option 3: Create Password Hash

If using SQL method, you need to hash the password first:

### Using bcrypt online tool:
1. Go to: https://bcrypt-generator.com/
2. Enter password: `Test1234!`
3. Rounds: 10
4. Click "Generate"
5. Copy the hash and use it in the SQL above

### Using Node.js:
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('Test1234!', 10);
console.log(hash);
```

---

## What to Test

### After Creating Accounts:

**Expat Flow:**
1. ✅ Login at `/login` with `expat@test.com` / `Test1234!`
2. ✅ View profile at `/dashboard/expat/profile`
3. ✅ Update profile information
4. ✅ Upload profile photo
5. ✅ Change languages, location, etc.

**Provider Flow:**
1. ✅ Login at `/login` with `provider@test.com` / `Test1234!`
2. ✅ View profile at `/dashboard/provider/profile`
3. ✅ See verification status badge
4. ✅ Update professional details
5. ✅ Add/remove specializations
6. ✅ Manage languages with proficiency levels
7. ✅ Update pricing and availability

---

## Troubleshooting

### "Can't create account" - Registration Error

**Check these:**
1. Is Supabase connection working?
   ```bash
   # Check .env.local file
   cat .env.local | grep SUPABASE
   ```

2. Are environment variables loaded?
   - Restart dev server: `npm run dev`
   - Check browser console for errors

3. Test Supabase connection:
   - Open `/api/health` in browser
   - Should return `{"status":"ok"}`

### "Email verification not working"

Just skip it for testing using the SQL commands above.

### "Provider can't login"

Providers need to be:
1. Email verified ✅
2. Account active (`is_active = true`) ✅
3. Profile verified (`verification_status = 'verified'`) ✅

Run this to fix:
```sql
UPDATE public.users
SET is_active = true, email_verified = true
WHERE email = 'provider@test.com';

UPDATE public.provider_profiles
SET verification_status = 'verified'
WHERE id = (SELECT id FROM public.users WHERE email = 'provider@test.com');
```

### "Password doesn't work"

If you created accounts via SQL, ensure the password hash is correct.

**Quick fix:** Reset password through UI
1. Go to `/forgot-password`
2. Enter email
3. Click reset link in email (or update token in database)

---

## API Testing

You can also create accounts via API using curl:

```bash
# Create expat account
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Expat",
    "email": "api-expat@test.com",
    "password": "Test1234!",
    "confirmPassword": "Test1234!",
    "userType": "expat",
    "agreeToTerms": true
  }'

# Create provider account
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Provider",
    "email": "api-provider@test.com",
    "password": "Test1234!",
    "confirmPassword": "Test1234!",
    "userType": "provider",
    "agreeToTerms": true
  }'
```

---

## Quick Links

- **Dev Server:** http://localhost:3000
- **Registration:** http://localhost:3000/register
- **Login:** http://localhost:3000/login
- **Expat Profile:** http://localhost:3000/dashboard/expat/profile
- **Provider Profile:** http://localhost:3000/dashboard/provider/profile
- **Full User Flows:** See `USER_FLOWS.md`

---

## Pre-configured Credentials (if seed script works)

Once the connection issues are fixed, running `npm run seed-test` will create:

**Expat:**
- Email: `expat@test.com`
- Password: `Test1234!`

**Provider:**
- Email: `provider@test.com`
- Password: `Test1234!`
