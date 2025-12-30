# Fix Login Issue - Create Test Accounts

The test account doesn't exist yet. Here are 3 ways to create it:

---

## ✅ METHOD 1: Register Through Browser (EASIEST)

This is the fastest and most reliable method:

### Step 1: Start Your Dev Server
```bash
npm run dev
```

### Step 2: Register New Account
1. Go to: **http://localhost:3000/register**
2. Select: **Expat**
3. Fill in:
   - Name: `Test Expat`
   - Email: `expat@test.com`
   - Password: `Test1234!`
   - Confirm Password: `Test1234!`
   - Check: "I agree to Terms and Privacy"
4. Click **"Create account"**

### Step 3: Verify Email (Skip for Testing)

Open Supabase SQL Editor and run:

```sql
UPDATE users
SET email_verified = true,
    verification_token = null,
    verification_token_expires = null
WHERE email = 'expat@test.com';
```

### Step 4: Login
1. Go to: **http://localhost:3000/login**
2. Email: `expat@test.com`
3. Password: `Test1234!`
4. Click **"Sign in"**

✅ You should be redirected to `/dashboard/expat`

---

## 🔧 METHOD 2: Use SQL Script (Advanced)

**Problem with this method:** The password hash in the SQL file needs to be generated correctly.

### Generate Password Hash First

Run this in your terminal:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('Test1234!', 10));"
```

This will output something like:
```
$2a$10$abc123...
```

### Update SQL File

1. Open `CREATE_TEST_ACCOUNTS.sql`
2. Replace ALL instances of the password_hash with your generated hash
3. Run the SQL in Supabase SQL Editor

---

## 🚀 METHOD 3: Use Node.js Script

Create and run this script:

```bash
cat > create-test-user.js << 'EOF'
const bcrypt = require('bcryptjs');

async function createHash() {
  const hash = await bcrypt.hash('Test1234!', 10);
  console.log('\nGenerated password hash for Test1234!:');
  console.log(hash);
  console.log('\nCopy this hash and use it in the SQL INSERT statement.');
}

createHash();
EOF

node create-test-user.js
```

Then use the hash in Supabase SQL Editor.

---

## 🐛 Troubleshooting Login Issues

### Issue: "Invalid email or password"

**Possible causes:**
1. Account doesn't exist
2. Password is incorrect
3. Account is not active
4. Email is not verified

**Check account status:**

```sql
SELECT
  email,
  name,
  role,
  email_verified,
  is_active,
  created_at
FROM users
WHERE email = 'expat@test.com';
```

**Fix inactive account:**

```sql
UPDATE users
SET is_active = true,
    email_verified = true
WHERE email = 'expat@test.com';
```

### Issue: "Account is disabled"

**Fix:**
```sql
UPDATE users
SET is_active = true
WHERE email = 'expat@test.com';
```

### Issue: 404 on dashboard

This should be fixed now. After login:
- Expats go to: `/dashboard/expat`
- Providers go to: `/dashboard/provider`

### Issue: Password hash doesn't work

The password hash must be generated with bcryptjs and 10 rounds.

**Correct way to generate:**

```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('Test1234!', 10);
console.log(hash);
```

---

## ✨ Quick Fix Commands

### Delete existing test account and start fresh:

```sql
-- Delete existing accounts
DELETE FROM expat_profiles WHERE id IN (SELECT id FROM users WHERE email = 'expat@test.com');
DELETE FROM users WHERE email = 'expat@test.com';

DELETE FROM provider_profiles WHERE id IN (SELECT id FROM users WHERE email = 'provider@test.com');
DELETE FROM users WHERE email = 'provider@test.com';
```

Then use **METHOD 1** (register through browser) to create fresh accounts.

---

## 🎯 Recommended Solution

**Just use the registration form!**

1. Go to http://localhost:3000/register
2. Register as expat with `expat@test.com` / `Test1234!`
3. Skip email verification with SQL query
4. Login

This is the most reliable method because:
- ✅ Password is hashed correctly
- ✅ User and profile are created properly
- ✅ All fields are set correctly
- ✅ No manual hash generation needed

---

## 📧 Test Credentials

After creating accounts:

**Expat:**
- Email: `expat@test.com`
- Password: `Test1234!`
- Dashboard: http://localhost:3000/dashboard/expat

**Provider:**
- Email: `provider@test.com`
- Password: `Test1234!`
- Dashboard: http://localhost:3000/dashboard/provider

---

## 🔍 Verify Login Works

After creating account, test:

```bash
# Check server is running
curl http://localhost:3000/api/health

# Try login flow
# Open browser: http://localhost:3000/login
# Enter: expat@test.com / Test1234!
```

If login succeeds, you'll be redirected to `/dashboard/expat` ✅
