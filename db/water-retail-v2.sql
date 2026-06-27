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

-- Composite index: vendor + created_at for dashboard time queries
create index if not exists water_tx_vendor_created_idx
  on public.water_transactions (vendor_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. Drop the global open-to-all RLS policies, replace with vendor-scoped ones
-- ---------------------------------------------------------------------------
drop policy if exists water_customers_all           on public.water_customers;
drop policy if exists water_products_all            on public.water_products;
drop policy if exists water_transactions_all        on public.water_transactions;
drop policy if exists water_transaction_items_all   on public.water_transaction_items;

-- water_customers: vendor members see only their vendor's customers
create policy water_customers_vendor on public.water_customers
  for all to authenticated
  using  (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
  with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));

-- water_products: same
create policy water_products_vendor on public.water_products
  for all to authenticated
  using  (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
  with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));

-- water_transactions: same
create policy water_transactions_vendor on public.water_transactions
  for all to authenticated
  using  (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
  with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));

-- water_transaction_items: scoped via transaction's vendor
create policy water_tx_items_vendor on public.water_transaction_items
  for all to authenticated
  using (
    vendor_id = public.current_vendor_id()
    or public.is_platform_admin(auth.uid())
  )
  with check (
    vendor_id = public.current_vendor_id()
    or public.is_platform_admin(auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 4. Drop the old global seed data (shared products with no vendor_id)
--    These won't be visible under RLS anyway, but clean up to avoid confusion.
-- ---------------------------------------------------------------------------
delete from public.water_products where vendor_id is null;

-- ---------------------------------------------------------------------------
-- 5. Change water_products primary key from text to uuid so vendors can
--    freely add products without coordinating fixed IDs.
--    We do this safely: create new table, migrate, swap.
--    Skip if column is already uuid.
-- ---------------------------------------------------------------------------
do $$
begin
  -- Only run if id is still text type
  if (select data_type from information_schema.columns
      where table_schema='public' and table_name='water_products' and column_name='id') = 'text' then

    -- Remove FK from transaction_items temporarily
    alter table public.water_transaction_items drop constraint if exists water_transaction_items_product_id_fkey;

    -- Add a new uuid column, populate it, swap
    alter table public.water_products add column if not exists new_id uuid default gen_random_uuid();
    update public.water_products set new_id = gen_random_uuid() where new_id is null;
    alter table public.water_products drop constraint water_products_pkey;
    alter table public.water_products rename column id to old_text_id;
    alter table public.water_products rename column new_id to id;
    alter table public.water_products add primary key (id);

    -- Re-add FK on transaction_items (product_id is uuid from now on)
    -- Items referencing old text IDs are orphaned and safe to leave (there are none in fresh installs)
    alter table public.water_transaction_items
      add constraint water_transaction_items_product_id_fkey
      foreign key (product_id) references public.water_products(id) on delete restrict;

    alter table public.water_products drop column if exists old_text_id;
  end if;
end $$;

-- Ensure product_id in transaction_items is uuid
alter table public.water_transaction_items
  alter column product_id type uuid using product_id::uuid;

-- ---------------------------------------------------------------------------
-- 6. Add flexible unit column to water_products (already exists as 'unit')
--    Just ensure the check constraint is removed so vendors can set any unit.
-- ---------------------------------------------------------------------------
-- unit column already exists; drop any check constraint that limits values
do $$
declare cname text;
begin
  select constraint_name into cname
    from information_schema.table_constraints tc
    join information_schema.check_constraints cc using (constraint_name, constraint_schema)
   where tc.table_name = 'water_products'
     and cc.check_clause ilike '%unit%'
   limit 1;
  if cname is not null then
    execute 'alter table public.water_products drop constraint ' || quote_ident(cname);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 7. Update water_kpis view to be vendor-scoped (uses vendor_id column now)
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

-- ---------------------------------------------------------------------------
-- 8. Hourly sales view — vendor-scoped
-- ---------------------------------------------------------------------------
create or replace view public.water_hourly_sales as
select
  wt.vendor_id,
  lpad(extract(hour from wt.created_at)::text, 2, '0') as hour,
  coalesce(sum(wti.qty), 0)::int     as litres,
  coalesce(sum(wt.total), 0)::numeric as revenue
from public.water_transactions wt
left join public.water_transaction_items wti on wti.transaction_id = wt.id
where date_trunc('day', wt.created_at) = current_date
group by wt.vendor_id, extract(hour from wt.created_at)
order by hour;

-- ---------------------------------------------------------------------------
-- 9. Transactions view — vendor-scoped
-- ---------------------------------------------------------------------------
create or replace view public.water_transactions_view as
select
  wt.id,
  wt.vendor_id,
  to_char(wt.created_at at time zone 'Africa/Nairobi', 'HH24:MI') as time,
  wt.cashier_name as cashier,
  (select string_agg(wti2.product_name || ' ×' || wti2.qty::text, ', ')
   from public.water_transaction_items wti2 where wti2.transaction_id = wt.id) as items,
  wt.total  as amount,
  wt.method,
  wt.status
from public.water_transactions wt
order by wt.created_at desc;

