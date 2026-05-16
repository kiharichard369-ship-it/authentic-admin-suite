// Water Retail mock data — aligned with v2 stock catalogue (Section 4).
// Five tile categories: REFILL | NEW | CAPS | PET | JERRICANS.

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
  { hour: "16", latest: 380, revenue: 2410 } as any,
];

export type WaterCategory = "REFILL" | "NEW" | "CAPS" | "PET" | "JERRICAN";

export type WaterProduct = {
  id: string;
  sku: string;
  name: string;
  category: WaterCategory;
  price: number | null; // null = TBC
  stock: number;
  reorder: number;
  unit: string;
};

// Prices from v2 Section 4 catalogue.
export const products: WaterProduct[] = [
  // REFILL
  { id: "r-500", sku: "REF-500ML", name: "500 ml Refill", category: "REFILL", price: 5, stock: 220, reorder: 80, unit: "bottle" },
  { id: "r-1", sku: "REF-1L", name: "1 L Refill", category: "REFILL", price: 10, stock: 160, reorder: 60, unit: "bottle" },
  { id: "r-1.5", sku: "REF-1.5L", name: "1.5 L Refill", category: "REFILL", price: 15, stock: 120, reorder: 50, unit: "bottle" },
  { id: "r-2", sku: "REF-2L", name: "2 L Refill", category: "REFILL", price: 20, stock: 96, reorder: 40, unit: "bottle" },
  { id: "r-3", sku: "REF-3L", name: "3 L Refill", category: "REFILL", price: 30, stock: 72, reorder: 30, unit: "bottle" },
  { id: "r-5", sku: "REF-5L", name: "5 L Refill", category: "REFILL", price: 40, stock: 64, reorder: 30, unit: "bottle" },
  { id: "r-10", sku: "REF-10L", name: "10 L Refill", category: "REFILL", price: 80, stock: 48, reorder: 24, unit: "bottle" },
  { id: "r-20", sku: "REF-20L", name: "20 L Refill", category: "REFILL", price: 150, stock: 142, reorder: 60, unit: "bottle" },
  // NEW BOTTLES
  { id: "n-500", sku: "NEW-500ML", name: "500 ml New Bottle", category: "NEW", price: 30, stock: 80, reorder: 40, unit: "bottle" },
  { id: "n-1", sku: "NEW-1L", name: "1 L New Bottle", category: "NEW", price: 50, stock: 60, reorder: 30, unit: "bottle" },
  { id: "n-1.5", sku: "NEW-1.5L", name: "1.5 L New Bottle", category: "NEW", price: 50, stock: 44, reorder: 24, unit: "bottle" },
  { id: "n-5", sku: "NEW-5L", name: "5 L New Bottle", category: "NEW", price: 150, stock: 20, reorder: 12, unit: "bottle" },
  { id: "n-10", sku: "NEW-10L", name: "10 L New Bottle", category: "NEW", price: 280, stock: 14, reorder: 10, unit: "bottle" },
  { id: "n-20", sku: "NEW-20L", name: "20 L New Bottle", category: "NEW", price: 450, stock: 18, reorder: 10, unit: "bottle" },
  // CAPS
  { id: "cap", sku: "CAP", name: "Caps", category: "CAPS", price: 20, stock: 210, reorder: 100, unit: "each" },
  // PET BOTTLES
  { id: "pet-1", sku: "PET-1L", name: "PET Bottle 1 L", category: "PET", price: 40, stock: 90, reorder: 40, unit: "bottle" },
  { id: "pet-1.5", sku: "PET-1.5L", name: "PET Bottle 1.5 L", category: "PET", price: 30, stock: 110, reorder: 50, unit: "bottle" },
  { id: "pet-5", sku: "PET-5L", name: "PET Bottle 5 L", category: "PET", price: 110, stock: 32, reorder: 20, unit: "bottle" },
  { id: "pet-10", sku: "PET-10L", name: "PET Bottle 10 L", category: "PET", price: 200, stock: 18, reorder: 12, unit: "bottle" },
  { id: "pet-20", sku: "PET-20L", name: "PET Bottle 20 L", category: "PET", price: 300, stock: 24, reorder: 12, unit: "bottle" },
  // JERRICANS — prices TBC per spec
  { id: "jer-5", sku: "JER-5L", name: "Jerrican 5 L", category: "JERRICAN", price: null, stock: 22, reorder: 12, unit: "each" },
  { id: "jer-10", sku: "JER-10L", name: "Jerrican 10 L", category: "JERRICAN", price: null, stock: 18, reorder: 10, unit: "each" },
  { id: "jer-20", sku: "JER-20L", name: "Jerrican 20 L", category: "JERRICAN", price: null, stock: 12, reorder: 8, unit: "each" },
];

