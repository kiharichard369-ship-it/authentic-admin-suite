-- ============================================================================
-- Mirie SaaS — Live computed views, tables and RPCs
-- Run AFTER: water-retail.sql, saas-multitenant.sql, delivery-retail.sql,
--            platform.sql, auth-helpers.sql, onboarding.sql, business-type.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Branch config table
-- ---------------------------------------------------------------------------
create table if not exists public.water_branch (
  vendor_id   uuid primary key references public.vendors(id) on delete cascade,
  name        text not null,
  code        text,
  address     text,
  manager     text,
  paybill     text
);
alter table public.water_branch enable row level security;
drop policy if exists water_branch_tenant on public.water_branch;
create policy water_branch_tenant on public.water_branch
  for all to authenticated
  using (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
  with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));
grant select, insert, update on public.water_branch to authenticated;
grant all on public.water_branch to service_role;

-- ---------------------------------------------------------------------------
-- 2. Stock requests table (must exist BEFORE water_kpis view)
-- ---------------------------------------------------------------------------
create table if not exists public.water_stock_requests (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references public.vendors(id) on delete cascade,
  date        date not null default current_date,
  items       text not null,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'delivered', 'rejected')),
  note        text,
  created_at  timestamptz not null default now()
);
alter table public.water_stock_requests enable row level security;
drop policy if exists water_stock_requests_tenant on public.water_stock_requests;
create policy water_stock_requests_tenant on public.water_stock_requests
  for all to authenticated
  using (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
  with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));
grant select, insert, update, delete on public.water_stock_requests to authenticated;
grant all on public.water_stock_requests to service_role;

-- ---------------------------------------------------------------------------
-- 3. Refunds table (must exist BEFORE water_kpis view)
-- ---------------------------------------------------------------------------
create table if not exists public.water_refunds (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references public.vendors(id) on delete cascade,
  txn         uuid references public.water_transactions(id) on delete set null,
  date        timestamptz not null default now(),
  customer    text,
  cashier     text,
  reason      text,
  amount      numeric(12,2) not null default 0,
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at  timestamptz not null default now()
);
alter table public.water_refunds enable row level security;
drop policy if exists water_refunds_tenant on public.water_refunds;
create policy water_refunds_tenant on public.water_refunds
  for all to authenticated
  using (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
  with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));
grant select, insert, update, delete on public.water_refunds to authenticated;
grant all on public.water_refunds to service_role;

-- ---------------------------------------------------------------------------
-- 4. Cashiers table (must exist BEFORE cashiers_live view)
-- ---------------------------------------------------------------------------
create table if not exists public.water_cashiers (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references public.vendors(id) on delete cascade,
  name        text not null,
  phone       text,
  shift       text,
  status      text not null default 'off' check (status in ('on_shift', 'off')),
  created_at  timestamptz not null default now()
);
alter table public.water_cashiers enable row level security;
drop policy if exists water_cashiers_tenant on public.water_cashiers;
create policy water_cashiers_tenant on public.water_cashiers
  for all to authenticated
  using (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
  with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));
grant select, insert, update, delete on public.water_cashiers to authenticated;
grant all on public.water_cashiers to service_role;

-- ---------------------------------------------------------------------------
-- 5. Branch expenses table
-- ---------------------------------------------------------------------------
create table if not exists public.water_branch_expenses (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references public.vendors(id) on delete cascade,
  date        date not null default current_date,
  staff       text not null,
  category    text not null,
  description text,
  amount      numeric(12,2) not null default 0,
  status      text not null default 'logged' check (status in ('logged', 'reviewed', 'rejected')),
  created_at  timestamptz not null default now()
);
alter table public.water_branch_expenses enable row level security;
drop policy if exists water_branch_expenses_tenant on public.water_branch_expenses;
create policy water_branch_expenses_tenant on public.water_branch_expenses
  for all to authenticated
  using (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
  with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));
grant select, insert, update, delete on public.water_branch_expenses to authenticated;
grant all on public.water_branch_expenses to service_role;

-- ---------------------------------------------------------------------------
-- 6. Delivery daily revenue log table
-- ---------------------------------------------------------------------------
create table if not exists public.delivery_daily_revenue_log (
  id                    uuid primary key default gen_random_uuid(),
  vendor_id             uuid not null references public.vendors(id) on delete cascade,
  date                  date not null default current_date,
  mpesa                 numeric(12,2) not null default 0,
  cash                  numeric(12,2) not null default 0,
  total                 numeric(12,2) not null default 0,
  starting_stock_litres integer not null default 0,
  finishing_stock_litres integer not null default 0,
  outstanding_debt      numeric(12,2) not null default 0,
  created_at            timestamptz not null default now(),
  unique (vendor_id, date)
);
alter table public.delivery_daily_revenue_log enable row level security;
drop policy if exists ddrev_tenant on public.delivery_daily_revenue_log;
create policy ddrev_tenant on public.delivery_daily_revenue_log
  for all to authenticated
  using (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
  with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));
