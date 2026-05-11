// Mock data used across Super Admin pages until backend is wired.

export const businesses = [
  { id: "water", name: "Water Retail", today: 48200, txns: 132, color: "var(--color-chart-1)" },
  { id: "rb", name: "Restaurant & Butchery", today: 36750, txns: 89, color: "var(--color-chart-2)" },
  { id: "delivery", name: "Water Delivery", today: 18300, txns: 24, color: "var(--color-chart-3)" },
];

export const shops = [
  { id: "s1", name: "Kileleshwa Branch", location: "Kileleshwa, Nairobi", admin: "Mary Wanjiku", cashiers: 2, drivers: 1, status: "active", created: "2025-08-12" },
  { id: "s2", name: "Westlands Branch", location: "Westlands, Nairobi", admin: "Peter Otieno", cashiers: 3, drivers: 2, status: "active", created: "2025-09-01" },
  { id: "s3", name: "Karen Branch", location: "Karen, Nairobi", admin: "—", cashiers: 1, drivers: 1, status: "inactive", created: "2026-01-04" },
];

export const users = [
  { id: "u1", name: "Mary Wanjiku", email: "mary@platform.co.ke", role: "water_admin", business: "Water Retail", shop: "Kileleshwa", status: "active", lastLogin: "2026-05-11 08:14" },
  { id: "u2", name: "Peter Otieno", email: "peter@platform.co.ke", role: "water_admin", business: "Water Retail", shop: "Westlands", status: "active", lastLogin: "2026-05-11 07:42" },
  { id: "u3", name: "Grace Mumbi", email: "grace@platform.co.ke", role: "water_cashier", business: "Water Retail", shop: "Kileleshwa", status: "active", lastLogin: "2026-05-11 06:55" },
  { id: "u4", name: "Daniel Kiprop", email: "daniel@platform.co.ke", role: "driver", business: "Water Delivery", shop: "Westlands", status: "active", lastLogin: "2026-05-11 05:30" },
  { id: "u5", name: "Aisha Noor", email: "aisha@platform.co.ke", role: "rb_admin", business: "Restaurant & Butchery", shop: "—", status: "active", lastLogin: "2026-05-10 21:09" },
  { id: "u6", name: "John Mwangi", email: "john@platform.co.ke", role: "waiter", business: "Restaurant & Butchery", shop: "—", status: "inactive", lastLogin: "2026-04-22 19:00" },
  { id: "u7", name: "Lucy Achieng", email: "lucy@platform.co.ke", role: "kitchen", business: "Restaurant & Butchery", shop: "—", status: "active", lastLogin: "2026-05-11 11:02" },
  { id: "u8", name: "Samuel Kuria", email: "sam@platform.co.ke", role: "butcher", business: "Restaurant & Butchery", shop: "—", status: "active", lastLogin: "2026-05-11 09:48" },
];

export const recentActivity = [
  { id: 1, time: "10:42", business: "Water Retail", text: "Sale KES 1,200 · Kileleshwa · M-Pesa" },
  { id: 2, time: "10:39", business: "Restaurant", text: "Bill KES 2,450 · Table 6 · Cash" },
  { id: 3, time: "10:31", business: "Water Delivery", text: "Delivery 600L · Spring Valley" },
  { id: 4, time: "10:22", business: "Butchery", text: "Sale KES 980 · Beef 1.4kg" },
  { id: 5, time: "10:08", business: "Water Retail", text: "Stock request submitted · Westlands" },
  { id: 6, time: "09:55", business: "Restaurant", text: "Refund initiated KES 700 · Pending" },
  { id: 7, time: "09:40", business: "Water Retail", text: "Sale KES 350 · Kileleshwa · Cash" },
  { id: 8, time: "09:18", business: "Water Delivery", text: "Opening load 6,600L recorded" },
  { id: 9, time: "09:02", business: "Restaurant", text: "Order #214 ready · Table 3" },
  { id: 10, time: "08:47", business: "Butchery", text: "Stock arrival 24kg mutton" },
];

export const assets = [
  { id: "a1", name: "Lorry KCB 412Y", type: "vehicle", shop: "Kileleshwa", status: "in_transit", added: "2025-07-19", mileage: 84210, lastService: "2026-04-02" },
  { id: "a2", name: "Lorry KDA 905T", type: "vehicle", shop: "Westlands", status: "at_depot", added: "2025-09-23", mileage: 41020, lastService: "2026-03-18" },
  { id: "a3", name: "Bottle Sealer #2", type: "equipment", shop: "Kileleshwa", status: "active", added: "2025-08-01" },
  { id: "a4", name: "Cold Room Unit", type: "equipment", shop: "R&B Main", status: "active", added: "2025-06-11" },
];

export const expenses = [
  { id: "e1", date: "2026-05-11", staff: "Daniel Kiprop", shop: "Westlands", category: "Fuel", description: "Diesel 45L", amount: 7200, status: "logged" },
  { id: "e2", date: "2026-05-10", staff: "Daniel Kiprop", shop: "Westlands", category: "Repairs", description: "Tyre puncture", amount: 1500, status: "reviewed" },
  { id: "e3", date: "2026-05-10", staff: "Joseph Maina", shop: "Kileleshwa", category: "Other", description: "Parking fees", amount: 300, status: "rejected" },
  { id: "e4", date: "2026-05-09", staff: "Daniel Kiprop", shop: "Westlands", category: "Fuel", description: "Diesel 30L", amount: 4800, status: "reviewed" },
];

export const pendingApprovals = 5;
export const activeUsers = 14;
