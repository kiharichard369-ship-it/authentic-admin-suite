-- ============================================================================
-- Water Branches + Branch Manager role + Payment config
-- Run AFTER all previous SQL files.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add water_branch_manager to the app_role enum
-- ---------------------------------------------------------------------------
do $$ begin
  alter type public.app_role add value if not exists 'water_branch_manager';
exception when others then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. water_branches — replaces the single water_branch config row per vendor
--    with a proper one-to-many branches table.
-- ---------------------------------------------------------------------------
create table if not exists public.water_branches (
  id              uuid primary key default gen_random_uuid(),
  vendor_id       uuid not null references public.vendors(id) on delete cascade,
  name            text not null,
  code            text,
  address         text,
  paybill         text,
  manager_user_id uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists water_branches_vendor_idx on public.water_branches (vendor_id);

alter table public.water_branches enable row level security;
drop policy if exists water_branches_vendor on public.water_branches;
create policy water_branches_vendor on public.water_branches
  for all to authenticated
  using  (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
  with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));

grant select, insert, update, delete on public.water_branches to authenticated;
grant all on public.water_branches to service_role;

-- Migrate existing water_branch rows (if any) into water_branches
insert into public.water_branches (vendor_id, name, code, address, paybill)
select vendor_id, name, code, address, paybill
from public.water_branch wb
where not exists (
  select 1 from public.water_branches wb2 where wb2.vendor_id = wb.vendor_id
)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 3. Add branch_id to vendor_members
--    null  = user sees ALL branches within their vendor (owner / water_admin)
--    uuid  = user sees ONLY this branch (water_branch_manager / water_cashier)
-- ---------------------------------------------------------------------------
alter table public.vendor_members
  add column if not exists branch_id uuid references public.water_branches(id) on delete set null;

-- ---------------------------------------------------------------------------
-- 4. current_branch_id() — reads the caller's branch scope from vendor_members
--    Returns null if the user is a vendor-wide admin (sees all branches).
-- ---------------------------------------------------------------------------
create or replace function public.current_branch_id()
returns uuid language sql stable security definer set search_path = public as $$
  select branch_id
    from public.vendor_members
   where user_id   = auth.uid()
     and vendor_id = public.current_vendor_id()
   order by created_at asc
   limit 1
$$;

grant execute on function public.current_branch_id() to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Add branch_id to all water operational tables
-- ---------------------------------------------------------------------------
alter table public.water_transactions       add column if not exists branch_id uuid references public.water_branches(id) on delete set null;
alter table public.water_transaction_items  add column if not exists branch_id uuid references public.water_branches(id) on delete set null;
alter table public.water_products           add column if not exists branch_id uuid references public.water_branches(id) on delete set null;
alter table public.water_cashiers           add column if not exists branch_id uuid references public.water_branches(id) on delete set null;
alter table public.water_stock_requests     add column if not exists branch_id uuid references public.water_branches(id) on delete set null;
alter table public.water_branch_expenses    add column if not exists branch_id uuid references public.water_branches(id) on delete set null;
alter table public.water_refunds            add column if not exists branch_id uuid references public.water_branches(id) on delete set null;

create index if not exists water_tx_branch_idx       on public.water_transactions      (branch_id);
create index if not exists water_products_branch_idx on public.water_products          (branch_id);
create index if not exists water_cashiers_branch_idx on public.water_cashiers          (branch_id);

