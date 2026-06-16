-- supabase/migrations/20260616000000_init.sql
-- ===========================================================================
-- Schema + security for the Config Flags app.
--
-- Business rule encoded here:
--   "Certain premium/beta feature flags should only be visible to specific
--    qualified users."
--
-- We model account quality as a tiered enum and gate flag visibility with Row
-- Level Security so the rule is enforced AT THE DATABASE LAYER — the API and
-- the app physically cannot leak a flag the user isn't entitled to, because the
-- rows never leave Postgres.
-- ===========================================================================

-- --- Enums -----------------------------------------------------------------
create type account_tier as enum ('free', 'premium', 'beta');
create type flag_environment as enum ('staging', 'production', 'all');

-- --- Tables ----------------------------------------------------------------

-- One profile per auth user. account_tier is the "qualification" that decides
-- which flags the user can see.
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  account_tier account_tier not null default 'free',
  created_at   timestamptz not null default now()
);

-- Feature flags carry the minimum tier required to see them, plus which
-- environment they belong to.
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

-- --- Tier helper -----------------------------------------------------------
-- Maps the tier enum to an orderable rank so "premium can see free flags,
-- beta can see everything" is expressible as a single comparison.
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

-- Convenience: the calling user's tier (0 if they have no profile yet).
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

-- Auto-provision a profile whenever a new auth user is created.
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

-- ===========================================================================
-- Row Level Security — the heart of the access-control requirement.
-- ===========================================================================
alter table public.profiles      enable row level security;
alter table public.feature_flags enable row level security;

-- profiles: a user can only ever see / change their OWN row.
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- feature_flags READ: only rows whose required tier is <= the caller's tier.
-- An anonymous or under-qualified caller simply gets zero matching rows.
create policy "flags_select_qualified"
  on public.feature_flags for select
  using (tier_rank(required_tier) <= current_user_rank());

-- feature_flags WRITE: no client may insert/update/delete. There is NO
-- permissive write policy, and RLS denies by default, so every write from an
-- anon/authenticated client is rejected at the database layer. Only the
-- service_role key (used by migrations/seed/admin tooling) bypasses RLS.
