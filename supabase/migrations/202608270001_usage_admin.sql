alter table public.profiles
  add column if not exists usage_count integer not null default 0,
  add column if not exists usage_limit integer not null default 5,
  add column if not exists weekly_limit integer not null default 5,
  add column if not exists monthly_limit integer not null default 20,
  add column if not exists is_registered boolean not null default false;

update public.profiles
set usage_limit = 5
where usage_limit is null or usage_limit < 5;

update public.profiles
set weekly_limit = 5
where weekly_limit is null or weekly_limit < 5;

update public.profiles
set monthly_limit = 20
where monthly_limit is null or monthly_limit < 20;

-- Update is_registered to true for all existing profiles
update public.profiles
set is_registered = true
where is_registered = false;

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
