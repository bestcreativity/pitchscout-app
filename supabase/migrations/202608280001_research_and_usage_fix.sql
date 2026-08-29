alter table public.profiles
  add column if not exists is_registered boolean not null default false,
  add column if not exists weekly_usage_count integer not null default 0,
  add column if not exists monthly_usage_count integer not null default 0,
  add column if not exists last_week_reset timestamp with time zone,
  add column if not exists last_month_reset timestamp with time zone;

update public.profiles
set is_registered = true
where is_registered = false;

create table if not exists public.researches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  business_name text,
  best_pitch_title text,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.researches enable row level security;

do $$ begin
  create policy "Users can view own researches"
  on public.researches for select
  using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can insert own researches"
  on public.researches for insert
  with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update own researches"
  on public.researches for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can delete own researches"
  on public.researches for delete
  using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

create or replace function public.consume_analysis_usage()
returns table (allowed boolean, used integer, limit_value integer)
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_count integer;
  current_limit integer;
  current_weekly integer;
  current_monthly integer;
  now_ts timestamptz := now();
  week_start timestamptz;
  month_start timestamptz;
begin
  insert into public.profiles (id, is_registered) values (auth.uid(), true)
  on conflict (id) do nothing;

  week_start := date_trunc('week', now_ts);
  month_start := date_trunc('month', now_ts);

  update public.profiles
  set
    weekly_usage_count = case
      when last_week_reset is null or last_week_reset < week_start then 0
      else weekly_usage_count
    end,
    monthly_usage_count = case
      when last_month_reset is null or last_month_reset < month_start then 0
      else monthly_usage_count
    end,
    last_week_reset = case
      when last_week_reset is null or last_week_reset < week_start then week_start
      else last_week_reset
    end,
    last_month_reset = case
      when last_month_reset is null or last_month_reset < month_start then month_start
      else last_month_reset
    end
  where id = auth.uid();

  select usage_count, usage_limit, weekly_usage_count, monthly_usage_count
  into current_count, current_limit, current_weekly, current_monthly
  from public.profiles
  where id = auth.uid() for update;

  if current_count >= current_limit then
    return query select false, current_count, current_limit;
    return;
  end if;

  if current_weekly >= coalesce(weekly_limit, current_limit) then
    return query select false, current_count, coalesce(weekly_limit, current_limit);
    return;
  end if;

  if current_monthly >= coalesce(monthly_limit, current_limit) then
    return query select false, current_count, coalesce(monthly_limit, current_limit);
    return;
  end if;

  update public.profiles
  set
    usage_count = usage_count + 1,
    weekly_usage_count = weekly_usage_count + 1,
    monthly_usage_count = monthly_usage_count + 1
  where id = auth.uid();

  select usage_count, usage_limit
  into current_count, current_limit
  from public.profiles
  where id = auth.uid();

  return query select true, current_count, current_limit;
end;
$$;

grant execute on function public.consume_analysis_usage() to authenticated;

create table if not exists public.lead_search_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  lead_count integer not null default 0,
  primary key (user_id, usage_date)
);

alter table public.lead_search_usage enable row level security;

do $$ begin
  create policy "Users can view own lead search usage"
  on public.lead_search_usage for select using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

create or replace function public.consume_lead_search_budget(requested_count integer)
returns table (allowed boolean, used integer, remaining integer, limit_value integer)
language plpgsql security invoker set search_path = public
as $$
declare
  daily_limit integer := 500;
  current_count integer;
begin
  if requested_count < 1 or requested_count > 30 then
    raise exception 'requested_count must be between 1 and 30';
  end if;

  insert into public.lead_search_usage (user_id, usage_date, lead_count)
  values (auth.uid(), current_date, 0)
  on conflict (user_id, usage_date) do nothing;

  select lead_count into current_count
  from public.lead_search_usage
  where user_id = auth.uid() and usage_date = current_date
  for update;

  if current_count + requested_count > daily_limit then
    return query select false, current_count, greatest(0, daily_limit - current_count), daily_limit;
    return;
  end if;

  update public.lead_search_usage
  set lead_count = lead_count + requested_count
  where user_id = auth.uid() and usage_date = current_date;

  return query select true, current_count + requested_count, daily_limit - current_count - requested_count, daily_limit;
end;
$$;

grant execute on function public.consume_lead_search_budget(integer) to authenticated;