grant select, insert, update, delete on public.delivery_daily_revenue_log to authenticated;
grant all on public.delivery_daily_revenue_log to service_role;

-- ---------------------------------------------------------------------------
-- 7. Payment config & audit tables
-- ---------------------------------------------------------------------------
create table if not exists public.platform_payment_config (
  business_id       text primary key,
  shortcode         text,
  passkey           text,
  consumer_key      text,
  consumer_secret   text,
  confirmation_url  text,
  validation_url    text,
  environment       text not null default 'sandbox' check (environment in ('sandbox', 'production')),
  mpesa_enabled     boolean not null default true,
  cash_enabled      boolean not null default true,
  updated_at        timestamptz not null default now()
);
alter table public.platform_payment_config enable row level security;
drop policy if exists ppayconfig_admin on public.platform_payment_config;
create policy ppayconfig_admin on public.platform_payment_config
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));
grant select, insert, update on public.platform_payment_config to authenticated;
grant all on public.platform_payment_config to service_role;

create table if not exists public.platform_payment_audit (
  id    uuid primary key default gen_random_uuid(),
  who   text not null,
  "when" timestamptz not null default now(),
  what  text not null
);
alter table public.platform_payment_audit enable row level security;
drop policy if exists ppayaudit_admin on public.platform_payment_audit;
create policy ppayaudit_admin on public.platform_payment_audit
  for all to authenticated
  using (public.is_platform_admin(auth.uid()))
  with check (public.is_platform_admin(auth.uid()));
grant select, insert on public.platform_payment_audit to authenticated;
grant all on public.platform_payment_audit to service_role;

insert into public.platform_payment_config (business_id, shortcode, environment, mpesa_enabled, cash_enabled)
values ('water', '174379', 'sandbox', true, true), ('delivery', '174381', 'sandbox', false, true)
on conflict (business_id) do nothing;

-- ---------------------------------------------------------------------------
-- 8. Views (all tables they reference now exist above)
-- ---------------------------------------------------------------------------

create or replace view public.water_kpis as
select
  wt.vendor_id,
  coalesce(sum(wt.total) filter (where date_trunc('day', wt.created_at) = current_date), 0)::numeric as today_revenue,
  coalesce(sum(wti.qty) filter (where date_trunc('day', wt.created_at) = current_date), 0)::numeric as today_litres,
  count(wt.id) filter (where date_trunc('day', wt.created_at) = current_date)::int as txns,
  (select count(*) from public.water_stock_requests wsr where wsr.vendor_id = wt.vendor_id and wsr.status = 'pending')::int as pending_requests,
  (select count(*) from public.water_products wp where wp.vendor_id = wt.vendor_id and wp.stock <= wp.reorder)::int as low_stock_items,
  (select count(*) from public.water_cashiers wc where wc.vendor_id = wt.vendor_id and wc.status = 'on_shift')::int as cashiers_on_shift
from public.water_transactions wt
left join public.water_transaction_items wti on wti.transaction_id = wt.id
group by wt.vendor_id;

create or replace view public.water_hourly_sales as
select
  wt.vendor_id,
  lpad(extract(hour from wt.created_at)::text, 2, '0') as hour,
  coalesce(sum(wti.qty), 0)::int as litres,
  coalesce(sum(wt.total), 0)::numeric as revenue
from public.water_transactions wt
left join public.water_transaction_items wti on wti.transaction_id = wt.id
where date_trunc('day', wt.created_at) = current_date
group by wt.vendor_id, extract(hour from wt.created_at)
order by hour;

create or replace view public.water_transactions_view as
select
  wt.id,
  wt.vendor_id,
  to_char(wt.created_at at time zone 'Africa/Nairobi', 'HH24:MI') as time,
  wt.cashier_name as cashier,
  (select string_agg(wti2.product_name || ' ×' || wti2.qty::text, ', ')
   from public.water_transaction_items wti2 where wti2.transaction_id = wt.id) as items,
  wt.total as amount,
  wt.method,
  wt.status
from public.water_transactions wt
order by wt.created_at desc;

