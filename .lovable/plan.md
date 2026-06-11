## Goal

Every page reads from Supabase when `VITE_SUPABASE_URL` + key are present in `.env`. When they aren't, the same calls fall back to the current in-memory mocks so the demo keeps working. No page imports a mock module directly anymore.

Butchery / restaurant / `rb-*` references are already fully removed from `src/` and `db/` — no further purge needed.

## 1. Data layer (three modules, mirrors `water-data.ts` pattern)

Already exists:
- `src/lib/water-data.ts` — customers, products, sales. Extend with: `listSales`, `listRefunds`, `listStockRequests`, `listExpenses`, `listCashiers`, `revenueByDay`.

New:
- `src/lib/delivery-data.ts` — `listDrivers`, `listVehicles`, `listDispatches`, `listDebts`, `listCredits`, `listFuelLogs`, `revenueByDay`, `fleetSummary`, `gpsPings`.
- `src/lib/platform-data.ts` — `listShops`, `listUsers`, `listAssets`, `listPlatformExpenses`, `listBusinesses`, `listRecentActivity`, `dashboardKpis`, `analyticsSeries`.

Each function:
```ts
if (!hasSupabase || !supabase) return mockFallback;
const { data, error } = await supabase.from("<table>").select(...);
if (error) throw error;
return map(data);
```

## 2. Schema additions

Append to `db/water-retail.sql` (or new `db/delivery-retail.sql` + `db/platform.sql`) — vendor-scoped tables for everything the routes consume:

```
delivery_drivers, delivery_vehicles, delivery_dispatches, delivery_dispatch_drops,
delivery_debts, delivery_credits, delivery_fuel_logs, delivery_gps_pings,
water_refunds, water_stock_requests, water_expenses, water_cashiers,
platform_shops, platform_users, platform_assets, platform_expenses,
platform_activity
```

All carry `vendor_id`, ship with `GRANT` + RLS using `current_vendor_id()` / `is_platform_admin()` (same pattern as `saas-multitenant.sql`).

## 3. Route refactor (27 files)

Each route currently does:
```tsx
import { drivers, fuelLogs } from "@/lib/delivery-mock";
function Page() { return <Table rows={drivers} ... /> }
```

Becomes:
```tsx
import { useQuery } from "@tanstack/react-query";
import { listDrivers } from "@/lib/delivery-data";
function Page() {
  const { data: drivers = [], isLoading } = useQuery({ queryKey: ["drivers"], queryFn: listDrivers });
  if (isLoading) return <Skeleton />;
  return <Table rows={drivers} ... />;
}
```

No mock imports remain in `src/routes/**`. `water-mock.ts`, `delivery-mock.ts`, `mock-data.ts` stay as the fallback data the data-layer modules re-export when `!hasSupabase`.

Files touched:
- All 10 `water-admin.*.tsx` routes
- All 9 `delivery-admin.*.tsx` routes
- All 8 `super-admin.*.tsx` routes that import mocks
- Layout files (`water-admin.tsx`, `delivery-admin.tsx`) use `useQuery` for header summaries

## 4. Env wiring (already done — verify)

`.env.example` already has `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`. User copies to `.env`, restarts dev, and the app flips to live data automatically — no code change.

## Technical notes

- Keep mock files; do not delete. They are the fallback source the data layer uses when `hasSupabase` is false. This preserves the "works without backend" demo mode.
- Query keys are namespaced (`["water","customers"]`, `["delivery","drivers"]`, `["platform","shops"]`) so `queryClient.invalidateQueries({ queryKey: ["water"] })` works after a write.
- Mutations (create customer, record sale, etc.) call data-layer functions and then `invalidateQueries` — current `recordSale` already does this implicitly via re-fetch; add explicit invalidation in the calling component.
- Vendor scoping is enforced server-side via RLS; client passes no `vendor_id` filter. Mock fallback returns all mock rows (single-tenant demo).
- Schema files only need to be run once by the user in the Supabase SQL editor. Order: `water-retail.sql` → `delivery-retail.sql` → `platform.sql` → `saas-multitenant.sql`.

## Out of scope

- Realtime subscriptions (poll/invalidate is enough for v1).
- Mutations for platform tables (users, shops, assets) beyond what already exists.
- Replacing `mock-data.ts` with seed-data SQL inserts (user can seed manually).
