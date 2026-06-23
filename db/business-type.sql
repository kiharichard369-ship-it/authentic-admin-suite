-- ============================================================================
-- Per-vendor business type
-- Run AFTER db/saas-multitenant.sql, db/auth-helpers.sql and db/onboarding.sql.
-- Adds vendors.business_type so each tenant is registered as a water retailer,
-- a delivery operator, or both. The login flow uses this to land vendor_admins
-- on the correct workspace.
-- ============================================================================

do $$ begin
  create type public.business_type as enum ('water','delivery','both');
exception when duplicate_object then null; end $$;

alter table public.vendors
  add column if not exists business_type public.business_type not null default 'both';

-- ---------------------------------------------------------------------------
-- Refresh my_vendor_membership to expose business_type.
-- ---------------------------------------------------------------------------
drop function if exists public.my_vendor_membership();

create or replace function public.my_vendor_membership()
returns table (
  vendor_id      uuid,
  role           public.app_role,
  vendor_name    text,
  business_type  public.business_type
)
language sql stable security definer set search_path = public as $$
  select vm.vendor_id, vm.role, v.name as vendor_name, v.business_type
    from public.vendor_members vm
    join public.vendors v on v.id = vm.vendor_id
   where vm.user_id = auth.uid()
   order by vm.created_at asc
   limit 1
$$;

grant execute on function public.my_vendor_membership() to authenticated;

-- ---------------------------------------------------------------------------
-- Replace onboarding RPC with one that accepts business_type.
-- ---------------------------------------------------------------------------
drop function if exists public.create_vendor_with_admin(
  text, text, public.vendor_plan, text, text, text
);
drop function if exists public.create_vendor_with_admin(
  text, text, public.vendor_plan, text, text, text, public.business_type
);

create or replace function public.create_vendor_with_admin(
  p_name           text,
  p_slug           text,
  p_plan           public.vendor_plan,
  p_contact_email  text,
  p_contact_phone  text,
  p_admin_email    text,
  p_business_type  public.business_type
)
returns table (out_vendor_id uuid, out_admin_user_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller     uuid := auth.uid();
  v_admin_uid  uuid;
  v_vendor_id  uuid;
begin
  if v_caller is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if not public.is_platform_admin(v_caller) then
    raise exception 'only platform admins can create vendors' using errcode = '42501';
  end if;

  select u.id into v_admin_uid
    from auth.users u
   where lower(u.email) = lower(p_admin_email)
   limit 1;

  if v_admin_uid is null then
    raise exception 'no auth user found for email %', p_admin_email
      using errcode = 'P0002',
            hint = 'Create the user in Authentication > Users first, then re-run onboarding.';
  end if;

  insert into public.vendors (name, slug, plan, contact_email, contact_phone, status, business_type)
       values (p_name, p_slug, coalesce(p_plan, 'starter'),
               p_contact_email, nullif(p_contact_phone, ''), 'active',
               coalesce(p_business_type, 'both'))
    returning id into v_vendor_id;

  insert into public.vendor_members as vm (vendor_id, user_id, role)
       values (v_vendor_id, v_admin_uid, 'vendor_admin')
  on conflict (vendor_id, user_id) do update set role = excluded.role;

  return query select v_vendor_id, v_admin_uid;
end
$$;

grant execute on function public.create_vendor_with_admin(
  text, text, public.vendor_plan, text, text, text, public.business_type
) to authenticated;
