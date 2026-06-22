-- ============================================================================
-- Super-admin onboarding RPC
-- Run AFTER db/saas-multitenant.sql and db/auth-helpers.sql.
-- Lets a platform admin create a vendor and assign its first vendor_admin
-- (an existing auth user, looked up by email) in a single transaction.
-- ============================================================================

create or replace function public.create_vendor_with_admin(
  p_name           text,
  p_slug           text,
  p_plan           public.vendor_plan,
  p_contact_email  text,
  p_contact_phone  text,
  p_admin_email    text
)
returns table (vendor_id uuid, admin_user_id uuid)
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

  -- Resolve the admin user by email from auth.users.
  select id into v_admin_uid
    from auth.users
   where lower(email) = lower(p_admin_email)
   limit 1;

  if v_admin_uid is null then
    raise exception 'no auth user found for email %', p_admin_email
      using errcode = 'P0002',
            hint = 'Create the user in Authentication > Users first, then re-run onboarding.';
  end if;

  insert into public.vendors (name, slug, plan, contact_email, contact_phone, status)
       values (p_name, p_slug, coalesce(p_plan, 'starter'),
               p_contact_email, nullif(p_contact_phone, ''), 'active')
    returning id into v_vendor_id;

  insert into public.vendor_members (vendor_id, user_id, role)
       values (v_vendor_id, v_admin_uid, 'vendor_admin')
  on conflict (vendor_id, user_id) do update set role = excluded.role;

  return query select v_vendor_id, v_admin_uid;
end
$$;

grant execute on function public.create_vendor_with_admin(
  text, text, public.vendor_plan, text, text, text
) to authenticated;

-- Helper for the wizard's "user lookup" step.
create or replace function public.find_auth_user_by_email(p_email text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

grant execute on function public.find_auth_user_by_email(text) to authenticated;

-- Optional convenience: how many vendors does the platform have?
-- Used by the super-admin dashboard to show a "Get started" CTA on day 1.
create or replace function public.platform_vendor_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from public.vendors;
$$;

grant execute on function public.platform_vendor_count() to authenticated;