export const WATER_CATEGORIES: { id: WaterCategory; label: string }[] = [
  { id: "REFILL", label: "Refill" },
  { id: "NEW", label: "New Bottles" },
  { id: "CAPS", label: "Caps" },
  { id: "PET", label: "PET Bottles" },
  { id: "JERRICAN", label: "Jerricans" },
];

export const transactions = [
  { id: "T-1042", time: "11:48", cashier: "Grace Mumbi", items: "20L Refill ×4", amount: 600, method: "M-Pesa", status: "paid" },
  { id: "T-1041", time: "11:36", cashier: "Grace Mumbi", items: "10L Refill ×2, Cap ×1", amount: 180, method: "Cash", status: "paid" },
  { id: "T-1040", time: "11:20", cashier: "Esther Wairimu", items: "20L New ×1", amount: 450, method: "M-Pesa", status: "paid" },
  { id: "T-1039", time: "11:05", cashier: "Grace Mumbi", items: "5L PET ×3", amount: 330, method: "Cash", status: "refunded" },
  { id: "T-1038", time: "10:51", cashier: "Esther Wairimu", items: "20L Refill ×6", amount: 900, method: "M-Pesa", status: "paid" },
  { id: "T-1037", time: "10:34", cashier: "Grace Mumbi", items: "PET 1.5L ×4", amount: 120, method: "Cash", status: "paid" },
];

export const cashiers = [
  { id: "c1", name: "Grace Mumbi", phone: "+254 711 220 014", shift: "07:00 – 15:00", status: "on_shift", todaySales: 18400, txns: 42 },
  { id: "c2", name: "Esther Wairimu", phone: "+254 722 815 902", shift: "07:00 – 15:00", status: "on_shift", todaySales: 10000, txns: 26 },
  { id: "c3", name: "Brian Kamau", phone: "+254 733 401 187", shift: "15:00 – 21:00", status: "off", todaySales: 0, txns: 0 },
];

export const stockRequests = [
  { id: "SR-118", date: "2026-05-11", items: "20L Refill ×80, 5L Refill ×40", status: "pending", note: "5L running low before weekend" },
  { id: "SR-117", date: "2026-05-10", items: "Caps ×200", status: "approved", note: "" },
  { id: "SR-116", date: "2026-05-09", items: "20L New ×24", status: "delivered", note: "Received 14:20" },
  { id: "SR-115", date: "2026-05-07", items: "PET 1L ×20", status: "rejected", note: "Use existing stock first" },
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
  { id: "cu5", name: "Mrs. Wambui", phone: "+254 711 008 240", type: "Walk-in", visits: 19, spent: 8650, lastVisit: "2026-05-08", balance: 250 },
];

export const refunds = [
  { id: "RF-021", txn: "T-1039", date: "2026-05-11 11:05", customer: "Walk-in", cashier: "Grace Mumbi", reason: "Damaged seal on 5L bottle", amount: 330, status: "approved" },
  { id: "RF-020", txn: "T-1024", date: "2026-05-10 16:42", customer: "Mr. Otieno", cashier: "Esther Wairimu", reason: "Wrong size dispensed", amount: 150, status: "pending" },
  { id: "RF-019", txn: "T-1011", date: "2026-05-09 09:18", customer: "Kileleshwa Salon", cashier: "Grace Mumbi", reason: "Duplicate charge", amount: 600, status: "approved" },
  { id: "RF-018", txn: "T-0998", date: "2026-05-07 14:05", customer: "Walk-in", cashier: "Brian Kamau", reason: "Customer changed mind", amount: 80, status: "rejected" },
];