-- ---------------------------------------------------------------------------
-- 6. Update RLS on water operational tables to scope by branch_id when set
--    Rule:
--      • current_branch_id() IS NULL  → vendor-wide admin: see/write all rows for vendor
--      • current_branch_id() IS NOT NULL → branch manager: see/write only their branch
--      • platform_admin → see/write everything
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in select unnest(array[
    'water_transactions','water_transaction_items',
    'water_products','water_cashiers',
    'water_stock_requests','water_branch_expenses','water_refunds'
  ]) loop
    -- Drop old vendor-only policies
    execute format('drop policy if exists %I on public.%I', t || '_vendor',   t);
    execute format('drop policy if exists %I on public.%I', t || '_tenant',   t);
    execute format('drop policy if exists %I on public.%I', t || '_platform', t);
    execute format('drop policy if exists %I on public.%I', t || '_branch',   t);

    -- New branch-aware policy
    execute format($p$
      create policy %I on public.%I
      for all to authenticated
      using (
        public.is_platform_admin(auth.uid())
        or (
          vendor_id = public.current_vendor_id()
          and (
            public.current_branch_id() is null         -- vendor-wide admin sees all
            or branch_id = public.current_branch_id()  -- branch manager sees own branch
            or branch_id is null                       -- unassigned rows visible to all
          )
        )
      )
      with check (
        public.is_platform_admin(auth.uid())
        or (
          vendor_id = public.current_vendor_id()
          and (
            public.current_branch_id() is null
            or branch_id = public.current_branch_id()
          )
        )
      )
    $p$, t || '_branch', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 7. Update my_vendor_membership() RPC to also return branch_id
--    (needed so auth-login.ts can store it in the session)
-- ---------------------------------------------------------------------------
drop function if exists public.my_vendor_membership();
create or replace function public.my_vendor_membership()
returns table (
  vendor_id     uuid,
  role          public.app_role,
  vendor_name   text,
  business_type text,
  display_name  text,
  branch_id     uuid,
  branch_name   text
)
language sql stable security definer set search_path = public as $$
  select
    vm.vendor_id,
    vm.role,
    v.name        as vendor_name,
    coalesce(v.business_type, 'both') as business_type,
    coalesce(
      nullif(trim((auth.jwt()->'user_metadata'->>'name')::text), ''),
      split_part(auth.jwt()->>'email', '@', 1)
    ) as display_name,
    vm.branch_id,
    wb.name       as branch_name
  from public.vendor_members vm
  join public.vendors v        on v.id = vm.vendor_id
  left join public.water_branches wb on wb.id = vm.branch_id
  where vm.user_id = auth.uid()
  order by vm.created_at asc
  limit 1
$$;

grant execute on function public.my_vendor_membership() to authenticated;

-- ---------------------------------------------------------------------------
-- 8. water_payment_config — M-Pesa / payment settings per vendor
--    The POS reads from this table instead of .env
-- ---------------------------------------------------------------------------
create table if not exists public.water_payment_config (
  vendor_id         uuid primary key references public.vendors(id) on delete cascade,
  -- M-Pesa STK Push
  shortcode         text,          -- Paybill or Till number
  passkey           text,          -- Lipa na M-Pesa online passkey
  consumer_key      text,
  consumer_secret   text,
  callback_url      text,
  environment       text not null default 'sandbox' check (environment in ('sandbox','production')),
  -- Enabled methods
  mpesa_enabled     boolean not null default true,
  cash_enabled      boolean not null default true,
  -- Display info shown on the POS payment prompt
  paybill_display   text,          -- e.g. "Pay to: 247247"
  account_display   text,          -- e.g. "Account: UHAI"
  updated_at        timestamptz not null default now()
);

alter table public.water_payment_config enable row level security;
drop policy if exists water_payconfig_vendor on public.water_payment_config;
create policy water_payconfig_vendor on public.water_payment_config
  for all to authenticated
  using  (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()))
  with check (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));

-- Branch managers and cashiers can SELECT (to show payment prompt) but not modify
drop policy if exists water_payconfig_read on public.water_payment_config;
create policy water_payconfig_read on public.water_payment_config
  for select to authenticated
  using (vendor_id = public.current_vendor_id() or public.is_platform_admin(auth.uid()));

grant select on public.water_payment_config to authenticated;
grant insert, update, delete on public.water_payment_config to authenticated;
grant all on public.water_payment_config to service_role;

