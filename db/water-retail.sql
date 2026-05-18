-- ============================================================================
-- Water Retail schema
-- Run this in your Supabase project (SQL editor) once .env is wired.
-- Tables: water_customers, water_products, water_transactions, water_transaction_items
-- ============================================================================

create extension if not exists "pgcrypto";

-- Customers
create table if not exists public.water_customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text,
  type        text not null default 'Walk-in' check (type in ('Walk-in','Estate','Business','Institution')),
  visits      integer not null default 0,
  spent       numeric(12,2) not null default 0,
  balance     numeric(12,2) not null default 0,          -- positive = store credit owed TO customer
  last_visit  date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists water_customers_name_idx on public.water_customers (lower(name));
create index if not exists water_customers_phone_idx on public.water_customers (phone);

-- Products
create table if not exists public.water_products (
  id        text primary key,
  sku       text not null unique,
  name      text not null,
  category  text not null check (category in ('REFILL','NEW','CAPS','PET','JERRICAN')),
  price     numeric(10,2),
  stock     integer not null default 0,
  reorder   integer not null default 0,
  unit      text not null default 'bottle'
);

-- Transactions
create table if not exists public.water_transactions (
  id              uuid primary key default gen_random_uuid(),
  customer_id     uuid references public.water_customers(id) on delete set null,
  cashier_name    text,
  subtotal        numeric(12,2) not null,
  discount_pct    numeric(5,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  credit_applied  numeric(12,2) not null default 0,
  total           numeric(12,2) not null,
  amount_paid     numeric(12,2) not null,
  overpayment     numeric(12,2) not null default 0,
  method          text not null check (method in ('cash','mpesa')),
  status          text not null default 'paid' check (status in ('paid','refunded','void')),
  created_at      timestamptz not null default now()
);
create index if not exists water_tx_created_idx on public.water_transactions (created_at desc);
create index if not exists water_tx_customer_idx on public.water_transactions (customer_id);

create table if not exists public.water_transaction_items (
  id              uuid primary key default gen_random_uuid(),
  transaction_id  uuid not null references public.water_transactions(id) on delete cascade,
  product_id      text not null references public.water_products(id),
  product_name    text not null,
  unit_price      numeric(10,2) not null,
  qty             integer not null check (qty > 0),
  line_total      numeric(12,2) not null
);
create index if not exists water_tx_items_tx_idx on public.water_transaction_items (transaction_id);

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists water_customers_touch on public.water_customers;
create trigger water_customers_touch
  before update on public.water_customers
  for each row execute function public.touch_updated_at();

-- RLS — open to authenticated users (tighten with shop_id / role later)
alter table public.water_customers          enable row level security;
alter table public.water_products           enable row level security;
alter table public.water_transactions       enable row level security;
alter table public.water_transaction_items  enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array[
    'water_customers','water_products','water_transactions','water_transaction_items'
  ]) loop
    execute format('drop policy if exists %I on public.%I', t || '_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      t || '_all', t
    );
  end loop;
end $$;

-- Seed catalogue (idempotent)
insert into public.water_products (id, sku, name, category, price, stock, reorder, unit) values
  ('r-500',  'REF-500ML', '500 ml Refill',     'REFILL',   5,   220, 80, 'bottle'),
  ('r-1',    'REF-1L',    '1 L Refill',        'REFILL',  10,   160, 60, 'bottle'),
  ('r-1.5',  'REF-1.5L',  '1.5 L Refill',      'REFILL',  15,   120, 50, 'bottle'),
  ('r-2',    'REF-2L',    '2 L Refill',        'REFILL',  20,    96, 40, 'bottle'),
  ('r-3',    'REF-3L',    '3 L Refill',        'REFILL',  30,    72, 30, 'bottle'),
  ('r-5',    'REF-5L',    '5 L Refill',        'REFILL',  40,    64, 30, 'bottle'),
  ('r-10',   'REF-10L',   '10 L Refill',       'REFILL',  80,    48, 24, 'bottle'),
  ('r-20',   'REF-20L',   '20 L Refill',       'REFILL', 150,   142, 60, 'bottle'),
  ('n-500',  'NEW-500ML', '500 ml New Bottle', 'NEW',     30,    80, 40, 'bottle'),
  ('n-1',    'NEW-1L',    '1 L New Bottle',    'NEW',     50,    60, 30, 'bottle'),
  ('n-1.5',  'NEW-1.5L',  '1.5 L New Bottle',  'NEW',     50,    44, 24, 'bottle'),
  ('n-5',    'NEW-5L',    '5 L New Bottle',    'NEW',    150,    20, 12, 'bottle'),
  ('n-10',   'NEW-10L',   '10 L New Bottle',   'NEW',    280,    14, 10, 'bottle'),
  ('n-20',   'NEW-20L',   '20 L New Bottle',   'NEW',    450,    18, 10, 'bottle'),
  ('cap',    'CAP',       'Caps',              'CAPS',    20,   210,100, 'each'),
  ('pet-1',  'PET-1L',    'PET Bottle 1 L',    'PET',     40,    90, 40, 'bottle'),
  ('pet-1.5','PET-1.5L',  'PET Bottle 1.5 L',  'PET',     30,   110, 50, 'bottle'),
  ('pet-5',  'PET-5L',    'PET Bottle 5 L',    'PET',    110,    32, 20, 'bottle'),
  ('pet-10', 'PET-10L',   'PET Bottle 10 L',   'PET',    200,    18, 12, 'bottle'),
  ('pet-20', 'PET-20L',   'PET Bottle 20 L',   'PET',    300,    24, 12, 'bottle'),
  ('jer-5',  'JER-5L',    'Jerrican 5 L',      'JERRICAN', null, 22, 12, 'each'),
  ('jer-10', 'JER-10L',   'Jerrican 10 L',     'JERRICAN', null, 18, 10, 'each'),
  ('jer-20', 'JER-20L',   'Jerrican 20 L',     'JERRICAN', null, 12,  8, 'each')
on conflict (id) do nothing;
