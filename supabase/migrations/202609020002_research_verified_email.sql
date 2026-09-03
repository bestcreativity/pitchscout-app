alter table public.researches
  add column if not exists verified_email text,
  add column if not exists email_verified_at timestamptz;
