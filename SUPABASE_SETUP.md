# Supabase Setup Guide for LegalExpat

This guide walks you through setting up Supabase for the LegalExpat platform, including database migrations, authentication, storage, and RLS policies.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create a Supabase Project](#create-a-supabase-project)
3. [Configure Environment Variables](#configure-environment-variables)
4. [Run Database Migrations](#run-database-migrations)
5. [Set Up Authentication](#set-up-authentication)
6. [Configure Storage Buckets](#configure-storage-buckets)
7. [Test RLS Policies](#test-rls-policies)
8. [Integration with NextAuth](#integration-with-nextauth)
9. [Troubleshooting](#troubleshooting)
10. [Production Checklist](#production-checklist)

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git
- A Supabase account (free tier is fine for development)

## Create a Supabase Project

### Step 1: Sign Up / Log In

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign In"
3. Create an account or log in with GitHub

### Step 2: Create a New Project

1. Click "New Project"
2. Choose your organization (or create one)
3. Fill in the project details:
   - **Name**: `legalexpat` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., `eu-central-1` for Germany)
   - **Pricing Plan**: Free tier is fine for development

4. Click "Create new project"
5. Wait 2-3 minutes for project initialization

### Step 3: Get Your API Keys

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click on **API** in the left menu
3. You'll see:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **anon/public key**: `eyJhbGc...` (safe for browser)
   - **service_role key**: `eyJhbGc...` (secret, server-only!)

4. Keep this page open - you'll need these values next

## Configure Environment Variables

### Step 1: Copy Example Environment File

```bash
cp .env.example .env
```

### Step 2: Fill in Supabase Variables

Edit `.env` and add your Supabase credentials:

```bash
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 3: Get Database URL (Optional)

For direct database access:

1. In Supabase dashboard, go to **Project Settings** > **Database**
2. Scroll to **Connection string** > **URI**
3. Copy the connection string
4. Replace `[YOUR-PASSWORD]` with your database password
5. Add to `.env`:

```bash
DATABASE_URL=postgresql://postgres:your_password@db.your-project-ref.supabase.co:5432/postgres
```

### Step 4: Generate NextAuth Secret

Generate a secure secret for NextAuth:

```bash
openssl rand -base64 32
```

Add it to `.env`:

```bash
NEXTAUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=http://localhost:3000
```

## Run Database Migrations

### Option 1: Using Supabase CLI (Recommended)

#### Install Supabase CLI

```bash
npm install -g supabase
```

#### Login to Supabase

```bash
supabase login
```

This will open your browser for authentication.

#### Link to Your Project

```bash
supabase link --project-ref your-project-ref
```

Get your project ref from the Project Settings > General page.

#### Run Migrations

```bash
supabase db push
```

This will run all migration files in `supabase/migrations/` in order.

#### Verify Migrations

```bash
supabase db diff
```

Should show no differences if migrations were successful.

### Option 2: Using Supabase Dashboard

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **+ New query**
3. Open each migration file from `supabase/migrations/` in order:
   - `20240101000001_create_users_and_profiles.sql`
   - `20240101000002_create_services.sql`
   - `20240101000003_create_bookings.sql`
   - `20240101000004_create_payments.sql`
   - `20240101000005_create_reviews_and_messages.sql`
   - `20240101000006_create_rls_policies.sql`
   - `20240101000007_create_indexes.sql`
   - `20240101000008_seed_data.sql`
   - `20240101000009_update_rls_for_nextauth.sql`

4. Copy the contents of each file
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Verify no errors appear
8. Repeat for all migration files

### Option 3: Using Database Connection

If you have `psql` installed:

```bash
psql $DATABASE_URL < supabase/migrations/20240101000001_create_users_and_profiles.sql
psql $DATABASE_URL < supabase/migrations/20240101000002_create_services.sql
# ... repeat for all migration files
```

### Verify Tables

After running migrations, verify tables were created:

1. Go to **Table Editor** in Supabase dashboard
2. You should see tables like:
   - users
   - expat_profiles
   - provider_profiles
   - services
   - bookings
   - payments
   - reviews
   - messages
   - etc.

## Set Up Authentication

### Using NextAuth (Current Setup)

LegalExpat uses NextAuth for authentication, which stores user data in Supabase but manages sessions independently.

#### How It Works

1. User credentials are stored in the `users` table in Supabase
2. NextAuth handles login, session management, and JWT tokens
3. Supabase is used as the database, not for auth

#### Benefits

- Full control over auth flow
- Easy to customize
- Works with any OAuth providers
- Familiar Next.js patterns

#### No Additional Setup Required

Authentication is already configured! Just make sure:
- ✅ Migrations have been run (creates `users` table)
- ✅ `NEXTAUTH_SECRET` is set in `.env`
- ✅ `NEXTAUTH_URL` is set correctly

### Alternative: Supabase Auth (Not Configured)

If you want to use Supabase Auth instead:

1. Enable email auth in **Authentication** > **Providers**
2. Configure email templates
3. Update auth logic to use Supabase Auth instead of NextAuth
4. This requires significant code changes

## Configure Storage Buckets

Supabase Storage is used for file uploads (avatars, documents, attachments).

### Step 1: Create Storage Buckets

1. Go to **Storage** in Supabase dashboard
2. Click **Create a new bucket**
3. Create three buckets:

#### Avatars Bucket
- **Name**: `avatars`
- **Public**: ✅ Yes
- **File size limit**: 2 MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

#### Documents Bucket
- **Name**: `documents`
- **Public**: ❌ No (private)
- **File size limit**: 10 MB
- **Allowed MIME types**: `application/pdf, image/jpeg, image/png`

#### Attachments Bucket
- **Name**: `attachments`
- **Public**: ❌ No (private)
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/*, application/pdf`

### Step 2: Set Up Storage Policies

For each bucket, set up RLS policies:

#### Avatars Bucket Policies

```sql
-- Allow anyone to view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
```

**Note**: If using NextAuth, you'll need to modify these policies or handle file uploads via API routes with proper authentication.

#### Documents Bucket Policies

```sql
-- Users can view documents they own or are shared with
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can upload documents
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');
```

### Step 3: Update Environment Variables

Bucket names are already in `.env.example`:

```bash
NEXT_PUBLIC_AVATARS_BUCKET=avatars
NEXT_PUBLIC_DOCUMENTS_BUCKET=documents
NEXT_PUBLIC_ATTACHMENTS_BUCKET=attachments
```

## Test RLS Policies

### Understanding RLS with NextAuth

Since we're using NextAuth (not Supabase Auth), RLS works differently:

**Two approaches:**

1. **Use Service Role Key** (Recommended)
   - Use `supabaseAdmin` client for authenticated operations
   - Implement authorization in your API routes
   - RLS is bypassed
   - More control and easier to debug

2. **Custom RLS with Session Variables**
   - Set user context before queries
   - RLS policies check session variables
   - More complex but maintains RLS benefits

### Testing with Service Role (Approach 1)

This is the recommended approach. Test in your API routes:

```typescript
// app/api/test-auth/route.ts
import { requireAuth } from '@/lib/auth/helpers';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  // Verify user is authenticated
  const user = await requireAuth();

  // Use admin client with proper authorization checks
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .eq('expat_id', user.id);  // Filter by user ID

  return Response.json({ data, error });
}
```

### Testing Custom RLS (Approach 2)

If you want to use custom RLS:

```typescript
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/helpers';

export async function GET() {
  const user = await getCurrentUser();
  const supabase = createServerClient();

  // Set auth context
  await supabase.rpc('set_auth_context', {
    p_user_id: user.id,
    p_user_role: user.role
  });

  // Now RLS policies will work
  const { data } = await supabase
    .from('bookings')
    .select('*');  // RLS automatically filters

  return Response.json({ data });
}
```

### Manual Testing in SQL Editor

Test RLS policies directly:

```sql
-- Set mock auth context
SELECT set_auth_context(
    '00000000-0000-0000-0000-000000000001'::uuid,
    'expat'
);

-- Test query (should only return user's bookings)
SELECT * FROM bookings;

-- Clear context
SELECT clear_auth_context();
```

## Integration with NextAuth

### How It Works

1. **User Registration** → Creates user in `users` table via API route
2. **Login** → NextAuth validates credentials against Supabase
3. **Session** → JWT stored in HTTP-only cookie
4. **Authorization** → Check user role/permissions in API routes
5. **Database Operations** → Use `supabaseAdmin` with manual authorization

### Key Files

- `lib/auth/auth.config.ts` - NextAuth configuration
- `lib/auth/helpers.ts` - Auth helper functions
- `lib/supabase/admin.ts` - Admin client for DB operations
- `lib/supabase/server.ts` - Server client for API routes
- `lib/supabase/client.ts` - Browser client for public data

### Example: Protected API Route

```typescript
import { requireAuth, checkUserRole } from '@/lib/auth/helpers';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  // Require authentication
  const user = await requireAuth();

  // Check authorization
  if (user.role !== 'provider') {
    return new Response('Forbidden', { status: 403 });
  }

  // Perform database operation
  const body = await req.json();
  const { data, error } = await supabaseAdmin
    .from('services')
    .insert({
      ...body,
      provider_id: user.id  // Ensure user owns the resource
    });

  return Response.json({ data, error });
}
```

## Troubleshooting

### Common Issues

#### 1. "Missing NEXTAUTH_SECRET"

**Solution**: Generate a secret and add to `.env`:
```bash
openssl rand -base64 32
```

#### 2. Migration Fails with "relation already exists"

**Solution**: Migration was partially applied. Either:
- Drop the existing table and re-run
- Skip to the next migration

```sql
-- Check which tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

#### 3. RLS Denies Access

**Symptoms**: Queries return empty results even though data exists

**Solutions**:
- Use `supabaseAdmin` instead of regular client
- Check if auth context is set correctly
- Verify user ID matches the data owner

#### 4. "Failed to fetch" in Browser

**Solutions**:
- Check `NEXT_PUBLIC_SUPABASE_URL` is set correctly
- Verify CORS settings in Supabase dashboard
- Check Network tab for actual error

#### 5. Storage Upload Fails

**Solutions**:
- Verify bucket exists and is spelled correctly
- Check file size limits
- Ensure proper MIME types
- Verify storage policies allow the operation

### Debug Mode

Enable debug logging:

```bash
# .env
DEBUG=true
NODE_ENV=development
```

### Check Database Connection

```typescript
// Test database connection
import { supabaseAdmin } from '@/lib/supabase/admin';

const { data, error } = await supabaseAdmin
  .from('users')
  .select('count');

console.log('Connection test:', { data, error });
```

## Production Checklist

Before deploying to production:

### Security

- [ ] Remove demo admin user from database
- [ ] Change all default passwords
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is not exposed to browser
- [ ] Enable API rate limiting in Supabase dashboard
- [ ] Set up proper CORS origins
- [ ] Enable database backups
- [ ] Review all RLS policies

### Environment Variables

- [ ] Set all environment variables in production
- [ ] Use different Supabase project for production
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Use production Stripe keys
- [ ] Set up proper database connection pooling

### Database

- [ ] Run all migrations on production database
- [ ] Set up automated backups (Supabase Pro plan)
- [ ] Monitor database size and performance
- [ ] Set up database alerts
- [ ] Review and optimize indexes

### Storage

- [ ] Configure CDN for public buckets
- [ ] Set proper file size limits
- [ ] Enable image optimization
- [ ] Set up storage policies for production data

### Monitoring

- [ ] Enable Supabase logging
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Monitor API usage and quotas
- [ ] Set up uptime monitoring
- [ ] Configure alerts for errors

### Performance

- [ ] Enable connection pooling
- [ ] Review slow queries
- [ ] Optimize database indexes
- [ ] Enable caching where appropriate
- [ ] Use CDN for static assets

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)

## Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Review Supabase docs
3. Check the project README.md
4. Open an issue in the repository
5. Join Supabase Discord community

## Next Steps

After completing this setup:

1. ✅ Test user registration and login
2. ✅ Create test provider profiles
3. ✅ Test service listings
4. ✅ Test booking flow
5. ✅ Verify file uploads work
6. ✅ Check payment integration
7. ✅ Review security settings

You're now ready to develop LegalExpat! 🚀
