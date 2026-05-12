// Mock data for the Water Retail Admin (single-branch view: Kileleshwa)

export const branch = {
  name: "Kileleshwa Branch",
  code: "WR-KIL",
  address: "Othaya Rd, Kileleshwa, Nairobi",
  manager: "Mary Wanjiku",
  paybill: "247247 · Acc WR-KIL",
};

export const waterKpis = {
  todayRevenue: 28400,
  todayLitres: 4120,
  txns: 76,
  pendingRequests: 2,
  lowStockItems: 3,
  cashiersOnShift: 2,
};

export const hourlySales = [
  { hour: "07", litres: 220, revenue: 1320 },
  { hour: "08", litres: 410, revenue: 2530 },
  { hour: "09", litres: 530, revenue: 3250 },
  { hour: "10", litres: 600, revenue: 3900 },
  { hour: "11", litres: 480, revenue: 3050 },
  { hour: "12", litres: 380, revenue: 2410 },
  { hour: "13", litres: 290, revenue: 1820 },
  { hour: "14", litres: 360, revenue: 2280 },
  { hour: "15", litres: 470, revenue: 2980 },
  { hour: "16", litres: 380, revenue: 2410 },
];

export const products = [
  { id: "p1", sku: "20L-REF", name: "20L Refill", price: 150, stock: 142, reorder: 60, unit: "bottles" },
  { id: "p2", sku: "20L-NEW", name: "20L New Bottle (with deposit)", price: 850, stock: 18, reorder: 10, unit: "bottles" },
  { id: "p3", sku: "10L-REF", name: "10L Refill", price: 90, stock: 64, reorder: 40, unit: "bottles" },
  { id: "p4", sku: "5L-PKG", name: "5L Packaged", price: 150, stock: 8, reorder: 24, unit: "bottles" },
  { id: "p5", sku: "1L-PKG", name: "1L Packaged (case of 12)", price: 600, stock: 6, reorder: 12, unit: "cases" },
  { id: "p6", sku: "DSP-CAP", name: "Dispenser Caps", price: 30, stock: 210, reorder: 100, unit: "pieces" },
];

export const transactions = [
  { id: "T-1042", time: "11:48", cashier: "Grace Mumbi", items: "20L Refill ×4", amount: 600, method: "M-Pesa", status: "paid" },
  { id: "T-1041", time: "11:36", cashier: "Grace Mumbi", items: "10L Refill ×2, Cap ×1", amount: 210, method: "Cash", status: "paid" },
  { id: "T-1040", time: "11:20", cashier: "Esther Wairimu", items: "20L New ×1", amount: 850, method: "M-Pesa", status: "paid" },
  { id: "T-1039", time: "11:05", cashier: "Grace Mumbi", items: "5L Packaged ×3", amount: 450, method: "Cash", status: "refunded" },
  { id: "T-1038", time: "10:51", cashier: "Esther Wairimu", items: "20L Refill ×6", amount: 900, method: "M-Pesa", status: "paid" },
  { id: "T-1037", time: "10:34", cashier: "Grace Mumbi", items: "1L Case ×1", amount: 600, method: "Cash", status: "paid" },
  { id: "T-1036", time: "10:12", cashier: "Esther Wairimu", items: "20L Refill ×3", amount: 450, method: "M-Pesa", status: "paid" },
  { id: "T-1035", time: "09:58", cashier: "Grace Mumbi", items: "10L Refill ×4", amount: 360, method: "Cash", status: "paid" },
];

export const cashiers = [
  { id: "c1", name: "Grace Mumbi", phone: "+254 711 220 014", shift: "07:00 – 15:00", status: "on_shift", todaySales: 18400, txns: 42 },
  { id: "c2", name: "Esther Wairimu", phone: "+254 722 815 902", shift: "07:00 – 15:00", status: "on_shift", todaySales: 10000, txns: 26 },
  { id: "c3", name: "Brian Kamau", phone: "+254 733 401 187", shift: "15:00 – 21:00", status: "off", todaySales: 0, txns: 0 },
];

export const stockRequests = [
  { id: "SR-118", date: "2026-05-11", items: "20L Refill ×80, 5L ×40", status: "pending", note: "5L running low before weekend" },
  { id: "SR-117", date: "2026-05-10", items: "Caps ×200", status: "approved", note: "" },
  { id: "SR-116", date: "2026-05-09", items: "20L New ×24", status: "delivered", note: "Received 14:20" },
  { id: "SR-115", date: "2026-05-07", items: "1L Case ×20", status: "rejected", note: "Use existing stock first" },
];

export const branchExpenses = [
  { id: "be1", date: "2026-05-11", staff: "Mary Wanjiku", category: "Utilities", description: "KPLC token", amount: 2000, status: "logged" },
  { id: "be2", date: "2026-05-10", staff: "Mary Wanjiku", category: "Cleaning", description: "Detergent & supplies", amount: 850, status: "reviewed" },
  { id: "be3", date: "2026-05-09", staff: "Grace Mumbi", category: "Other", description: "Drinking water for staff", amount: 200, status: "rejected" },
];

export const customers = [
  { id: "cu1", name: "Riverside Apartments", phone: "+254 720 113 008", type: "Estate", visits: 142, spent: 184200, lastVisit: "2026-05-11", balance: 0 },
  { id: "cu2", name: "Kileleshwa Salon", phone: "+254 711 901 442", type: "Business", visits: 88, spent: 64800, lastVisit: "2026-05-11", balance: 1500 },
  { id: "cu3", name: "Mr. Otieno", phone: "+254 733 220 481", type: "Walk-in", visits: 36, spent: 14200, lastVisit: "2026-05-10", balance: 0 },
  { id: "cu4", name: "St. Catherine School", phone: "+254 722 005 117", type: "Institution", visits: 24, spent: 96400, lastVisit: "2026-05-09", balance: 4200 },
  { id: "cu5", name: "Mrs. Wambui", phone: "+254 711 008 240", type: "Walk-in", visits: 19, spent: 8650, lastVisit: "2026-05-08", balance: 0 },
];

export const refunds = [
  { id: "RF-021", txn: "T-1039", date: "2026-05-11 11:05", customer: "Walk-in", cashier: "Grace Mumbi", reason: "Damaged seal on 5L bottle", amount: 450, status: "approved" },
  { id: "RF-020", txn: "T-1024", date: "2026-05-10 16:42", customer: "Mr. Otieno", cashier: "Esther Wairimu", reason: "Wrong size dispensed", amount: 150, status: "pending" },
  { id: "RF-019", txn: "T-1011", date: "2026-05-09 09:18", customer: "Kileleshwa Salon", cashier: "Grace Mumbi", reason: "Duplicate charge", amount: 600, status: "approved" },
  { id: "RF-018", txn: "T-0998", date: "2026-05-07 14:05", customer: "Walk-in", cashier: "Brian Kamau", reason: "Customer changed mind", amount: 90, status: "rejected" },
];
