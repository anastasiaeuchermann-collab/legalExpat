# LegalExpat

A modern marketplace platform connecting expats in Germany with verified legal service providers. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Overview

LegalExpat simplifies the process of finding and booking legal services for expats living in Germany. Whether you need help with immigration, tax matters, employment law, or other legal services, our platform connects you with qualified professionals who understand your unique needs.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Deployment**: Vercel (recommended)

## Features

### For Expats (Clients)
- Browse verified legal service providers
- Filter by specialization, language, and location
- Book consultations and services
- Secure payment processing
- Rate and review providers
- Messaging system for communication

### For Legal Providers
- Create and manage professional profile
- List services with pricing
- Manage availability and bookings
- Receive payments securely
- Build reputation through reviews
- Client communication tools

### Admin Features
- User verification and management
- Platform analytics
- Payment oversight
- Content moderation

## Project Structure

```
legalExpat/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Auth-related pages (grouped route)
│   │   ├── login/               # Login page
│   │   ├── register/            # Registration page
│   │   └── verify/              # Email verification page
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── expat/              # Expat dashboard
│   │   └── provider/           # Provider dashboard
│   ├── (marketplace)/           # Public marketplace pages
│   │   ├── providers/          # Provider listings
│   │   └── services/           # Service listings
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── bookings/           # Booking management
│   │   ├── providers/          # Provider CRUD operations
│   │   ├── payments/           # Stripe integration
│   │   └── users/              # User management
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
│
├── components/                  # React components
│   ├── ui/                     # Reusable UI components
│   │   └── Button.tsx          # Button component
│   ├── layout/                 # Layout components
│   │   └── Header.tsx          # Header component
│   └── features/               # Feature-specific components
│       ├── auth/               # Authentication components
│       ├── bookings/           # Booking components
│       ├── providers/          # Provider components
│       ├── payments/           # Payment components
│       └── profile/            # Profile components
│
├── lib/                        # Utility libraries and configurations
│   ├── auth/                   # Authentication configuration
│   │   └── auth.config.ts      # NextAuth configuration
│   ├── db/                     # Database utilities
│   │   └── supabase.ts         # Supabase client
│   ├── stripe/                 # Stripe configuration
│   │   └── config.ts           # Stripe client setup
│   └── utils/                  # General utilities
│       ├── constants.ts        # App constants
│       └── helpers.ts          # Helper functions
│
├── types/                      # TypeScript type definitions
│   └── index.ts               # Shared types
│
├── public/                     # Static assets
│   ├── images/                # Image files
│   └── icons/                 # Icon files
│
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── next.config.js             # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Project dependencies

```

## Architecture

### Authentication Flow

1. **User Registration**: Users register as either expats or providers
2. **Email Verification**: Optional email verification via NextAuth
3. **Session Management**: JWT-based sessions managed by NextAuth
4. **Role-Based Access**: Different permissions for expats, providers, and admins

### Database Schema

The application uses PostgreSQL via Supabase with the following main tables:

- **users**: Core user information
- **expat_profiles**: Extended profile data for expats
- **provider_profiles**: Professional profiles for legal service providers
- **services**: Service listings created by providers
- **bookings**: Consultation and service bookings
- **payments**: Payment records linked to Stripe
- **reviews**: Provider ratings and reviews
- **messages**: Direct messaging between users

### Payment Flow

1. **Service Selection**: Expat selects a service and time slot
2. **Booking Creation**: System creates a pending booking
3. **Payment Intent**: Stripe payment intent is created
4. **Payment Processing**: User completes payment via Stripe
5. **Webhook Handling**: Stripe webhook confirms payment
6. **Booking Confirmation**: Booking status updated to confirmed

### API Routes

All API routes follow RESTful conventions:

- `GET /api/providers`: List all providers (with filtering)
- `GET /api/providers/[id]`: Get provider details
- `POST /api/bookings`: Create a new booking
- `GET /api/bookings/[id]`: Get booking details
- `POST /api/payments/create-intent`: Create Stripe payment intent
- `POST /api/payments/webhook`: Handle Stripe webhooks

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Supabase account)
- Stripe account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd legalExpat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your credentials:
   - Supabase URL and keys
   - NextAuth secret
   - Stripe API keys

4. **Set up the database**

   Run the Supabase migrations to set up your database schema:

   ```bash
   # Using Supabase CLI
   supabase link --project-ref your-project-ref
   supabase db push
   ```

   Or manually run each migration file in the `supabase/migrations/` directory through the Supabase dashboard SQL editor.

   See `/supabase/README.md` for detailed migration instructions.

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run type-check`: Run TypeScript type checking

### Code Style

- Use TypeScript for type safety
- Follow the existing component structure
- Use Tailwind CSS for styling
- Keep components small and focused
- Write meaningful commit messages

### Adding New Features

1. Create types in `types/index.ts`
2. Build UI components in `components/`
3. Create API routes in `app/api/`
4. Add page routes in appropriate `app/` subdirectories
5. Update this README if needed

## Database Setup

The complete database schema is managed through Supabase migrations in the `/supabase/migrations/` directory.

### Schema Overview

The database includes the following main entities:

**Users & Profiles**
- Users (base table for all user types)
- Expat Profiles (extended info for clients)
- Provider Profiles (extended info for legal experts)
- Provider Availability & Blocked Dates

**Services**
- Service Categories (13 predefined categories)
- Services (provider service listings)
- Service Pricing Tiers (for tiered pricing)
- Service Tags (30+ tags for filtering)

**Bookings & Documents**
- Bookings (with complete status workflow)
- Booking Documents (file uploads)
- Booking Status History (audit trail)

**Payments**
- Payments (Stripe integration)
- Payment Events (webhook handling)
- Refunds
- Provider Payouts (escrow system)

**Communication**
- Reviews (with helpful votes)
- Message Threads
- Messages (with attachments)

### Running Migrations

See `/supabase/README.md` for detailed instructions on:
- Running migrations with Supabase CLI
- Row Level Security (RLS) policies
- Database indexes and performance optimization
- Seed data for service categories and tags

### TypeScript Types

Type-safe database types are available in `/types/database.ts` matching the complete schema.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Environment Variables

Ensure all environment variables from `.env.example` are set in your deployment platform.

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens for session management
- CSRF protection enabled
- Input validation using Zod
- SQL injection prevention via Supabase
- Stripe webhook signature verification
- Role-based access control (RBAC)

## Future Enhancements

- [ ] Real-time messaging with WebSockets
- [ ] Video consultation integration
- [ ] Multi-language support (i18n)
- [ ] Mobile app (React Native)
- [ ] Advanced search with Elasticsearch
- [ ] Email notifications
- [ ] SMS reminders for bookings
- [ ] Document sharing and storage
- [ ] Calendar integration (Google, Outlook)
- [ ] Analytics dashboard

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@legalexpat.com or open an issue in the GitHub repository.

## Acknowledgments

- Next.js team for the amazing framework
- Supabase for the database platform
- Stripe for payment processing
- Vercel for hosting

---

Built with ❤️ for the expat community in Germany
