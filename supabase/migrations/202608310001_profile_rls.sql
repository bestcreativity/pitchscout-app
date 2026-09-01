alter table public.profiles enable row level security;

do $$ begin
  create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
exception when duplicate_object then null;
end $$;
