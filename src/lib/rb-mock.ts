// R&B (Take-away) mock — aligned with v2 stock catalogue (Section 5).
// Roles: rb_manager (1) + rb_cashier (1-6). Categories: RAW | COOKED | PROCESSED.

export const venue = {
  name: "Maji Grill & Butchery",
  location: "Westlands, Nairobi",
  manager: "Aisha Noor",
  paybill: "522533 · Acc RB-MAIN",
};

export const rbKpis = {
  todayRevenue: 84200,
  mpesaToday: 51200,
  cashToday: 33000,
  ordersToday: 142,
  avgTicket: 593,
  rawSold: 21400,
  cookedSold: 62800,
};

export const hourlyRevenue = [
  { hour: "10", raw: 1800, cooked: 2400 },
  { hour: "11", raw: 2400, cooked: 4200 },
  { hour: "12", raw: 3100, cooked: 9200 },
  { hour: "13", raw: 4400, cooked: 14800 },
  { hour: "14", raw: 2200, cooked: 8200 },
  { hour: "15", raw: 1900, cooked: 3400 },
  { hour: "16", raw: 2100, cooked: 2800 },
  { hour: "17", raw: 2700, cooked: 4600 },
  { hour: "18", raw: 2400, cooked: 9400 },
  { hour: "19", raw: 1900, cooked: 12800 },
];

export type RbCategory = "RAW" | "COOKED" | "PROCESSED";
export type RbItem = { id: string; name: string; category: RbCategory; sub: string; unit: string; price: number; stock: number; soldToday: number };

// RAW chicken (from v2 catalogue)
export const rawStock: RbItem[] = [
  { id: "raw-1", name: "Full Chicken (Capon) — Raw", category: "RAW", sub: "Capon", unit: "bird", price: 600, stock: 14, soldToday: 6 },
  { id: "raw-2", name: "Half Chicken — Raw", category: "RAW", sub: "Capon", unit: "portion", price: 300, stock: 22, soldToday: 9 },
  { id: "raw-3", name: "Quarter Cut — Raw", category: "RAW", sub: "Capon", unit: "portion", price: 150, stock: 30, soldToday: 14 },
  { id: "raw-4", name: "Full Chicken — Marinated", category: "RAW", sub: "Marinated", unit: "bird", price: 650, stock: 8, soldToday: 4 },
  { id: "raw-5", name: "Half Chicken — Marinated", category: "RAW", sub: "Marinated", unit: "portion", price: 350, stock: 12, soldToday: 7 },
  { id: "raw-6", name: "Quarter Cut — Marinated", category: "RAW", sub: "Marinated", unit: "portion", price: 200, stock: 18, soldToday: 10 },
  { id: "raw-7", name: "Kienyeji Full", category: "RAW", sub: "Kienyeji", unit: "bird", price: 1000, stock: 5, soldToday: 2 },
  { id: "raw-8", name: "Kienyeji Half", category: "RAW", sub: "Kienyeji", unit: "portion", price: 500, stock: 6, soldToday: 3 },
];

// COOKED & offcuts
export const cookedStock: RbItem[] = [
  { id: "ck-1", name: "Full Chicken (Capon) — Cooked", category: "COOKED", sub: "Capon", unit: "bird", price: 650, stock: 6, soldToday: 9 },
  { id: "ck-2", name: "Half Chicken — Cooked", category: "COOKED", sub: "Capon", unit: "portion", price: 350, stock: 14, soldToday: 21 },
  { id: "ck-3", name: "Quarter Cut — Cooked", category: "COOKED", sub: "Capon", unit: "portion", price: 180, stock: 22, soldToday: 38 },
  { id: "ck-4", name: "Gizzards", category: "COOKED", sub: "Offcuts", unit: "kg", price: 550, stock: 3.2, soldToday: 1.6 },
  { id: "ck-5", name: "Chicken Liver", category: "COOKED", sub: "Offcuts", unit: "kg", price: 400, stock: 2.4, soldToday: 1.1 },
  { id: "ck-6", name: "Chicken Wings", category: "COOKED", sub: "Cuts", unit: "kg", price: 750, stock: 4.0, soldToday: 2.4 },
  { id: "ck-7", name: "Thighs on Bone", category: "COOKED", sub: "Cuts", unit: "kg", price: 850, stock: 5.0, soldToday: 2.8 },
  { id: "ck-8", name: "Drumsticks", category: "COOKED", sub: "Cuts", unit: "kg", price: 750, stock: 3.6, soldToday: 1.9 },
  { id: "ck-9", name: "Boneless Chicken Breast", category: "COOKED", sub: "Cuts", unit: "kg", price: 750, stock: 2.8, soldToday: 1.4 },
  { id: "ck-10", name: "Breast on Bone", category: "COOKED", sub: "Cuts", unit: "kg", price: 600, stock: 3.2, soldToday: 1.7 },
];

