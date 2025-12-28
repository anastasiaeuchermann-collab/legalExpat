# LegalExpat - Setup & Running Instructions

## 📦 What's Inside

LegalExpat is a Next.js marketplace connecting expats in Germany with legal service providers. This package includes:

- ✅ Full Next.js 14 application with App Router
- ✅ Authentication system (NextAuth.js)
- ✅ Supabase database integration
- ✅ User registration & onboarding flows
- ✅ Profile management for expats and providers
- ✅ Ready-to-use test accounts
- ✅ Comprehensive documentation

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites

Make sure you have these installed:
- **Node.js** 18.x or higher ([Download here](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Supabase Account** (free tier works fine)

Check your versions:
```bash
node --version  # Should be v18.x or higher
npm --version   # Should be 9.x or higher
```

### Step 1: Extract the Zip

```bash
# Extract the zip file
unzip legalexpat.zip

# Navigate to the project
cd legalExpat
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages (~2-3 minutes).

### Step 3: Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# On macOS/Linux:
touch .env.local

# On Windows (PowerShell):
New-Item .env.local
```

Open `.env.local` and add your configuration:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-min-32-chars

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Where to get these values:**

1. **Supabase Keys:**
   - Go to [Supabase Dashboard](https://app.supabase.com/)
   - Select your project (or create new one)
   - Go to Settings → API
   - Copy:
     - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY`

2. **NextAuth Secret:**
   Generate a random string:
   ```bash
   # macOS/Linux:
   openssl rand -base64 32

   # Or use this online: https://generate-secret.vercel.app/32
   ```

3. **Google OAuth (Optional):**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add `http://localhost:3000/api/auth/callback/google` as redirect URI

### Step 4: Set Up Supabase Database

You need to run the database schema. The schema files are in `supabase/migrations/`:

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the SQL from `supabase/migrations/20240101000000_initial_schema.sql`
5. Click "Run"

**Option B: Using Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Step 5: Start the Development Server

```bash
npm run dev
```

The app will start at **http://localhost:3000**

You should see:
```
✓ Ready in 2.5s
○ Local: http://localhost:3000
```

---

## 🎯 Testing the Application

### Option 1: Create Test Accounts Through Browser

1. **Open the app:**
   ```
   http://localhost:3000
   ```

2. **Register as Expat:**
   - Click "Get Started" or go to `/register`
   - Select "Expat"
   - Fill in details:
     - Name: Test Expat
     - Email: expat@test.com
     - Password: Test1234!
   - Submit

3. **Skip Email Verification (for testing):**

   Run this in Supabase SQL Editor:
   ```sql
   UPDATE users
   SET email_verified = true,
       verification_token = null,
       verification_token_expires = null
   WHERE email = 'expat@test.com';
   ```

4. **Login and Complete Onboarding:**
   - Login at `/login`
   - Complete the onboarding form
   - You'll be redirected to dashboard

5. **Repeat for Provider Account:**
   - Register with email: provider@test.com
   - After onboarding, approve the provider:
   ```sql
   UPDATE users
   SET is_active = true
   WHERE email = 'provider@test.com';

   UPDATE provider_profiles
   SET verification_status = 'verified'
   WHERE id = (SELECT id FROM users WHERE email = 'provider@test.com');
   ```

### Option 2: Use Pre-configured Test Accounts

See `TEST_ACCOUNTS_SETUP.md` for detailed instructions on setting up test accounts.

---

## 📁 Project Structure

```
legalExpat/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── onboarding/
│   │   └── verify-email/
│   ├── (dashboard)/              # Dashboard pages
│   │   ├── expat/profile/
│   │   └── provider/profile/
│   ├── api/                      # API routes
│   │   ├── auth/                 # Auth endpoints
│   │   └── users/                # User management
│   └── page.tsx                  # Homepage
├── components/                   # React components
│   └── ui/                       # UI components
├── lib/                          # Utilities & config
│   ├── auth/                     # NextAuth config
│   ├── supabase/                 # Supabase client
│   ├── validations/              # Zod schemas
│   └── utils/                    # Helper functions
├── scripts/                      # Utility scripts
│   └── seed-test-accounts.ts    # Test account seeder
├── supabase/                     # Database migrations
│   └── migrations/
├── .env.local                    # Environment variables (you create this)
├── package.json                  # Dependencies
├── USER_FLOWS.md                 # Complete user flow guide
├── TEST_ACCOUNTS_SETUP.md        # Test account setup guide
└── README.md                     # This file
```

---

## 🛠️ Available Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript types

# Testing & Seeding
npm run seed-test        # Create test accounts (requires .env.local)
```

---

## 📚 Key Features & Pages

### Public Pages
- **/** - Homepage with hero section
- **/register** - User registration (expat or provider)
- **/login** - User login
- **/forgot-password** - Password reset request
- **/reset-password** - Password reset form

### Expat Dashboard
- **/dashboard/expat/profile** - Profile management
  - Personal information
  - Location & residence status
  - Language preferences
  - Profile photo upload

### Provider Dashboard
- **/dashboard/provider/profile** - Professional profile
  - Professional details
  - Specializations (7 legal areas)
  - Languages with proficiency levels
  - Availability & pricing
  - Verification status

### API Endpoints
- **POST /api/auth/register** - Create new account
- **POST /api/auth/login** - User login
- **GET/PUT /api/users/profile** - Profile management
- **POST /api/users/avatar** - Avatar upload

---

## 🔧 Configuration Details

### Database Schema

The app uses Supabase PostgreSQL with these main tables:

- `users` - User accounts
- `expat_profiles` - Expat profile data
- `provider_profiles` - Provider profile data
- `bookings` - Service bookings (to be implemented)
- `reviews` - User reviews (to be implemented)
- `payments` - Payment records (to be implemented)

### Authentication

- NextAuth.js with credentials provider
- Email/password authentication
- Google OAuth (optional)
- Session-based authentication
- Role-based access control (expat/provider)

### Validation

All forms use Zod schemas for validation:
- `lib/validations/auth.ts` - Auth forms
- `lib/validations/profile.ts` - Profile forms

---

## 🐛 Troubleshooting

### Port 3000 Already in Use

```bash
# Find and kill the process
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows (PowerShell):
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Or use a different port:
PORT=3001 npm run dev
```

### "Module not found" Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Supabase Connection Errors

1. Check `.env.local` has correct values
2. Verify Supabase project is active
3. Check Supabase API keys are correct
4. Restart dev server after changing `.env.local`

### Database Schema Errors

Make sure you've run the database migrations in Supabase SQL Editor.

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

---

## 📖 Documentation

- **USER_FLOWS.md** - Complete user journey documentation
- **TEST_ACCOUNTS_SETUP.md** - Multiple methods to create test accounts
- **supabase/migrations/** - Database schema and migrations

---

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Connect your GitHub repository
   - Add environment variables from `.env.local`
   - Deploy!

3. **Update Environment Variables:**
   - Change `NEXTAUTH_URL` to your Vercel domain
   - Update Google OAuth redirect URIs if using

### Deploy to Other Platforms

The app can be deployed to:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Railway
- Render

Just ensure Node.js 18+ is supported and add environment variables.

---

## 🔐 Security Notes

- Never commit `.env.local` to version control
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- Rotate `NEXTAUTH_SECRET` in production
- Use HTTPS in production
- Enable RLS (Row Level Security) in Supabase

---

## 💡 Next Steps

After getting the app running:

1. ✅ Create test accounts
2. ✅ Test registration flows
3. ✅ Test profile management
4. 📝 Customize branding and styles
5. 📝 Add more features (booking, payments, etc.)
6. 📝 Deploy to production

---

## 🆘 Getting Help

- **Documentation:** See `USER_FLOWS.md` and `TEST_ACCOUNTS_SETUP.md`
- **Issues:** Check the troubleshooting section above
- **Database:** Check Supabase dashboard logs
- **API Errors:** Check browser console and terminal output

---

## 📝 Environment Variables Checklist

Before running the app, make sure you have:

- [ ] Created `.env.local` file
- [ ] Added `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Added `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Added `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Added `NEXTAUTH_URL` (http://localhost:3000)
- [ ] Added `NEXTAUTH_SECRET` (32+ character random string)
- [ ] (Optional) Added Google OAuth credentials
- [ ] Restarted dev server after adding variables

---

## 🎉 You're All Set!

Your LegalExpat application should now be running at:
**http://localhost:3000**

Happy coding! 🚀
