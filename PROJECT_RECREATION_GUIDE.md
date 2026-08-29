# PitchScout Project Recreation Guide

## Current Status

✅ **OLD PROJECT DELETED** 
- Successfully deleted: "best creativity health" 
- All old data has been removed

## Issue: Free Tier Project Limit

The Supabase free plan has a limit of **2 active free projects per owner**. Even though we deleted the old project, Supabase's system may take a few moments to update the count, or the deletion may not have fully cleared the cache.

## Solution: Two Options

### Option 1: Wait & Retry (Recommended if you have time)
1. Wait 5-10 minutes for Supabase to sync the deletion
2. Return to: https://supabase.com/dashboard/org/fkrqgugjhynksvuncnjp
3. Click "+ New project"
4. Create the new project

### Option 2: Upgrade to Pro (Immediate)
If you need to proceed immediately, upgrade to Supabase Pro:
1. Go to: https://supabase.com/dashboard/org/fkrqgugjhynksvuncnjp/billing
2. Click "Upgrade to Pro" 
3. Complete the upgrade process
4. Create the new project

**Pro Plan Benefits:**
- ✅ Unlimited projects
- ✅ Better performance
- ✅ Support for production apps
- ✅ Advanced features (backups, custom domains, etc.)

### Option 3: CLI Creation (Advanced)
If you prefer using the CLI, ensure Supabase CLI is installed:

```bash
supabase projects create \
  --name "best creativity health" \
  --region "eu-north-1" \
  --org-id fkrqgugjhynksvuncnjp
```

---

## Recommended Project Settings

When creating the new project, use these settings:

| Setting | Value |
|---------|-------|
| **Project Name** | best creativity health |
| **Database Password** | [Use a strong password] |
| **Region** | EU (Stockholm) - North EU (eu-north-1) |
| **Organization** | adetoyebiridwan1.0@gmail.com |

---

## What to Do After Creating the Project

Once the new project is created, you'll need to:

1. **Get the Project Reference ID**
   - Copy it from Settings → General → Project ID
   - Example: `dnaoumqamqqifppwprxl`

2. **Get Database Connection String**
   - Go to Settings → Database
   - Copy the "URI" (looks like: `postgresql://user:pass@host/database`)

3. **Get Anon Key & Service Role Key**
   - Go to Settings → API
   - Copy both "anon public" and "service role" keys

4. **Update Environment Variables**
   ```bash
   # In c:\Users\DELL\Desktop\pitchscout-main\.env
   
   VITE_SUPABASE_URL=https://dnaoumqamqqifppwprxl.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

5. **Run Database Migration**
   - Go to SQL Editor in the Supabase dashboard
   - Paste the migration from: `supabase/migrations/202608270001_usage_admin.sql`
   - Click "Run"

6. **Verify RLS Policies**
   - Check Authentication → Policies
   - Ensure policies for `profiles` table exist

---

## Current Project Architecture

The app already has all code ready for:
- ✅ Guest usage tracking (2 trials) - localStorage based
- ✅ Registered user trials (5 trials) - database based
- ✅ Admin dashboard (email: `adetoyebiridwan1.0@gmail.com`)
- ✅ Usage limit dialogs with Telegram contact
- ✅ Email paste detection
- ✅ Premium feature locking for guests

All you need is a fresh Supabase database!

---

## Quick Checklist

- [ ] Decide: Option 1 (wait), Option 2 (upgrade), or Option 3 (CLI)
- [ ] Create new Supabase project with settings above
- [ ] Copy Project Reference ID to `.env`
- [ ] Copy Anon Key to `.env`
- [ ] Copy Service Role Key to `.env`
- [ ] Run database migration
- [ ] Verify RLS policies
- [ ] Test in app at http://localhost:8080

---

## Contact Information

If you need help:
- **Admin Email**: adetoyebiridwan1.0@gmail.com
- **Telegram Support**: @the_ace_studio
- **Supabase Docs**: https://supabase.com/docs

