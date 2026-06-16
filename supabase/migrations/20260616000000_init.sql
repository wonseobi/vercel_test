create type account_tier as enum ('free', 'premium', 'beta');
create type flag_environment as enum ('staging', 'production', 'all');

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  account_tier account_tier not null default 'free',
  created_at   timestamptz not null default now()
);

create table public.feature_flags (
  id            uuid primary key default gen_random_uuid(),
  key           text not null,
  name          text not null,
  description   text not null default '',
  enabled       boolean not null default false,
  required_tier account_tier not null default 'free',
  environment   flag_environment not null default 'all',
  created_at    timestamptz not null default now(),
  unique (key, environment)
);

create or replace function public.tier_rank(t account_tier)
returns int
language sql
immutable
as $$
  select case t
    when 'free'    then 0
    when 'premium' then 1
    when 'beta'    then 2
  end;
$$;

create or replace function public.current_user_rank()
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select tier_rank(account_tier) from public.profiles where id = auth.uid()),
    0
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- row level security
alter table public.profiles      enable row level security;
alter table public.feature_flags enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "flags_select_qualified"
  on public.feature_flags for select
  using (tier_rank(required_tier) <= current_user_rank());

-- no write policy: clients cannot insert/update/delete, only service_role bypasses rls
