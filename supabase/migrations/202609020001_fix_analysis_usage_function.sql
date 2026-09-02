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
  current_weekly_limit integer;
  current_monthly_limit integer;
  now_ts timestamptz := now();
  week_start timestamptz;
  month_start timestamptz;
  user_email text;
  admin_email text := 'adetoyebiridwan1.0@gmail.com';
  is_admin boolean := false;
begin
  user_email := auth.jwt() ->> 'email';
  is_admin := (lower(coalesce(user_email, '')) = lower(admin_email));

  if is_admin then
    return query select true, 0, 999999;
    return;
  end if;

  insert into public.profiles (id, is_registered)
  values (auth.uid(), true)
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

  select usage_count, usage_limit, weekly_limit, monthly_limit,
    weekly_usage_count, monthly_usage_count
  into current_count, current_limit, current_weekly_limit, current_monthly_limit,
    current_weekly, current_monthly
  from public.profiles
  where id = auth.uid()
  for update;

  if current_count >= current_limit then
    return query select false, current_count, current_limit;
    return;
  end if;

  if current_weekly >= coalesce(current_weekly_limit, current_limit) then
    return query select false, current_count, coalesce(current_weekly_limit, current_limit);
    return;
  end if;

  if current_monthly >= coalesce(current_monthly_limit, current_limit) then
    return query select false, current_count, coalesce(current_monthly_limit, current_limit);
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
