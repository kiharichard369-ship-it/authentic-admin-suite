// Mock data used across Super Admin pages until backend is wired.
// Multi-tenant: business arms are Water Retail + Water Delivery only.

export const businesses = [
  { id: "water", name: "Water Retail", today: 48200, txns: 132, color: "var(--color-chart-1)" },
  { id: "delivery", name: "Water Delivery", today: 18300, txns: 24, color: "var(--color-chart-2)" },
];

// Vendor-scoped sample shops (each shop belongs to one vendor)
export const shops = [
  { id: "s1", vendor: "Acme Maji Co.", name: "Kileleshwa Branch", location: "Kileleshwa, Nairobi", admin: "Mary Wanjiku", cashiers: 2, drivers: 1, status: "active", created: "2025-08-12" },
  { id: "s2", vendor: "Acme Maji Co.", name: "Westlands Branch",  location: "Westlands, Nairobi",   admin: "Peter Otieno",  cashiers: 3, drivers: 2, status: "active", created: "2025-09-01" },
  { id: "s3", vendor: "Blue Springs Water", name: "Karen Branch", location: "Karen, Nairobi",       admin: "—",             cashiers: 1, drivers: 1, status: "inactive", created: "2026-01-04" },
];

export const users = [
  { id: "u1", name: "Mary Wanjiku",  email: "mary@acme.mirie.co.ke",   role: "water_admin",   business: "Water Retail",   vendor: "Acme Maji Co.",     shop: "Kileleshwa", status: "active",   lastLogin: "2026-05-11 08:14" },
  { id: "u2", name: "Peter Otieno",  email: "peter@acme.mirie.co.ke",  role: "water_admin",   business: "Water Retail",   vendor: "Acme Maji Co.",     shop: "Westlands",  status: "active",   lastLogin: "2026-05-11 07:42" },
  { id: "u3", name: "Grace Mumbi",   email: "grace@acme.mirie.co.ke",  role: "water_cashier", business: "Water Retail",   vendor: "Acme Maji Co.",     shop: "Kileleshwa", status: "active",   lastLogin: "2026-05-11 06:55" },
  { id: "u4", name: "Daniel Kiprop", email: "daniel@acme.mirie.co.ke", role: "driver",        business: "Water Delivery", vendor: "Acme Maji Co.",     shop: "Westlands",  status: "active",   lastLogin: "2026-05-11 05:30" },
  { id: "u5", name: "Aisha Noor",    email: "aisha@blue.mirie.co.ke",  role: "vendor_admin",  business: "—",              vendor: "Blue Springs Water", shop: "—",         status: "active",   lastLogin: "2026-05-11 09:01" },
  { id: "u6", name: "John Mwangi",   email: "john@blue.mirie.co.ke",   role: "driver",        business: "Water Delivery", vendor: "Blue Springs Water", shop: "Karen",     status: "inactive", lastLogin: "2026-04-22 19:00" },
];

export const recentActivity = [
  { id: 1, time: "10:42", business: "Water Retail",   text: "Sale KES 1,200 · Kileleshwa · M-Pesa" },
  { id: 2, time: "10:31", business: "Water Delivery", text: "Delivery 600L · Spring Valley" },
  { id: 3, time: "10:18", business: "Water Retail",   text: "New customer added · Karen Estate" },
  { id: 4, time: "10:08", business: "Water Retail",   text: "Stock request submitted · Westlands" },
  { id: 5, time: "09:55", business: "Water Delivery", text: "Driver checked in · KCB 412Y" },
  { id: 6, time: "09:40", business: "Water Retail",   text: "Sale KES 350 · Kileleshwa · Cash" },
  { id: 7, time: "09:18", business: "Water Delivery", text: "Opening load 6,600L recorded" },
];

export const assets = [
  { id: "a1", name: "Lorry KCB 412Y",  type: "vehicle",   shop: "Kileleshwa", status: "in_transit", added: "2025-07-19", mileage: 84210, lastService: "2026-04-02" },
  { id: "a2", name: "Lorry KDA 905T",  type: "vehicle",   shop: "Westlands",  status: "at_depot",   added: "2025-09-23", mileage: 41020, lastService: "2026-03-18" },
  { id: "a3", name: "Bottle Sealer #2", type: "equipment", shop: "Kileleshwa", status: "active",    added: "2025-08-01" },
  { id: "a4", name: "Filtration Unit B", type: "equipment", shop: "Karen",    status: "active",    added: "2025-06-11" },
];

export const expenses = [
  { id: "e1", date: "2026-05-11", staff: "Daniel Kiprop", shop: "Westlands",  category: "Fuel",    description: "Diesel 45L",   amount: 7200, status: "logged" },
  { id: "e2", date: "2026-05-10", staff: "Daniel Kiprop", shop: "Westlands",  category: "Repairs", description: "Tyre puncture", amount: 1500, status: "reviewed" },
  { id: "e3", date: "2026-05-10", staff: "Joseph Maina",  shop: "Kileleshwa", category: "Other",   description: "Parking fees",  amount:  300, status: "rejected" },
  { id: "e4", date: "2026-05-09", staff: "Daniel Kiprop", shop: "Westlands",  category: "Fuel",    description: "Diesel 30L",   amount: 4800, status: "reviewed" },
];

export const pendingApprovals = 5;
export const activeUsers = 14;