// Processed, fries & other
export const processedStock: RbItem[] = [
  { id: "pr-1", name: "Smokies 5-piece pack — Raw", category: "PROCESSED", sub: "Smokies", unit: "pack", price: 160, stock: 24, soldToday: 12 },
  { id: "pr-2", name: "Smokies — Cooked", category: "PROCESSED", sub: "Smokies", unit: "each", price: 40, stock: 60, soldToday: 48 },
  { id: "pr-3", name: "Beef Sausages 6-piece pack — Raw", category: "PROCESSED", sub: "Sausages", unit: "pack", price: 240, stock: 18, soldToday: 6 },
  { id: "pr-4", name: "Beef Sausages — Cooked", category: "PROCESSED", sub: "Sausages", unit: "each", price: 50, stock: 48, soldToday: 36 },
  { id: "pr-5", name: "Pet Food", category: "PROCESSED", sub: "Pet", unit: "kg", price: 170, stock: 8.0, soldToday: 1.4 },
  { id: "pr-6", name: "Fries Small", category: "PROCESSED", sub: "Fries", unit: "portion", price: 70, stock: 40, soldToday: 32 },
  { id: "pr-7", name: "Fries Medium", category: "PROCESSED", sub: "Fries", unit: "portion", price: 100, stock: 35, soldToday: 28 },
  { id: "pr-8", name: "Fries Large", category: "PROCESSED", sub: "Fries", unit: "portion", price: 150, stock: 25, soldToday: 18 },
];

export const allStock: RbItem[] = [...rawStock, ...cookedStock, ...processedStock];

export const RB_CATEGORIES: { id: RbCategory; label: string }[] = [
  { id: "COOKED", label: "Cooked" },
  { id: "RAW", label: "Raw" },
  { id: "PROCESSED", label: "Processed" },
];

export const cashiers = [
  { id: "rbc-1", name: "Mary Wanjiku", phone: "+254 712 884 011", shift: "Morning", sales: 28400, orders: 41, active: true },
  { id: "rbc-2", name: "Brian Otieno", phone: "+254 722 119 300", shift: "Morning", sales: 19600, orders: 33, active: true },
  { id: "rbc-3", name: "Faith Achieng", phone: "+254 711 552 488", shift: "Evening", sales: 22100, orders: 38, active: true },
  { id: "rbc-4", name: "Samuel Karanja", phone: "+254 733 902 651", shift: "Evening", sales: 14100, orders: 30, active: true },
  { id: "rbc-5", name: "Eunice Mbithe", phone: "+254 720 481 902", shift: "—", sales: 0, orders: 0, active: false },
];

export const recentOrders = [
  { id: "RB-1042", time: "14:08", cashier: "Mary Wanjiku", items: "Half Cooked, Fries L, Soda", category: "COOKED", total: 600, paid: "M-Pesa" },
  { id: "RB-1041", time: "14:01", cashier: "Brian Otieno", items: "Marinated Full (raw)", category: "RAW", total: 650, paid: "Cash" },
  { id: "RB-1040", time: "13:54", cashier: "Mary Wanjiku", items: "Wings 1kg + Fries M", category: "COOKED", total: 850, paid: "M-Pesa" },
  { id: "RB-1039", time: "13:47", cashier: "Faith Achieng", items: "Smokies cooked ×4", category: "PROCESSED", total: 160, paid: "Cash" },
  { id: "RB-1038", time: "13:39", cashier: "Brian Otieno", items: "Kienyeji Half", category: "RAW", total: 500, paid: "M-Pesa" },
];

export const dailyRevenue = {
  date: new Date().toISOString().slice(0, 10),
  mpesa: 51200,
  cash: 33000,
  total: 84200,
  startingStockValue: 142000,
  finishingStockValue: 96400,
};

export const discounts = [
  { id: "d1", label: "Staff 10%", percent: 10 },
  { id: "d2", label: "Loyalty 5%", percent: 5 },
  { id: "d3", label: "Bulk 15%", percent: 15 },
];