create or replace view public.water_cashiers_live as
select
  wc.id, wc.vendor_id, wc.name, wc.phone, wc.shift, wc.status,
  coalesce(sum(wt.total) filter (where date_trunc('day', wt.created_at) = current_date), 0)::numeric as today_sales,
  count(wt.id) filter (where date_trunc('day', wt.created_at) = current_date)::int as txns
from public.water_cashiers wc
left join public.water_transactions wt on wt.cashier_name = wc.name and wt.vendor_id = wc.vendor_id
group by wc.id, wc.vendor_id, wc.name, wc.phone, wc.shift, wc.status;

create or replace view public.v_delivery_drivers_live as
  select id, vendor_id, name, phone, vehicle, trips, rating::numeric, status
  from public.delivery_drivers_full;

create or replace view public.v_delivery_dispatches_live as
  select id, vendor_id, product, driver, vehicle, customer,
         to_char(dispatched_at at time zone 'Africa/Nairobi', 'HH24:MI') as dispatched_at,
         to_char(delivered_at  at time zone 'Africa/Nairobi', 'HH24:MI') as delivered_at,
         to_char(returned_at   at time zone 'Africa/Nairobi', 'HH24:MI') as returned_at,
         status, litres, payment, paid
  from public.delivery_dispatches_full;

create or replace view public.delivery_kpis_live as
select
  dd.vendor_id,
  count(dd.id) filter (where date_trunc('day', dd.dispatched_at) = current_date)::int as dispatches_today,
  coalesce(sum(dd.litres) filter (where date_trunc('day', dd.dispatched_at) = current_date), 0)::int as litres_delivered,
  0::numeric as today_revenue,
  0::numeric as mpesa_today,
  0::numeric as cash_today,
  coalesce(sum(dbt.amount) filter (where dbt.status != 'paid'), 0)::numeric as pending_debt,
  0::numeric as credit_outstanding,
  coalesce(sum(dfl.amount) filter (where dfl.date = current_date), 0)::numeric as fuel_today,
  count(dd.id) filter (where dd.status = 'dispatched')::int as active_dispatches
from public.delivery_dispatches_full dd
left join public.delivery_debts dbt on dbt.vendor_id = dd.vendor_id
left join public.delivery_fuel_logs dfl on dfl.vendor_id = dd.vendor_id
group by dd.vendor_id;

create or replace view public.delivery_litres_by_day_live as
select vendor_id,
  to_char(date_trunc('day', dispatched_at), 'Dy') as day,
  coalesce(sum(litres), 0)::int as litres
from public.delivery_dispatches_full
where dispatched_at >= current_date - interval '6 days'
group by vendor_id, date_trunc('day', dispatched_at)
order by date_trunc('day', dispatched_at);

create or replace view public.delivery_gps_live as
select id, vendor_id, driver, lat, lng, speed, heading, status,
  to_char(last_ping at time zone 'Africa/Nairobi', 'HH24:MI') as last_ping
from public.delivery_gps_vehicles;

create or replace view public.platform_businesses_live as
select 'water' as id, 'Water Retail' as name,
  coalesce((select sum(wt.total) from public.water_transactions wt where date_trunc('day', wt.created_at) = current_date), 0)::numeric as today,
  coalesce((select count(*) from public.water_transactions wt where date_trunc('day', wt.created_at) = current_date), 0)::int as txns,
  'var(--color-chart-1)' as color
union all
select 'delivery', 'Water Delivery',
  coalesce((select sum(ddr.total) from public.delivery_daily_revenue_log ddr where ddr.date = current_date), 0)::numeric,
  coalesce((select count(*) from public.delivery_dispatches_full dd where date_trunc('day', dd.dispatched_at) = current_date), 0)::int,
  'var(--color-chart-2)';

create or replace view public.platform_activity_live as
select id::text, vendor_id,
  to_char(created_at at time zone 'Africa/Nairobi', 'HH24:MI') as time,
  'Water Retail' as business,
  'Sale KES ' || total::int || ' · ' || method as text,
  created_at
from public.water_transactions
order by created_at desc
limit 20;

-- ---------------------------------------------------------------------------
-- 9. RPCs
-- ---------------------------------------------------------------------------
create or replace function public.platform_pending_approvals()
returns integer language sql stable security definer set search_path = public as $$
  select (
    (select count(*) from public.water_stock_requests where status = 'pending') +
    (select count(*) from public.water_refunds where status = 'pending')
  )::int
$$;
grant execute on function public.platform_pending_approvals() to authenticated;

create or replace function public.platform_active_users()
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int from public.vendor_members
$$;
grant execute on function public.platform_active_users() to authenticated;
