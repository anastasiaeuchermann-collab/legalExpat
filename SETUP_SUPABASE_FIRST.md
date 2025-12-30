# ⚠️ CRITICAL: Set Up Supabase Before Testing

## 🚨 The Problem

Your `.env.local` file has **placeholder** Supabase credentials. The app cannot connect to a database, which is why registration fails with "Failed to create user".

---

## ✅ SOLUTION: Set Up Real Supabase Project (10 Minutes)

### **Step 1: Create Supabase Account**

1. Go to: **https://app.supabase.com/**
2. Click **"Start your project"**
3. Sign up with GitHub, Google, or email

### **Step 2: Create New Project**

1. Click **"New Project"**
2. Fill in:
   - **Name:** LegalExpat (or any name)
   - **Database Password:** Choose a strong password (save it!)
   - **Region:** Choose closest to you
3. Click **"Create new project"**
4. ⏳ Wait 1-2 minutes for project to be created

### **Step 3: Get Your Credentials**

Once the project is ready:

1. In Supabase dashboard, click **"Settings"** (⚙️ icon at bottom left)
2. Click **"API"** in the settings menu
3. You'll see:
   - **Project URL** - Copy this
   - **anon public** key - Copy this
   - **service_role secret** key - Copy this (click "Reveal" first)

### **Step 4: Update `.env.local` File**

Open your `.env.local` file and **replace** the placeholder values:

```env
# DATABASE (SUPABASE) - REQUIRED
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-real-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-real-service-role-key
```

**Replace:**
- `https://your-project-ref.supabase.co` → Your Project URL
- `your-real-anon-key` → Your anon public key
- `your-real-service-role-key` → Your service_role secret key

### **Step 5: Set Up Database Schema**

In Supabase dashboard:

1. Click **"SQL Editor"** in left sidebar
2. Click **"New Query"**
3. Open the file: `supabase/migrations/20240101000001_create_users_and_profiles.sql`
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click **"Run"** button

✅ Wait for "Success" message

**Repeat for ALL migration files in order:**
- `20240101000001_create_users_and_profiles.sql`
- `20240101000002_create_services.sql`
- `20240101000003_create_bookings.sql`
- `20240101000004_create_payments.sql`
- `20240101000005_create_reviews_and_messages.sql`
- `20240101000006_create_rls_policies.sql`
- `20240101000007_create_indexes.sql`
- `20240101000008_seed_data.sql`
- `20240101000009_update_rls_for_nextauth.sql`

### **Step 6: Restart Your Dev Server**

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### **Step 7: Test Registration Again**

1. Go to: **http://localhost:3000/register**
2. Fill the form:
   - Name: Test Expat
   - Email: expat@test.com
   - Password: Test1234!
3. Click **"Create account"**

✅ **It should work now!**

---

## 🔍 Verify Connection

Test if Supabase is connected:

```bash
curl http://localhost:3000/api/health
```

Should return: `{"status":"ok"}`

---

## 📝 Quick Reference

**Where to find Supabase credentials:**
1. https://app.supabase.com/
2. Select your project
3. Settings → API
4. Copy Project URL and API keys

**Migration files location:**
- In your project: `supabase/migrations/`
- Run them in Supabase SQL Editor in numerical order

**Environment file location:**
- `.env.local` (in project root)

---

## 🐛 Still Having Issues?

### Error: "Failed to create user"
- ✅ Check `.env.local` has real Supabase credentials (not placeholders)
- ✅ Check all migrations ran successfully
- ✅ Restart dev server after updating `.env.local`

### Error: "relation 'users' does not exist"
- ✅ Run the migration files in Supabase SQL Editor

### Error: Connection timeout
- ✅ Check your Supabase project is active (not paused)
- ✅ Check internet connection
- ✅ Verify Project URL is correct

---

## 🎯 Summary Checklist

- [ ] Created Supabase account
- [ ] Created new project
- [ ] Copied Project URL, anon key, and service_role key
- [ ] Updated `.env.local` with real credentials
- [ ] Ran all 9 migration files in Supabase SQL Editor
- [ ] Restarted dev server
- [ ] Tested registration at `/register`

**Once done, registration will work perfectly!** ✅
