-- ============================================================================
-- Water Retail v2 — adds vendor_id to all core tables so each vendor owns
-- their own products, customers, transactions and stock.
-- Run AFTER water-retail.sql and saas-multitenant.sql.
-- Safe to run multiple times (idempotent).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add vendor_id column to existing tables (if not already present)
-- ---------------------------------------------------------------------------
alter table public.water_customers
  add column if not exists vendor_id uuid references public.vendors(id) on delete cascade;

alter table public.water_products
  add column if not exists vendor_id uuid references public.vendors(id) on delete cascade;

alter table public.water_transactions
  add column if not exists vendor_id uuid references public.vendors(id) on delete cascade;

alter table public.water_transaction_items
  add column if not exists vendor_id uuid references public.vendors(id) on delete cascade;

-- ---------------------------------------------------------------------------
-- 2. Indexes on vendor_id for query performance
-- ---------------------------------------------------------------------------
create index if not exists water_customers_vendor_idx    on public.water_customers    (vendor_id);
create index if not exists water_products_vendor_idx     on public.water_products     (vendor_id);
create index if not exists water_transactions_vendor_idx on public.water_transactions (vendor_id);
create index if not exists water_tx_items_vendor_idx     on public.water_transaction_items (vendor_id);
create index if not exists water_tx_vendor_created_idx
  on public.water_transactions (vendor_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. Replace open RLS policies with vendor-scoped ones
-- ---------------------------------------------------------------------------
drop policy if exists water_customers_all          on public.water_customers;
drop policy if exists water_products_all           on public.water_products;
drop policy if exists water_transactions_all       on public.water_transactions;
drop policy if exists water_transaction_items_all  on public.water_transaction_items;

create policy water_customers_vendor on public.water_customers
  for all to authenticated
  using  (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
  with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));

create policy water_products_vendor on public.water_products
  for all to authenticated
  using  (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
  with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));

create policy water_transactions_vendor on public.water_transactions
  for all to authenticated
  using  (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
  with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));

create policy water_tx_items_vendor on public.water_transaction_items
  for all to authenticated
  using  (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
  with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- 4. Remove global seed products (no vendor_id = unusable under RLS)
-- ---------------------------------------------------------------------------
delete from public.water_transaction_items
  where product_id in (select id::text from public.water_products where vendor_id is null);

delete from public.water_products where vendor_id is null;

-- ---------------------------------------------------------------------------
-- 5. Convert water_products.id  text → uuid
--    AND water_transaction_items.product_id  text → uuid
--    Do both in the correct order: drop FK, cast columns, re-add FK.
-- ---------------------------------------------------------------------------
do $$
declare
  prod_id_type text;
  item_pid_type text;
begin
  -- Check current types
  select data_type into prod_id_type
    from information_schema.columns
   where table_schema = 'public' and table_name = 'water_products' and column_name = 'id';

  select data_type into item_pid_type
    from information_schema.columns
   where table_schema = 'public' and table_name = 'water_transaction_items' and column_name = 'product_id';

  -- Only run if products.id is still text
  if prod_id_type = 'text' then

    -- Step 1: drop the FK from transaction_items → products
    alter table public.water_transaction_items
      drop constraint if exists water_transaction_items_product_id_fkey;

    -- Step 2: convert transaction_items.product_id to uuid
    --   (all existing rows were deleted above so the cast is safe)
    alter table public.water_transaction_items
      alter column product_id type uuid using null::uuid;

    -- Step 3: drop old PK on products
    alter table public.water_products drop constraint if exists water_products_pkey;

    -- Step 4: add new uuid id column, populate, promote to PK
    alter table public.water_products add column if not exists new_uuid_id uuid default gen_random_uuid();
    update public.water_products set new_uuid_id = gen_random_uuid() where new_uuid_id is null;
    alter table public.water_products rename column id to old_text_id;
    alter table public.water_products rename column new_uuid_id to id;
    alter table public.water_products add primary key (id);
    alter table public.water_products drop column if exists old_text_id;

    -- Step 5: now both sides are uuid — safe to add FK back
    alter table public.water_transaction_items
      add constraint water_transaction_items_product_id_fkey
      foreign key (product_id) references public.water_products(id) on delete restrict;

  elsif item_pid_type = 'text' then
    -- products.id already uuid but product_id is still text — cast it alone
    alter table public.water_transaction_items
      drop constraint if exists water_transaction_items_product_id_fkey;
    alter table public.water_transaction_items
      alter column product_id type uuid using null::uuid;
    alter table public.water_transaction_items
      add constraint water_transaction_items_product_id_fkey
      foreign key (product_id) references public.water_products(id) on delete restrict;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Remove any unit check constraint (vendors choose their own units)
-- ---------------------------------------------------------------------------
do $$
declare cname text;
begin
  -- Find only CHECK constraints (not not-null or pk) that mention unit values
  select tc.constraint_name into cname
    from information_schema.table_constraints tc
    join information_schema.check_constraints cc
      on cc.constraint_name = tc.constraint_name
     and cc.constraint_schema = tc.constraint_schema
   where tc.table_schema = 'public'
     and tc.table_name   = 'water_products'
     and tc.constraint_type = 'CHECK'
     and cc.check_clause ilike '%unit%'
     and cc.check_clause not ilike '%not null%'
   limit 1;
  if cname is not null then
    execute 'alter table public.water_products drop constraint ' || quote_ident(cname);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 7. Recreate views so they reference vendor_id correctly
-- ---------------------------------------------------------------------------
create or replace view public.water_kpis as
select
  wt.vendor_id,
  coalesce(sum(wt.total) filter (where date_trunc('day', wt.created_at) = current_date), 0)::numeric as today_revenue,
  coalesce(sum(wti.qty)  filter (where date_trunc('day', wt.created_at) = current_date), 0)::numeric as today_litres,
  count(wt.id) filter (where date_trunc('day', wt.created_at) = current_date)::int as txns,
  (select count(*) from public.water_stock_requests wsr
   where wsr.vendor_id = wt.vendor_id and wsr.status = 'pending')::int as pending_requests,
  (select count(*) from public.water_products wp
   where wp.vendor_id = wt.vendor_id and wp.stock <= wp.reorder)::int as low_stock_items,
  (select count(*) from public.water_cashiers wc
   where wc.vendor_id = wt.vendor_id and wc.status = 'on_shift')::int as cashiers_on_shift
from public.water_transactions wt
left join public.water_transaction_items wti on wti.transaction_id = wt.id
group by wt.vendor_id;

create or replace view public.water_hourly_sales as
select
  wt.vendor_id,
  lpad(extract(hour from wt.created_at)::text, 2, '0') as hour,
  coalesce(sum(wti.qty), 0)::int      as litres,
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
   from public.water_transaction_items wti2
   where wti2.transaction_id = wt.id) as items,
  wt.total  as amount,
  wt.method,
  wt.status
from public.water_transactions wt
order by wt.created_at desc;
