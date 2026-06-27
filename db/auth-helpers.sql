-- ============================================================================
-- Login role-resolution helpers
-- Run AFTER db/saas-multitenant.sql.
-- ============================================================================

grant execute on function public.is_platform_admin(uuid) to authenticated, anon;

-- Drop old signature first so we can change the return type safely.
drop function if exists public.my_vendor_membership();

create or replace function public.my_vendor_membership()
returns table (
  vendor_id     uuid,
  role          public.app_role,
  vendor_name   text,
  business_type text,
  display_name  text
)
language sql stable security definer set search_path = public as $$
  select
    vm.vendor_id,
    vm.role,
    v.name as vendor_name,
    coalesce(vm.business_type, 'both') as business_type,
    coalesce(
      nullif(trim((auth.jwt()->'user_metadata'->>'name')::text), ''),
      split_part(auth.jwt()->>'email', '@', 1)
    ) as display_name
  from public.vendor_members vm
  join public.vendors v on v.id = vm.vendor_id
  where vm.user_id = auth.uid()
  order by vm.created_at asc
  limit 1
$$;

grant execute on function public.my_vendor_membership() to authenticated;

-- Convenience: resolve display name without fetching full membership.
drop function if exists public.my_display_name();

create or replace function public.my_display_name()
returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    nullif(trim((auth.jwt()->'user_metadata'->>'name')::text), ''),
    split_part(auth.jwt()->>'email', '@', 1)
  )
$$;

grant execute on function public.my_display_name() to authenticated;
