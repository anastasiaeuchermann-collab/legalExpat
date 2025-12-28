# LegalExpat User Flows & Testing Guide

## Quick Start - Test Accounts

Run this command to create pre-configured test accounts:

```bash
npm run seed-test
```

This will create:

### Test Credentials

**Expat Account:**
- Email: `expat@test.com`
- Password: `Test1234!`
- Status: Email verified, Active
- Profile: Fully configured with location, languages, etc.

**Provider Account:**
- Email: `provider@test.com`
- Password: `Test1234!`
- Status: Email verified, Active, Verified
- Profile: Professional details, specializations, pricing configured

---

## User Registration Flows

### 1. Expat Registration Flow

**Step 1: Registration Page** (`/register`)
1. Navigate to http://localhost:3000/register
2. Select "Expat" user type
3. Fill in:
   - Full Name: e.g., "John Doe"
   - Email: Your email address
   - Password: Min 8 chars with uppercase, lowercase, number
   - Confirm Password: Same as password
   - Check "I agree to Terms and Privacy Policy"
4. Click "Create account"

**Step 2: Email Verification** (`/verify`)
- You'll be redirected to verification page
- Check email for verification link
- Click the verification link
- Or manually verify in database for testing

**Step 3: Onboarding** (`/onboarding/expat`)
After email verification, complete profile:
- Nationality: Select your nationality
- Country of Origin: Select country
- Residence Status: Blue Card, Work Permit, etc.
- Location: Full address in Germany
- City: Select from German cities
- Phone Number: Optional, format: +49 123 456 7890
- Preferred Languages: Select multiple languages

**Step 4: Dashboard Access**
- After onboarding, you'll be redirected to expat dashboard
- Can update profile at `/dashboard/expat/profile`

### 2. Provider (Legal Expert) Registration Flow

**Step 1: Registration Page** (`/register`)
1. Navigate to http://localhost:3000/register
2. Select "Legal Expert" user type
3. You'll see a notice: "Provider accounts require admin approval"
4. Fill in:
   - Full Name: e.g., "Dr. Anna Schmidt"
   - Email: Your email address
   - Password: Min 8 chars with uppercase, lowercase, number
   - Confirm Password: Same as password
   - Check "I agree to Terms and Privacy Policy"
5. Click "Create account"

**Step 2: Email Verification** (`/verify`)
- Same as expat flow
- Verify email address

**Step 3: Onboarding** (`/onboarding/provider`)
After email verification, complete professional profile:

*Basic Information:*
- Business Name/Law Firm: e.g., "Schmidt Legal Services"
- Description: Brief description of services
- Specializations: Select from Immigration, Tax, Employment, etc.
- Languages: Select multiple with proficiency levels

*Location & Availability:*
- Location: Full address
- City: Select from German cities
- Years of Experience: Select range
- Education: Your qualifications
- Hourly Rate: Optional
- Accepts online/in-person meetings: Check boxes

**Step 4: Pending Approval** (`/onboarding/provider/pending`)
- After onboarding, provider accounts are NOT immediately active
- You'll see: "Your account is pending admin approval"
- Admin must verify and approve the account

**Step 5: Admin Approval** (Manual)
Admin needs to update in database:
```sql
UPDATE users SET is_active = true WHERE email = 'provider@email.com';
UPDATE provider_profiles SET verification_status = 'verified' WHERE id = 'user-id';
```

**Step 6: Dashboard Access**
- Once approved, provider can login
- Access profile at `/dashboard/provider/profile`

---

## Login Flow

**Login Page** (`/login`)
1. Navigate to http://localhost:3000/login
2. Enter email and password
3. Click "Sign in"
4. You'll be redirected based on role:
   - Expat → `/dashboard/expat` (when implemented)
   - Provider → `/dashboard/provider` (when implemented)

**Google OAuth (Expats Only)**
1. On login or register page
2. Click "Continue with Google"
3. Complete Google authentication
4. Will be redirected to onboarding if first time

---

## Profile Management

### Expat Profile (`/dashboard/expat/profile`)

**Personal Information:**
- Full Name
- Email (display only)
- Phone Number (optional)
- Profile Photo Upload

**Location Details:**
- Country of Origin (65+ countries)
- Current City in Germany
- Residence Status (Blue Card, Work Permit, etc.)
- Years in Germany (<1, 1-2, 2-5, 5+)

