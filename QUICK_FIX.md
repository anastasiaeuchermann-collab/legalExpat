# 🚀 QUICK FIX - Create Test Account NOW

## The Issue
The test account `expat@test.com` doesn't exist in your database yet.

## ✅ FASTEST SOLUTION (2 Minutes)

### Step 1: Start Dev Server
```bash
npm run dev
```

Wait for: `✓ Ready in X.Xs`

### Step 2: Register Account
Open browser: **http://localhost:3000/register**

Fill the form:
- Select: **Expat** (click the Expat button)
- Name: `Test Expat`
- Email: `expat@test.com`
- Password: `Test1234!`
- Confirm Password: `Test1234!`
- ✓ Check "I agree to Terms and Privacy"
- Click **"Create account"**

### Step 3: Skip Email Verification

Open Supabase: https://app.supabase.com/
- Go to your project
- Click **"SQL Editor"**
- Click **"New Query"**
- Paste this:

```sql
UPDATE users
SET email_verified = true,
    verification_token = null,
    verification_token_expires = null
WHERE email = 'expat@test.com';
```

- Click **"Run"**

### Step 4: Login & Test
Go to: **http://localhost:3000/login**

Login with:
- Email: `expat@test.com`
- Password: `Test1234!`

✅ **You should be redirected to `/dashboard/expat`**

---

## 🎯 Alternative: Create Both Test Accounts

Repeat the same process for provider:

1. Register at `/register`
2. Select: **Legal Expert**
3. Email: `provider@test.com`
4. Password: `Test1234!`
5. Skip verification (same SQL, different email)
6. Approve provider account:

```sql
UPDATE users
SET is_active = true,
    email_verified = true
WHERE email = 'provider@test.com';

UPDATE provider_profiles
SET verification_status = 'verified'
WHERE id = (SELECT id FROM users WHERE email = 'provider@test.com');
```

---

## 📝 Summary

**The registration form is the best way** because:
- ✅ It hashes the password correctly
- ✅ It creates all necessary database records
- ✅ It's faster than SQL scripts
- ✅ No manual work needed

Just:
1. `npm run dev`
2. Register at `/register`
3. Skip verification in Supabase
4. Login at `/login`

**Done!** 🎉
