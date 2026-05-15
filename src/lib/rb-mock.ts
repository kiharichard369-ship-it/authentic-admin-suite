// Mock data for Restaurant & Butchery (TAKE-AWAY ONLY) per v2 prompts.
// Roles: rb_manager (1) + rb_cashier (1-6). Stock split into RAW and COOKED.

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

// Stock catalogue — RAW chicken (sold by weight / piece, uncooked)
export const rawStock = [
  { id: "raw-1", name: "Whole chicken (live)", unit: "bird", price: 850, stock: 38, soldToday: 12 },
  { id: "raw-2", name: "Whole chicken (dressed)", unit: "kg", price: 620, stock: 24.5, soldToday: 8.4 },
  { id: "raw-3", name: "Chicken breast", unit: "kg", price: 780, stock: 9.2, soldToday: 4.1 },
  { id: "raw-4", name: "Chicken thighs", unit: "kg", price: 640, stock: 11.4, soldToday: 5.6 },
  { id: "raw-5", name: "Chicken wings", unit: "kg", price: 580, stock: 6.0, soldToday: 3.0 },
  { id: "raw-6", name: "Chicken liver", unit: "kg", price: 420, stock: 3.2, soldToday: 1.1 },
  { id: "raw-7", name: "Chicken gizzards", unit: "kg", price: 460, stock: 2.4, soldToday: 0.8 },
];

// Stock catalogue — COOKED items (ready take-away)
export const cookedStock = [
  { id: "ck-1", name: "Roast chicken (1/4)", unit: "portion", price: 350, stock: 24, soldToday: 38 },
  { id: "ck-2", name: "Roast chicken (1/2)", unit: "portion", price: 650, stock: 16, soldToday: 21 },
  { id: "ck-3", name: "Whole roast chicken", unit: "bird", price: 1200, stock: 6, soldToday: 9 },
  { id: "ck-4", name: "Fried chicken (4pc)", unit: "portion", price: 480, stock: 18, soldToday: 22 },
  { id: "ck-5", name: "Chicken wings (8pc)", unit: "portion", price: 520, stock: 12, soldToday: 17 },
  { id: "ck-6", name: "Chips (large)", unit: "portion", price: 200, stock: 40, soldToday: 64 },
  { id: "ck-7", name: "Ugali", unit: "portion", price: 80, stock: 50, soldToday: 41 },
  { id: "ck-8", name: "Kachumbari", unit: "portion", price: 60, stock: 30, soldToday: 28 },
  { id: "ck-9", name: "Soda 500ml", unit: "bottle", price: 100, stock: 48, soldToday: 36 },
];

export const cashiers = [
  { id: "rbc-1", name: "Mary Wanjiku", phone: "+254 712 884 011", shift: "Morning", sales: 28400, orders: 41, active: true },
  { id: "rbc-2", name: "Brian Otieno", phone: "+254 722 119 300", shift: "Morning", sales: 19600, orders: 33, active: true },
  { id: "rbc-3", name: "Faith Achieng", phone: "+254 711 552 488", shift: "Evening", sales: 22100, orders: 38, active: true },
  { id: "rbc-4", name: "Samuel Karanja", phone: "+254 733 902 651", shift: "Evening", sales: 14100, orders: 30, active: true },
  { id: "rbc-5", name: "Eunice Mbithe", phone: "+254 720 481 902", shift: "—", sales: 0, orders: 0, active: false },
];

export const recentOrders = [
  { id: "RB-1042", time: "14:08", cashier: "Mary Wanjiku", items: "Roast 1/2, Chips, Soda", category: "COOKED", total: 850, paid: "M-Pesa" },
  { id: "RB-1041", time: "14:01", cashier: "Brian Otieno", items: "Dressed chicken 1.4kg", category: "RAW", total: 868, paid: "Cash" },
  { id: "RB-1040", time: "13:54", cashier: "Mary Wanjiku", items: "Wings 8pc, Ugali ×2", category: "COOKED", total: 680, paid: "M-Pesa" },
  { id: "RB-1039", time: "13:47", cashier: "Faith Achieng", items: "Fried chicken 4pc", category: "COOKED", total: 480, paid: "Cash" },
  { id: "RB-1038", time: "13:39", cashier: "Brian Otieno", items: "Whole roast", category: "COOKED", total: 1200, paid: "M-Pesa" },
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
