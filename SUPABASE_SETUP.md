# Supabase Authentication Setup

This application uses Supabase for authentication and PostgreSQL database hosting, with Prisma as the ORM.

## Environment Variables

Make sure you have the following environment variables set in your `.env` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database (Supabase PostgreSQL)
DATABASE_URL=your_supabase_database_url
```

## Getting Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Settings** > **API**
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Go to **Settings** > **Database** to get your connection string
   - Use the **Connection Pooling** URL for better performance
   - Format: `postgresql://postgres.[project-ref]:[password]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`

## Authentication Flow

### Sign Up
- Navigate to `/auth/sign-up`
- Users sign up as scrutineers by default
- Email and password authentication
- Collects first name and last name
- User metadata includes first_name, last_name, full_name, and role

### Sign In
- Navigate to `/auth/sign-in`
- Email and password authentication
- Auto-redirects to home page on success

### Protected Routes
- Only routes under `/scrutineer/*` require authentication
- The main site (home page, public info) is accessible to everyone
- Middleware handles automatic redirects
- Authenticated users are redirected to `/scrutineer` when accessing auth pages
- Unauthenticated users are redirected to `/auth/sign-in` when accessing scrutineer routes

## Features

- **Client-side auth**: `useAuth()` hook provides user state
- **Server-side auth**: Use `createClient()` from `@/app/lib/supabase/server`
- **Middleware**: Automatic session refresh and route protection
- **User menu**: Shows user info and sign-out option

## Freemium Model (Future)

The app is set up for a future freemium model:
- All users start as free tier scrutineers
- Premium features can be gated based on user subscription status
- User metadata can be extended with subscription info

## Testing

1. Run the development server: `npm run dev`
2. Navigate to `/auth/sign-up`
3. Create a test scrutineer account
4. Verify you're redirected to the home page
5. Check that protected routes work correctly
6. Test sign-out functionality

## Database Schema

The Prisma schema should include a users table that syncs with Supabase auth.users:

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  full_name     String?
  role          String   @default("scrutineer")
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt

  // Relations
  competitions  CompetitionUser[]
}
```

## Next Steps

1. Set up Supabase auth triggers to sync users to your Prisma database
2. Configure email templates in Supabase
3. Add password reset functionality
4. Add email verification
5. Implement subscription/freemium logic when ready