-- ============================================================
-- Aurelia Academy Awards — Supabase schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)
-- ============================================================

-- Extension for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------

create table if not exists public.categories (
  id text primary key,                  -- slug, e.g. "scholar"
  icon text not null default '🏆',
  title text not null,
  subtitle text not null default '',
  total_votes integer not null default 0,
  auto_total boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nominees (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references public.categories(id) on delete cascade,
  name text not null,
  house text not null default '',
  votes integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nominees_category_id_idx on public.nominees(category_id);

-- ----------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists nominees_set_updated_at on public.nominees;
create trigger nominees_set_updated_at
  before update on public.nominees
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------
-- Keep categories.total_votes in sync with sum(nominees.votes)
-- only when that category has auto_total = true.
-- ----------------------------------------------------------------

create or replace function public.recalc_category_total()
returns trigger
language plpgsql
as $$
declare
  affected_id text;
begin
  affected_id := coalesce(new.category_id, old.category_id);

  update public.categories c
  set total_votes = coalesce((
    select sum(n.votes) from public.nominees n where n.category_id = affected_id
  ), 0)
  where c.id = affected_id
    and c.auto_total = true;

  return coalesce(new, old);
end;
$$;

drop trigger if exists nominees_recalc_total on public.nominees;
create trigger nominees_recalc_total
  after insert or update of votes or delete on public.nominees
  for each row execute function public.recalc_category_total();

-- ----------------------------------------------------------------
-- Row Level Security
-- Public (anon + authenticated) can READ everything.
-- Only authenticated users (admins) can write.
-- There is no public signup flow in this app — admin accounts are
-- created manually in the Supabase dashboard — so "authenticated"
-- is an acceptable proxy for "admin" here.
-- ----------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.nominees enable row level security;

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read"
  on public.categories for select
  to anon, authenticated
  using (true);

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write"
  on public.categories for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "nominees_public_read" on public.nominees;
create policy "nominees_public_read"
  on public.nominees for select
  to anon, authenticated
  using (true);

drop policy if exists "nominees_admin_write" on public.nominees;
create policy "nominees_admin_write"
  on public.nominees for all
  to authenticated
  using (true)
  with check (true);

-- ----------------------------------------------------------------
-- Realtime: broadcast changes so the live reveal screen and admin
-- dashboard stay in sync without polling.
-- ----------------------------------------------------------------

alter publication supabase_realtime add table public.categories;
alter publication supabase_realtime add table public.nominees;

-- ----------------------------------------------------------------
-- No seed data. Add your real categories and nominees from the
-- Admin Dashboard after deploying, or insert manually here, e.g.:
--
-- insert into public.categories (id, icon, title, subtitle, sort_order)
-- values ('scholar', '🎓', 'Scholar of the Year', 'Brilliance in pursuit of knowledge.', 0);
--
-- insert into public.nominees (category_id, name, house, votes, sort_order)
-- values ('scholar', 'Jane Doe', 'Athena House', 0, 0);
-- ----------------------------------------------------------------
