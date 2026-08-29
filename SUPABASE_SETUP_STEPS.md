# Complete Supabase Setup Guide for PitchScout Admin Features

## Current Status
Your Supabase project `best creativity health` is **PAUSED**. This needs to be resumed first to run migrations and access the database.

---

## Step 1: Resume Your Project ⏯️

1. Go to your Supabase Dashboard
2. Look for your project `best creativity health`
3. You should see a **"Resume project"** button
4. Click it - the project will take ~1-2 minutes to resume
5. Wait for the status to change from "paused" to "active"

---

## Step 2: Run the Database Migration ✅

Once your project is resumed:

### Option A: Using Supabase Dashboard (Easiest)

1. Go to: **Project → SQL Editor**
2. Click **"New query"**
3. Copy and paste ALL of this SQL:

```sql
-- Add new columns for usage tracking and registration status
alter table public.profiles
  add column if not exists usage_count integer not null default 0,
  add column if not exists usage_limit integer not null default 5,
  add column if not exists is_registered boolean not null default false;

-- Update existing profiles to set usage_limit to 5
update public.profiles
set usage_limit = 5
where usage_limit is null or usage_limit < 5;

-- Update is_registered to true for all existing profiles
update public.profiles
set is_registered = true
where is_registered = false;

-- Create or replace the consume_analysis_usage function
create or replace function public.consume_analysis_usage()
returns table (allowed boolean, used integer, limit_value integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_count integer;
  current_limit integer;
begin
  insert into public.profiles (id, is_registered) values (auth.uid(), true) on conflict (id) do nothing;
  select usage_count, usage_limit into current_count, current_limit
  from public.profiles where id = auth.uid() for update;
  if current_count >= current_limit then
    return query select false, current_count, current_limit;
    return;
  end if;
  update public.profiles set usage_count = usage_count + 1 where id = auth.uid();
  return query select true, current_count + 1, current_limit;
end;
$$;

grant execute on function public.consume_analysis_usage() to authenticated;
```

4. Click the blue **"Run"** button
5. You should see "✓ Success" in the Results section
6. Done! The migration is complete

### Option B: Via Your Project Directory

If you want to use the CLI:
```bash
cd c:\Users\DELL\Desktop\pitchscout-main
supabase db push
```

---

## Step 3: Verify RLS Policies ✅

Go to: **Project → Authentication → Policies**

Make sure these policies exist for the `profiles` table:
- ✅ "Users can read own profile"
- ✅ "Users can insert own profile"  
- ✅ "Users can update own profile"

If any are missing, create them. Otherwise, skip this step.

---

## Step 4: Get Your Service Role Key 🔑

**⚠️ CRITICAL - This enables admin functions**

1. Go to: **Project → Settings → API**
2. Under "Project API Keys", find the **Service Role** section
3. Look for the key that starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. Click the **"Copy"** button next to it
5. **KEEP THIS SECRET** - Don't share it in Git or public places

---

## Step 5: Update Your .env File 📝

Open: `c:\Users\DELL\Desktop\pitchscout-main\.env`

Add this line at the end:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Replace `your_service_role_key_here` with the key you copied in Step 4.

**Example:**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...
```

---

## Step 6: Verify the Setup ✅

After completing all steps:

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Test in your app:
   - **Guest user**: Should show "Free trial: 2 / 2 analyses left"
   - **Sign up/login**: Should show full access with 5 trials
   - **Login as admin** (`adetoyebiridwan1.0@gmail.com`): Should see "Admin Dashboard" in menu
   - **Click Admin Dashboard**: Should see all users listed with usage stats

---

## Troubleshooting

### "Admin access required" error
- Check admin email is EXACT: `adetoyebiridwan1.0@gmail.com`
- Verify `SUPABASE_SERVICE_ROLE_KEY` is in `.env`
- Restart the dev server after updating `.env`

### Migration fails to run
- Make sure project is **Resumed** (not paused)
- Try running in small chunks instead of all at once
- Check you copied the SQL exactly as shown

### RLS policies blocking access
- You might have restrictive policies
- In Supabase SQL Editor, try adding `BYPASS ROW LEVEL SECURITY` to test
- If that works, adjust your policies

### Usage tracking not working
- **Guests**: Clear browser localStorage and try again
  - Open DevTools → Application → Local Storage → Clear
- **Registered users**: Check `profiles` table has the new columns
  - Go to SQL Editor and run: `SELECT * FROM profiles LIMIT 5;`

---

## Files that use these features

| Component | File | Purpose |
|-----------|------|---------|
| Guest Trials | `src/hooks/useGuestUsage.ts` | Tracks 2 guest analyses |
| Usage Dialog | `src/components/usage-limit-dialog.tsx` | Shows when limit reached |
| Email Pasting | `src/components/email-paste-input.tsx` | Email detection |
| Admin Dashboard | `src/routes/_authenticated/admin.tsx` | Manage users |
| Admin Functions | `src/lib/admin.functions.ts` | Server-side admin ops |
| Analysis Checks | `src/routes/index.tsx` | Enforces usage limits |

---

## Summary Checklist

- [ ] Resumed the paused project
- [ ] Ran the SQL migration (saw ✓ Success)
- [ ] Verified RLS policies exist
- [ ] Copied Service Role Key
- [ ] Added `SUPABASE_SERVICE_ROLE_KEY` to `.env`
- [ ] Restarted dev server
- [ ] Tested guest trials (2 analyses)
- [ ] Tested registered user (5 analyses)
- [ ] Tested admin login (see Admin Dashboard)
- [ ] Admin can view all users
- [ ] Admin can update usage limits
- [ ] Admin can delete accounts

---

## Next Steps

Once this is complete, all features are ready:
✅ Guest tracking (2 trials)
✅ Registered user trials (5 trials)  
✅ Admin dashboard
✅ Email pasting
✅ Usage limit dialog with Telegram button
✅ Premium features locked for guests

**Questions?** Check the troubleshooting section above or review the migration SQL in:
`c:\Users\DELL\Desktop\pitchscout-main\supabase\migrations\202608270001_usage_admin.sql`
