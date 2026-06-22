-- ============================================================================
-- Login role-resolution helpers
-- Run AFTER db/saas-multitenant.sql.
-- These RPCs let the browser resolve a freshly-signed-in user's role without
-- being blocked by RLS on platform_admins / vendor_members.
-- ============================================================================

-- Make sure the existing helper is callable from the browser.
grant execute on function public.is_platform_admin(uuid) to authenticated, anon;

-- Return the caller's first vendor membership (role + vendor_id + vendor name).
create or replace function public.my_vendor_membership()
returns table (vendor_id uuid, role public.app_role, vendor_name text)
language sql stable security definer set search_path = public as $$
  select vm.vendor_id, vm.role, v.name as vendor_name
    from public.vendor_members vm
    join public.vendors v on v.id = vm.vendor_id
   where vm.user_id = auth.uid()
   order by vm.created_at asc
   limit 1
$$;

grant execute on function public.my_vendor_membership() to authenticated;
