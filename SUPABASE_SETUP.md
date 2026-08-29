# Supabase Setup Guide for PitchScout Features

## Overview
This guide covers all the Supabase changes needed for the new admin, usage limits, and guest tracking features.

---

## 1. Database Migration (Already in migration file)

The migration at `supabase/migrations/202608270001_usage_admin.sql` includes:

### Changes to `profiles` table:
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_limit INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS is_registered BOOLEAN NOT NULL DEFAULT false;
```

### Updated `consume_analysis_usage()` function:
- Tracks usage consumption
- Checks against user limits
- Returns: `{allowed: boolean, used: integer, limit_value: integer}`

**Status**: ✅ Already created in migration

---

## 2. Row Level Security (RLS) Policies

### For `profiles` table:

#### Policy: Allow users to read own profile
```sql
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id)
```

#### Policy: Allow authenticated users to insert own profile
```sql
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id)
```

#### Policy: Allow users to update own profile
```sql
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id)
```

---

## 3. Admin Functions (via Server-side Supabase)

The following server functions in `src/lib/admin.functions.ts` use the admin client:

### `listUsers()` - GET
- Returns all users with their usage stats
- **Auth Check**: Requires user email = `adetoyebiridwan1.0@gmail.com`
- Returns array of: `{id, email, createdAt, usageCount, usageLimit}`

### `setUserUsage()` - POST
- Updates a user's usage limit
- **Auth Check**: Requires admin email
- Params: `{id: string, limit: number}`

### `deleteUser()` - POST
- Permanently deletes a user account
- **Auth Check**: Requires admin email
- **Safety Check**: Cannot delete admin's own account
- Params: `{id: string}`

**Note**: These use `supabaseAdmin` (service role key) for direct auth operations.

---

## 4. Required Environment Variables

Make sure your `.env` file has:

```env
SUPABASE_PROJECT_ID="[YOUR_SUPABASE_PROJECT_ID]"
SUPABASE_PUBLISHABLE_KEY="[YOUR_SUPABASE_PUBLISHABLE_KEY]"
SUPABASE_URL="https://[YOUR_PROJECT_REF].supabase.co"
VITE_SUPABASE_PROJECT_ID="[YOUR_SUPABASE_PROJECT_ID]"
VITE_SUPABASE_PUBLISHABLE_KEY="[YOUR_SUPABASE_PUBLISHABLE_KEY]"
VITE_SUPABASE_URL="https://[YOUR_PROJECT_REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_ROLE_KEY]"
GEMINI_API_KEY="[YOUR_GEMINI_API_KEY]"
```

⚠️ **CRITICAL**: Add `SUPABASE_SERVICE_ROLE_KEY` - this enables admin operations!

---

## 5. Steps to Complete Setup

### Step 1: Log in to Supabase
1. Go to https://supabase.com/dashboard
2. Log in with your account
3. Select your project: `pitchscout-main` (or your project name)

### Step 2: Run the Migration
1. In Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy the entire content from: `supabase/migrations/202608270001_usage_admin.sql`
4. Run it (click "RUN" button)
5. Verify the migration completed successfully

### Step 3: Add RLS Policies (if not already present)
1. Go to Authentication → Policies
2. Select `profiles` table
3. Verify the following policies exist:
   - ✅ Users can read own profile
   - ✅ Users can insert own profile
   - ✅ Users can update own profile

**If missing, add them via SQL Editor:**
```sql
-- Run these individually in SQL Editor if policies don't exist
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### Step 4: Get Your Service Role Key
1. Go to Project Settings → API
2. Under "Project API Keys", copy the **Service Role Key** (secret)
3. Add it to your `.env` file as `SUPABASE_SERVICE_ROLE_KEY=...`

### Step 5: Verify Admin Email in Code
The admin email is hardcoded in two places:
- `src/lib/admin.functions.ts` (line 5): `adetoyebiridwan1.0@gmail.com`
- `src/components/AppHeader.tsx` (line 18): `adetoyebiridwan1.0@gmail.com`

To change the admin email:
1. Replace `adetoyebiridwan1.0@gmail.com` in both files
2. Update in your Supabase users list (the account that will be admin)

### Step 6: Test the Setup
1. Create a test user in Supabase (or register via the app)
2. In your app:
   - Try guest analysis (should show 2 trials)
   - Log in as regular user (should show 5 trials)
   - Log in as admin user (should see Admin Dashboard link)

---

## 6. Verification Checklist

- [ ] Migration executed successfully
- [ ] New columns added to `profiles` table:
  - [ ] `usage_count` (integer, default 0)
  - [ ] `usage_limit` (integer, default 5)
  - [ ] `is_registered` (boolean, default false)
- [ ] `consume_analysis_usage()` function exists
- [ ] RLS policies configured
- [ ] Service Role Key in `.env`
- [ ] Admin email configured
- [ ] Guest usage works (localStorage)
- [ ] Admin dashboard accessible to admin user
- [ ] Usage dialog appears when limit reached

---

## 7. Database Schema Summary

### profiles table columns
```
id (UUID) - Primary key
created_at (timestamp)
updated_at (timestamp)
display_name (text)
background (text)
usage_count (integer) ← NEW
usage_limit (integer) ← NEW
is_registered (boolean) ← NEW
```

### Triggers
- `update_profiles_updated_at` - Auto-updates `updated_at` timestamp

### Functions
- `consume_analysis_usage()` - RPC function for checking/consuming usage

---

## 8. Troubleshooting

### Admin functions return "Admin access required"
- Check admin email matches exactly (case-insensitive)
- Verify `SUPABASE_SERVICE_ROLE_KEY` is in `.env`
- Ensure the user is authenticated via `requireSupabaseAuth` middleware

### Usage not tracking
- Check browser localStorage (guest users)
- Check `profiles` table `usage_count` column (registered users)
- Verify `consume_analysis_usage()` function is callable

### RLS policies blocking access
- Check that user ID matches in all RLS conditions
- Ensure policies use `auth.uid()` correctly
- Test with `BYPASS RLS` toggle in Supabase editor

---

## Summary of New Features

| Feature | Location | Database | Browser |
|---------|----------|----------|---------|
| Guest trials (2) | `index.tsx` | localStorage | ✅ |
| Registered trials (5) | `index.tsx` + Supabase | profiles.usage_limit | ✅ |
| Admin dashboard | `/_authenticated/admin` | profiles (read/write) | ✅ |
| Usage limit dialog | `usage-limit-dialog.tsx` | N/A | ✅ |
| Email pasting | `email-paste-input.tsx` | N/A | ✅ |

---

**Next Steps:**
1. Log in to your Supabase dashboard
2. Follow the steps above to apply the migration
3. Verify all components are in place
4. Test the full flow!
