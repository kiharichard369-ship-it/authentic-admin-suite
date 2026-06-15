-- ============================================================================
-- Mirie SaaS — Platform / Super Admin schema
-- Run AFTER db/saas-multitenant.sql. Tables here are visible only to platform
-- admins (is_platform_admin) and, where useful, scoped per vendor.
-- ============================================================================

create extension if not exists "pgcrypto";

-- Roll-up of business arms shown on the Super Admin dashboard.
create table if not exists public.platform_businesses (
  id     text primary key,
  name   text not null,
  today  numeric(12,2) not null default 0,
  txns   integer not null default 0,
  color  text
);

create table if not exists public.platform_shops (
  id        text primary key,
  vendor_id uuid references public.vendors(id) on delete cascade,
  vendor    text,
  name      text not null,
  location  text,
  admin     text,
  cashiers  integer not null default 0,
  drivers   integer not null default 0,
  status    text not null default 'active',
  created   date not null default current_date
);

create table if not exists public.platform_users (
  id          text primary key,
  vendor_id   uuid references public.vendors(id) on delete cascade,
  name        text not null,
  email       text not null,
  role        text not null,
  business    text,
  vendor      text,
  shop        text,
  status      text not null default 'active',
  last_login  timestamptz
);

create table if not exists public.platform_activity (
  id       text primary key,
  vendor_id uuid references public.vendors(id) on delete cascade,
  time     text,
  business text,
  text     text
);

create table if not exists public.platform_assets (
  id            text primary key,
  vendor_id     uuid references public.vendors(id) on delete cascade,
  name          text not null,
  type          text,
  shop          text,
  status        text not null default 'in-service',
  added         date,
  mileage       integer,
  last_service  date
);

create table if not exists public.platform_expenses (
  id          text primary key,
  vendor_id   uuid references public.vendors(id) on delete cascade,
  date        date not null,
  staff       text,
  shop        text,
  category    text,
  description text,
  amount      numeric(12,2) not null default 0,
  status      text not null default 'pending'
);

-- Indexes
create index if not exists pshops_vendor_idx    on public.platform_shops (vendor_id);
create index if not exists pusers_vendor_idx    on public.platform_users (vendor_id);
create index if not exists pactivity_vendor_idx on public.platform_activity (vendor_id);
create index if not exists passets_vendor_idx   on public.platform_assets (vendor_id);
create index if not exists pexp_vendor_idx      on public.platform_expenses (vendor_id);

-- Grants
do $$ declare t text;
begin
  for t in select unnest(array[
    'platform_businesses','platform_shops','platform_users',
    'platform_activity','platform_assets','platform_expenses'
  ]) loop
    execute format('grant select on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- RLS — platform admins see everything; vendor members see only their rows
-- (where vendor_id matches). platform_businesses is global rollup, admin-only.
alter table public.platform_businesses enable row level security;
drop policy if exists pbusinesses_admin on public.platform_businesses;
create policy pbusinesses_admin on public.platform_businesses
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

do $$ declare t text;
begin
  for t in select unnest(array[
    'platform_shops','platform_users','platform_activity',
    'platform_assets','platform_expenses'
  ]) loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_scope', t);
    execute format($p$
      create policy %I on public.%I
      for all to authenticated
      using (public.is_platform_admin(auth.uid()) or vendor_id = public.current_vendor_id())
      with check (public.is_platform_admin(auth.uid()) or vendor_id = public.current_vendor_id())
    $p$, t || '_scope', t);
  end loop;
end $$;