**Languages:**
- Multi-select from available languages
- Click language buttons to add/remove

**Actions:**
- Save Changes → Updates profile
- Success/error notifications shown

### Provider Profile (`/dashboard/provider/profile`)

**Professional Details:**
- Full Name
- Professional Title (e.g., Rechtsanwalt)
- Law Firm/Organization Name
- Bar Association Number
- Years of Experience
- Phone Number (optional)
- Profile Photo Upload

**Specializations:**
- Immigration & Visa Law
- Tax Law
- Contract Law
- Employment Law
- Company Formation
- Family Law
- Real Estate Law
- (Multi-select with toggle buttons)

**Languages & Proficiency:**
- Add languages with proficiency level:
  - Native
  - Fluent
  - Professional
  - Basic
- Can add/remove languages dynamically

**Availability:**
- Toggle: Currently accepting new clients
- Response Time: Within 24h / 48h / 1 week

**Pricing:**
- Hourly Rate (€/hour)
- Initial Consultation Fee (€)
- Pricing Notes (500 character limit)

**Verification Status:**
- Badge showing: Pending / Verified / Rejected
- Admin notes displayed if rejected

**Actions:**
- Save Changes → Updates profile
- Success/error notifications shown

---

## Password Reset Flow

**Forgot Password** (`/forgot-password`)
1. Navigate to http://localhost:3000/forgot-password
2. Enter your email address
3. Click "Send Reset Link"
4. Check email for reset link

**Reset Password** (`/reset-password?token=...`)
1. Click link from email
2. Enter new password
3. Confirm new password
4. Click "Reset Password"
5. Redirected to login

---

## API Testing

### Create Expat via API
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Expat",
    "email": "test-expat@example.com",
    "password": "Test1234!",
    "confirmPassword": "Test1234!",
    "userType": "expat",
    "agreeToTerms": true
  }'
```

### Create Provider via API
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Provider",
    "email": "test-provider@example.com",
    "password": "Test1234!",
    "confirmPassword": "Test1234!",
    "userType": "provider",
    "agreeToTerms": true
  }'
```

### Get Profile
```bash
# Must be authenticated - use session cookie
curl http://localhost:3000/api/users/profile \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

### Update Profile
```bash
# Must be authenticated
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "name": "Updated Name",
    "phone_number": "+49 123 456 7890",
    "city": "Berlin",
    ...
  }'
```

---

## Troubleshooting

### Can't Create Account
- Check Supabase connection in `.env.local`
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check browser console for errors

### Email Verification Not Working
For testing, manually verify in database:
```sql
UPDATE users
SET email_verified = true,
    verification_token = null,
    verification_token_expires = null
WHERE email = 'your@email.com';
```

### Provider Can't Login
Check account is active and verified:
```sql
SELECT is_active, email_verified FROM users WHERE email = 'provider@email.com';
UPDATE users SET is_active = true WHERE email = 'provider@email.com';

SELECT verification_status FROM provider_profiles WHERE id = 'user-id';
UPDATE provider_profiles SET verification_status = 'verified' WHERE id = 'user-id';
```

### Profile Not Saving
- Check browser console for validation errors
- Ensure all required fields are filled
- Check API response in Network tab

### Development Server Issues
```bash
# Kill and restart
pkill -f "next dev"
npm run dev
```

---

## Environment Setup

Required environment variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## Next Steps After Account Creation

### For Expats:
1. Complete profile at `/dashboard/expat/profile`
2. Browse legal experts (when implemented)
3. Book consultations (when implemented)
4. Manage appointments (when implemented)

### For Providers:
1. Wait for admin approval
2. Complete profile at `/dashboard/provider/profile`
3. Set availability and pricing
4. Manage client bookings (when implemented)
5. Update verification documents (when implemented)

---

## Quick Test Checklist

- [ ] Run `npm run seed-test` to create test accounts
- [ ] Login as expat (`expat@test.com` / `Test1234!`)
- [ ] View expat profile at `/dashboard/expat/profile`
- [ ] Update expat profile and save
- [ ] Logout
- [ ] Login as provider (`provider@test.com` / `Test1234!`)
- [ ] View provider profile at `/dashboard/provider/profile`
- [ ] Update provider profile and save
- [ ] Test password reset flow
- [ ] Create new expat account via registration
- [ ] Create new provider account via registration
