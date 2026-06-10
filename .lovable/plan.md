## Goal

Strip R&B Take-away from the app and turn the remaining Water Retail + Delivery product into a multi-tenant SaaS where each **vendor** (tenant) has isolated data, users, and operations. The platform Super Admin provisions vendors.

## 1. Remove R&B (Restaurant & Butchery)

Delete:
- `src/routes/rb-admin.*` (all 7 files)
- `src/components/rb-admin/` (folder)
- `src/lib/rb-mock.ts`

Update:
- `src/lib/auth.ts` — remove `rb_manager`, `rb_cashier` roles, all `rb.*` permissions, `ROLE_HOME`/`ROLE_LABEL` entries, and the `rb`/`rbcashier` email map entries.
- `src/components/super-admin/Sidebar.tsx` — remove any R&B links if present.
- `src/routes/login.tsx` — remove R&B demo login buttons.
- `src/routes/super-admin.dashboard.tsx` / `super-admin.analytics.tsx` / `super-admin.shops.tsx` / `super-admin.debts.tsx` / `super-admin.reports.tsx` — strip R&B aggregates; keep only Water + Delivery.
- Regenerate `src/routeTree.gen.ts` to drop rb-admin routes.

## 2. Multi-tenancy data model

New core concept: **vendor** (= tenant). Each vendor owns shops, customers, products, sales, drivers, dispatches, etc. Every row carries `vendor_id`.

New migration `db/saas-multitenant.sql` (user runs in their Supabase SQL editor):

```text
vendors(id, name, slug, status[active|suspended|pending], plan, created_at)
vendor_members(id, vendor_id, user_id, role[vendor_admin|water_admin|water_cashier|driver], created_at)
platform_admins(user_id)             -- super admin allowlist
app_role enum                         -- super_admin, vendor_admin, water_admin, water_cashier, driver
```

Then extend existing Water tables with `vendor_id uuid not null references vendors(id)` and rebuild RLS:

- All `water_*` tables: SELECT/INSERT/UPDATE/DELETE only when `vendor_id = current_vendor_id()` OR caller is platform admin.
- `current_vendor_id()` security-definer function reads from `vendor_members` for `auth.uid()` (single active membership for v1; pick first if multiple).
- `is_platform_admin(uid)` security-definer checks `platform_admins`.
- GRANT SELECT/INSERT/UPDATE/DELETE on every public table to `authenticated`; GRANT ALL to `service_role`. No `anon` grants.

Add same `vendor_id` column + RLS to new delivery tables we introduce later (out of scope to wire fully now — schema stub only).

## 3. Auth + role layer

Rewrite `src/lib/auth.ts`:
- Roles: `super_admin`, `vendor_admin`, `water_admin`, `water_cashier`, `driver`.
- Session shape adds `vendorId: string | null` and `vendorName: string | null`.
- `vendor_admin` perms = all `water.*` + all `delivery.*` for their tenant.
- `super_admin` perms unchanged (platform-wide).
- `ROLE_HOME` maps `vendor_admin` → `/vendor/dashboard`.

Login (`src/routes/login.tsx`):
- Real Supabase email/password auth when `hasSupabase`, fallback to current mock.
- After sign-in, look up vendor membership and platform admin status to derive role + vendorId; persist via `setSession`.

## 4. Super Admin: vendor management

New route `src/routes/super-admin.vendors.tsx`:
- List all vendors (name, slug, plan, status, member count, created).
- "Create vendor" dialog: name, slug, plan, initial vendor_admin email.
  - Calls server fn `createVendor` which:
    1. Inserts `vendors` row.
    2. Sends magic-link invite (or creates user with temp password via admin API) to the supplied email.
    3. Inserts `vendor_members(vendor_id, user_id, role='vendor_admin')`.
- Per-row actions: suspend / reactivate / open as (impersonate read-only) / view members.

Add server fns in `src/lib/vendors.functions.ts`:
- `listVendors`, `createVendor`, `setVendorStatus`, `listVendorMembers`, `inviteVendorMember`, `removeVendorMember`.
All gated by `requireSupabaseAuth` + `is_platform_admin` check.

Sidebar: add "Vendors" entry; remove R&B residue.

Replace `super-admin.shops.tsx` rollup so it aggregates across **vendors** (each vendor's water + delivery KPIs).

## 5. Vendor workspace

New layout `src/routes/vendor.tsx` (analogous to current `water-admin.tsx`) with:
- Sidebar showing Water + Delivery sections under one tenant.
- Header shows vendor name + role chip.

For v1, repoint existing water-admin and delivery-admin routes to live under `/vendor/water/*` and `/vendor/delivery/*` (rename files via `mv`), and update `WaterAdminSidebar`/`DeliveryAdminSidebar` `to=` props. Keep current Super Admin routes untouched.

Data layer (`src/lib/water-data.ts`, future delivery equivalents):
- Every query filters by `vendor_id = session.vendorId` (RLS enforces it server-side; client filter is for clarity + mock fallback).
- `recordSale`, `createCustomer`, etc. inject `vendor_id` on insert.

## 6. Files touched (summary)

Deleted: 7 rb-admin routes, `src/components/rb-admin/`, `src/lib/rb-mock.ts`.
Renamed: `water-admin.*` → `vendor.water.*`, `delivery-admin.*` → `vendor.delivery.*` (and `*.tsx` layout files).
New: `db/saas-multitenant.sql`, `src/routes/super-admin.vendors.tsx`, `src/routes/vendor.tsx`, `src/lib/vendors.functions.ts`, `src/components/vendor/Sidebar.tsx`.
Edited: `auth.ts`, `login.tsx`, super-admin sidebar + dashboard + shops + debts + analytics + reports, `water-data.ts`, `__root.tsx`, `routeTree.gen.ts`.

## Technical notes

- Backend stays Supabase via user-provided `.env` (per prior decision). When `hasSupabase` is false, the app continues in mock mode but vendor switching uses an in-memory mock vendor `demo`.
- RLS is the single source of truth. Server fns prefer the user-scoped client from `requireSupabaseAuth`; admin client is used only inside `createVendor` for the auth admin API (invite user, set custom claim `vendor_id`).
- JWT custom claim `vendor_id` is set on the user via `auth.admin.updateUserById({ app_metadata: { vendor_id }})` so RLS policies can read it via `auth.jwt() -> 'app_metadata' ->> 'vendor_id'` without an extra round-trip; `current_vendor_id()` reads that claim first, falls back to `vendor_members`.
- No data migration of existing mock seed data is required — fresh schema, user runs SQL once.

## Out of scope (call out to user after)

- Billing / Stripe per-vendor subscriptions.
- Vendor self-serve signup page.
- Delivery tables wired to Supabase (schema stub only; UI still on mocks).
- Per-vendor branding/theme.
