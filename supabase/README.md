# LegalExpat Database Migrations

This directory contains PostgreSQL migrations for the LegalExpat platform using Supabase.

## Migration Files

The migrations are numbered and must be run in order:

1. **20240101000001_create_users_and_profiles.sql** - User accounts and profile tables
2. **20240101000002_create_services.sql** - Service categories and listings
3. **20240101000003_create_bookings.sql** - Booking and appointment system
4. **20240101000004_create_payments.sql** - Payment processing with Stripe
5. **20240101000005_create_reviews_and_messages.sql** - Reviews and messaging system
6. **20240101000006_create_rls_policies.sql** - Row Level Security policies
7. **20240101000007_create_indexes.sql** - Database indexes for performance
8. **20240101000008_seed_data.sql** - Initial seed data

## How to Run Migrations

### Option 1: Using Supabase CLI (Recommended)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link to your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Run migrations:
   ```bash
   supabase db push
   ```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste each migration file content in order
4. Execute each migration

### Option 3: Using SQL Client

Connect to your Supabase database using your preferred SQL client and run each migration file in order.

## Database Schema Overview

### Core Tables

#### Users & Profiles
- `users` - Base user table for all roles
- `expat_profiles` - Extended profile for expat clients
- `provider_profiles` - Extended profile for legal providers
- `provider_availability` - Weekly availability schedule
- `provider_blocked_dates` - Blocked dates for providers

#### Services
- `service_categories` - Service category reference data
- `services` - Service listings by providers
- `service_pricing_tiers` - Tiered pricing options
- `service_tags` - Tags for filtering services
- `service_tags_mapping` - Many-to-many relationship

#### Bookings
- `bookings` - Service bookings/appointments
- `booking_documents` - Documents uploaded for bookings
- `booking_status_history` - Audit trail for status changes

#### Payments
- `payments` - Payment transactions via Stripe
- `payment_events` - Stripe webhook events
- `refunds` - Refund transactions
- `provider_payouts` - Payouts to providers

#### Communication
- `reviews` - Provider reviews from expats
- `review_helpful_votes` - Helpful votes on reviews
- `message_threads` - Message conversation threads
- `messages` - Individual messages
- `message_attachments` - File attachments

## Row Level Security (RLS)

All tables have RLS enabled with policies for:
- Users can only view/edit their own data
- Public access to verified provider profiles and active services
- Booking participants can view booking details
- Providers can view expat profiles for their bookings
- Message participants can view their conversations

## Indexes

Performance indexes are created for:
- Foreign key relationships
- Common query patterns (status, dates, etc.)
- Full-text search on provider profiles and services
- Composite indexes for complex queries

## Triggers

Automatic triggers for:
- `updated_at` timestamp updates on all tables
- Booking status history tracking
- Review rating aggregation on provider profiles
- Message thread updates on new messages
- Automatic message thread creation for bookings
- Auto-generated booking/payment/refund numbers

## Enums

The following enum types are defined:
- `user_role`: expat, provider, admin
- `verification_status`: pending, verified, rejected
- `residence_status`: tourist, student, work_visa, blue_card, etc.
- `service_category`: immigration, visa_support, work_permit, etc.
- `pricing_type`: fixed, hourly, tiered
- `service_delivery`: online, in_person, hybrid
- `booking_status`: requested, confirmed, completed, etc.
- `payment_status`: pending, succeeded, failed, refunded, etc.
- `escrow_status`: held, released_to_provider, refunded_to_expat
- `review_status`: pending, published, flagged, removed
- `message_status`: sent, delivered, read, failed

## Seed Data

Initial seed data includes:
- 13 service categories (immigration, tax, employment, etc.)
- 30+ service tags (urgent, online-consultation, city names, etc.)
- Demo admin user (should be removed in production)

## TypeScript Types

Matching TypeScript types are available in `/types/database.ts` for type-safe database operations.

## Important Notes

1. **Remove demo admin user** in production (see migration 008)
2. **Change default passwords** if using authentication
3. **Configure Stripe webhooks** for payment processing
4. **Set up storage buckets** for file uploads (documents, avatars)
5. **Review RLS policies** before production deployment
6. **Monitor index usage** and adjust as needed

## Backup & Restore

Always backup your database before running migrations:

```bash
# Backup
supabase db dump -f backup.sql

# Restore
psql -h your-db-host -U your-user -d your-db < backup.sql
```

## Troubleshooting

### Migration fails
- Check if a migration was partially applied
- Verify database permissions
- Check for conflicting data

### RLS Policy Issues
- Ensure JWT claims are properly set
- Verify user roles are correct
- Check policy logic in migration 006

### Performance Issues
- Check query execution plans
- Verify indexes are being used
- Consider adding additional indexes

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review PostgreSQL documentation: https://www.postgresql.org/docs/
- Open an issue in the repository

## Schema Diagram

A visual schema diagram can be generated using tools like:
- [dbdiagram.io](https://dbdiagram.io)
- [pgAdmin](https://www.pgadmin.org/)
- [DBeaver](https://dbeaver.io/)

## Future Migrations

When creating new migrations:
1. Use timestamp format: `YYYYMMDDHHMMSS_description.sql`
2. Include rollback statements in comments
3. Test on development database first
4. Document breaking changes
5. Update TypeScript types accordingly
