-- ============================================================================
-- Mirie SaaS — Water Delivery schema
-- Run AFTER db/water-retail.sql and db/saas-multitenant.sql.
-- All tables are tenant-scoped via vendor_id + RLS using current_vendor_id().
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Drivers
-- ---------------------------------------------------------------------------
create table if not exists public.delivery_drivers_full (
  id          text primary key,
  vendor_id   uuid not null references public.vendors(id) on delete cascade,
  name        text not null,
  phone       text,
  vehicle     text,
  trips       integer not null default 0,
  rating      numeric(3,2) not null default 5.0,
  status      text not null default 'active',
  created_at  timestamptz not null default now()
);
-- Note: the SaaS migration already created a `delivery_drivers` stub. The
-- frontend reads from the simpler shape below; create a compatibility view if
-- you want a single name. For new installs, prefer this table:
create or replace view public.v_delivery_drivers as
  select id, vendor_id, name, phone, vehicle, trips, rating, status
    from public.delivery_drivers_full;

-- ---------------------------------------------------------------------------
-- Dispatches (delivery jobs) — distinct from saas stub
-- ---------------------------------------------------------------------------
create table if not exists public.delivery_dispatches_full (
  id              text primary key,
  vendor_id       uuid not null references public.vendors(id) on delete cascade,
  product         text not null,
  driver          text,
  vehicle         text,
  customer        text,
  dispatched_at   timestamptz,
  delivered_at    timestamptz,
  returned_at     timestamptz,
  status          text not null default 'dispatched',
  litres          integer not null default 0,
  payment         text,
  paid            boolean not null default false
);

-- ---------------------------------------------------------------------------
-- Debts (customer owes)
-- ---------------------------------------------------------------------------
create table if not exists public.delivery_debts (
  id          text primary key,
  vendor_id   uuid not null references public.vendors(id) on delete cascade,
  customer    text not null,
  phone       text,
  driver      text,
  dispatch    text,
  amount      numeric(12,2) not null default 0,
  due_date    date,
  status      text not null default 'open',
  note        text
);

-- ---------------------------------------------------------------------------
-- Credits (customer prepaid balance)
-- ---------------------------------------------------------------------------
create table if not exists public.delivery_credits (
  id            text primary key,
  vendor_id     uuid not null references public.vendors(id) on delete cascade,
  customer      text not null,
  phone         text,
  source        text,
  balance       numeric(12,2) not null default 0,
  last_updated  date not null default current_date,
  note          text
);

-- ---------------------------------------------------------------------------
-- Fuel logs
-- ---------------------------------------------------------------------------
create table if not exists public.delivery_fuel_logs (
  id        text primary key,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  date      date not null,
  driver    text,
  vehicle   text,
  litres    numeric(8,2) not null default 0,
  amount    numeric(12,2) not null default 0,
  station   text
);

-- ---------------------------------------------------------------------------
-- GPS — last known position per vehicle
-- ---------------------------------------------------------------------------
create table if not exists public.delivery_gps_vehicles (
  id         text primary key,
  vendor_id  uuid not null references public.vendors(id) on delete cascade,
  driver     text,
  lat        numeric(10,6) not null,
  lng        numeric(10,6) not null,
  speed      numeric(6,2) not null default 0,
  heading    text,
  last_ping  timestamptz not null default now(),
  status     text not null default 'idle'
);

-- ---------------------------------------------------------------------------
-- Aggregate / summary tables read once via maybeSingle()
-- ---------------------------------------------------------------------------
create table if not exists public.delivery_fleet (
  vendor_id      uuid primary key references public.vendors(id) on delete cascade,
  vehicles       integer not null default 0,
  active         integer not null default 0,
  litres_today   integer not null default 0,
  fuel_cost      numeric(12,2) not null default 0
);

create table if not exists public.delivery_kpis (
  vendor_id        uuid primary key references public.vendors(id) on delete cascade,
  dispatches_today integer not null default 0,
  litres_today     integer not null default 0,
  revenue_today    numeric(12,2) not null default 0,
  pending          integer not null default 0,
  debts            numeric(12,2) not null default 0
);

create table if not exists public.delivery_litres_by_day (
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  day       date not null,
  litres    integer not null default 0,
  primary key (vendor_id, day)
);

create table if not exists public.delivery_daily_revenue (
  vendor_id   uuid primary key references public.vendors(id) on delete cascade,
  today       numeric(12,2) not null default 0,
  yesterday   numeric(12,2) not null default 0,
  this_week   numeric(12,2) not null default 0,
  this_month  numeric(12,2) not null default 0
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists ddrivers_full_vendor_idx    on public.delivery_drivers_full (vendor_id);
create index if not exists ddispatches_full_vendor_idx on public.delivery_dispatches_full (vendor_id);
create index if not exists ddebts_vendor_idx           on public.delivery_debts (vendor_id);
create index if not exists dcredits_vendor_idx         on public.delivery_credits (vendor_id);
create index if not exists dfuel_vendor_idx            on public.delivery_fuel_logs (vendor_id);
create index if not exists dgps_vendor_idx             on public.delivery_gps_vehicles (vendor_id);
create index if not exists dlitres_vendor_idx          on public.delivery_litres_by_day (vendor_id);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
do $$ declare t text;
begin
  for t in select unnest(array[
    'delivery_drivers_full','delivery_dispatches_full','delivery_debts',
    'delivery_credits','delivery_fuel_logs','delivery_gps_vehicles',
    'delivery_fleet','delivery_kpis','delivery_litres_by_day','delivery_daily_revenue'
  ]) loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- RLS — tenant-scoped, platform admins bypass
-- ---------------------------------------------------------------------------
do $$ declare t text;
begin
  for t in select unnest(array[
    'delivery_drivers_full','delivery_dispatches_full','delivery_debts',
    'delivery_credits','delivery_fuel_logs','delivery_gps_vehicles',
    'delivery_fleet','delivery_kpis','delivery_litres_by_day','delivery_daily_revenue'
  ]) loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_tenant', t);
    execute format($p$
      create policy %I on public.%I
      for all to authenticated
      using (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
      with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
    $p$, t || '_tenant', t);
  end loop;
end $$;
