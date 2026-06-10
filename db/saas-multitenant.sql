-- ============================================================================
-- Mirie SaaS — multi-tenant base schema
-- Run AFTER db/water-retail.sql (or before, if starting from scratch).
-- Adds vendors / vendor_members / platform_admins and rewrites RLS so every
-- water_* table is isolated per vendor. Super admins bypass the filter.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Tenants
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.vendor_status as enum ('active','suspended','pending');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.vendor_plan as enum ('starter','growth','scale');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.app_role as enum ('vendor_admin','water_admin','water_cashier','driver');
exception when duplicate_object then null; end $$;

create table if not exists public.vendors (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text not null unique,
  status         vendor_status not null default 'active',
  plan           vendor_plan   not null default 'starter',
  contact_email  text not null,
  contact_phone  text,
  created_at     timestamptz not null default now()
);

create table if not exists public.vendor_members (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references public.vendors(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        app_role not null,
  created_at  timestamptz not null default now(),
  unique (vendor_id, user_id)
);

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- 2. Tenant + role helpers (SECURITY DEFINER to avoid RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_platform_admin(_uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = _uid)
$$;

-- Reads vendor_id from JWT app_metadata first (set by Auth Admin API on invite)
-- and falls back to the membership row.
create or replace function public.current_vendor_id()
returns uuid language plpgsql stable security definer set search_path = public as $$
declare
  claim text;
  vid   uuid;
begin
  claim := nullif(coalesce(
    auth.jwt() -> 'app_metadata' ->> 'vendor_id',
    auth.jwt() -> 'user_metadata' ->> 'vendor_id'
  ), '');
  if claim is not null then return claim::uuid; end if;

  select vendor_id into vid from public.vendor_members
   where user_id = auth.uid()
   order by created_at asc limit 1;
  return vid;
end $$;

create or replace function public.has_vendor_role(_uid uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.vendor_members
     where user_id = _uid and role = _role
  )
$$;

-- ---------------------------------------------------------------------------
-- 3. Grants
-- ---------------------------------------------------------------------------
grant select                                on public.vendors          to authenticated;
grant select                                on public.vendor_members   to authenticated;
grant all                                   on public.vendors          to service_role;
grant all                                   on public.vendor_members   to service_role;
grant all                                   on public.platform_admins  to service_role;

-- ---------------------------------------------------------------------------
-- 4. RLS for tenant tables
-- ---------------------------------------------------------------------------
alter table public.vendors          enable row level security;
alter table public.vendor_members   enable row level security;
alter table public.platform_admins  enable row level security;

-- vendors: a user sees only their vendor; platform admins see all.
drop policy if exists vendors_self_read on public.vendors;
create policy vendors_self_read on public.vendors
  for select to authenticated
  using (id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));

drop policy if exists vendors_admin_all on public.vendors;
create policy vendors_admin_all on public.vendors
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- vendor_members: members see their own vendor's roster; platform admins see all.
drop policy if exists vmembers_self_read on public.vendor_members;
create policy vmembers_self_read on public.vendor_members
  for select to authenticated
  using (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));

drop policy if exists vmembers_admin_all on public.vendor_members;
create policy vmembers_admin_all on public.vendor_members
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));

-- platform_admins is service-role only (no policy for authenticated).

-- ---------------------------------------------------------------------------
-- 5. Add vendor_id to existing water_* tables (idempotent)
-- ---------------------------------------------------------------------------
alter table public.water_customers          add column if not exists vendor_id uuid references public.vendors(id) on delete cascade;
alter table public.water_products           add column if not exists vendor_id uuid references public.vendors(id) on delete cascade;
alter table public.water_transactions       add column if not exists vendor_id uuid references public.vendors(id) on delete cascade;
alter table public.water_transaction_items  add column if not exists vendor_id uuid references public.vendors(id) on delete cascade;

create index if not exists water_customers_vendor_idx   on public.water_customers (vendor_id);
create index if not exists water_products_vendor_idx    on public.water_products (vendor_id);
create index if not exists water_tx_vendor_idx          on public.water_transactions (vendor_id);
create index if not exists water_tx_items_vendor_idx    on public.water_transaction_items (vendor_id);

-- Replace the permissive policies created by water-retail.sql with tenant-scoped ones.
do $$
declare t text;
begin
  for t in select unnest(array[
    'water_customers','water_products','water_transactions','water_transaction_items'
  ]) loop
    execute format('drop policy if exists %I on public.%I', t || '_all',      t);
    execute format('drop policy if exists %I on public.%I', t || '_tenant',   t);
    execute format('drop policy if exists %I on public.%I', t || '_platform', t);

    execute format($p$
      create policy %I on public.%I
      for all to authenticated
      using (vendor_id = public.current_vendor_id())
      with check (vendor_id = public.current_vendor_id())
    $p$, t || '_tenant', t);

    execute format($p$
      create policy %I on public.%I
      for all to authenticated
      using (public.is_platform_admin(auth.uid()))
      with check (public.is_platform_admin(auth.uid()))
    $p$, t || '_platform', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Delivery tables (stubs — UI still on mocks; wire later)
-- ---------------------------------------------------------------------------
create table if not exists public.delivery_drivers (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references public.vendors(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  name        text not null,
  phone       text,
  vehicle     text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.delivery_dispatches (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references public.vendors(id) on delete cascade,
  driver_id       uuid references public.delivery_drivers(id) on delete set null,
  opened_at       timestamptz not null default now(),
  closed_at       timestamptz,
  opening_litres  integer not null default 0,
  closing_litres  integer,
  revenue         numeric(12,2) not null default 0,
  status          text not null default 'open' check (status in ('open','closed','reconciled'))
);

create index if not exists delivery_drivers_vendor_idx    on public.delivery_drivers (vendor_id);
create index if not exists delivery_dispatches_vendor_idx on public.delivery_dispatches (vendor_id);

grant select, insert, update, delete on public.delivery_drivers    to authenticated;
grant select, insert, update, delete on public.delivery_dispatches to authenticated;
grant all on public.delivery_drivers    to service_role;
grant all on public.delivery_dispatches to service_role;

alter table public.delivery_drivers    enable row level security;
alter table public.delivery_dispatches enable row level security;

drop policy if exists delivery_drivers_tenant    on public.delivery_drivers;
create policy delivery_drivers_tenant on public.delivery_drivers
  for all to authenticated
  using (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
  with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));

drop policy if exists delivery_dispatches_tenant on public.delivery_dispatches;
create policy delivery_dispatches_tenant on public.delivery_dispatches
  for all to authenticated
  using (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
  with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 7. Bootstrap helper — promote your first super admin manually
--    insert into public.platform_admins (user_id) values ('<auth-user-uuid>');
-- ---------------------------------------------------------------------------
