// Mock data for the Restaurant & Butchery admin workspace.

export const venue = {
  name: "Maji Grill & Butchery",
  location: "Westlands, Nairobi",
  manager: "Aisha Noor",
  paybill: "522533 · Acc RB-MAIN",
  covers: 64,
};

export const rbKpis = {
  todayRevenue: 84200,
  covers: 142,
  avgTicket: 593,
  openTables: 7,
  ticketsInKitchen: 11,
  butcheryRevenue: 21400,
};

export const hourlyRevenue = [
  { hour: "11", restaurant: 4200, butchery: 1800 },
  { hour: "12", restaurant: 9200, butchery: 2400 },
  { hour: "13", restaurant: 14800, butchery: 3100 },
  { hour: "14", restaurant: 8200, butchery: 2200 },
  { hour: "15", restaurant: 3400, butchery: 1900 },
  { hour: "16", restaurant: 2800, butchery: 2100 },
  { hour: "17", restaurant: 4600, butchery: 2700 },
  { hour: "18", restaurant: 9400, butchery: 2400 },
  { hour: "19", restaurant: 12800, butchery: 1900 },
  { hour: "20", restaurant: 9100, butchery: 900 },
];

export const tables = [
  { id: "T1", seats: 2, status: "occupied", waiter: "John Mwangi", bill: 1850, opened: "12:42" },
  { id: "T2", seats: 4, status: "occupied", waiter: "John Mwangi", bill: 4200, opened: "12:55" },
  { id: "T3", seats: 4, status: "free", waiter: "—", bill: 0, opened: "" },
  { id: "T4", seats: 6, status: "occupied", waiter: "Mercy Atieno", bill: 7800, opened: "13:10" },
  { id: "T5", seats: 2, status: "reserved", waiter: "—", bill: 0, opened: "" },
  { id: "T6", seats: 4, status: "occupied", waiter: "Mercy Atieno", bill: 2450, opened: "13:22" },
  { id: "T7", seats: 8, status: "free", waiter: "—", bill: 0, opened: "" },
  { id: "T8", seats: 2, status: "occupied", waiter: "John Mwangi", bill: 980, opened: "13:30" },
  { id: "T9", seats: 4, status: "free", waiter: "—", bill: 0, opened: "" },
  { id: "T10", seats: 4, status: "occupied", waiter: "Mercy Atieno", bill: 3650, opened: "13:38" },
];

export const tickets = [
  { id: "K-219", table: "T2", items: ["Nyama choma 1kg", "Ugali ×2", "Kachumbari"], placed: "13:01", status: "preparing", elapsed: "9m" },
  { id: "K-220", table: "T4", items: ["Goat ribs", "Pilau", "Mukimo"], placed: "13:14", status: "preparing", elapsed: "6m" },
  { id: "K-221", table: "T6", items: ["Tilapia whole", "Chips ×2"], placed: "13:25", status: "ready", elapsed: "12m" },
  { id: "K-222", table: "T8", items: ["Chicken wings"], placed: "13:31", status: "queued", elapsed: "1m" },
  { id: "K-223", table: "T10", items: ["Beef stew", "Chapati ×3", "Greens"], placed: "13:40", status: "preparing", elapsed: "3m" },
];

export const cuts = [
  { id: "bc1", name: "Beef tenderloin", pricePerKg: 1100, stockKg: 18.4, soldToday: 6.2 },
  { id: "bc2", name: "Goat ribs", pricePerKg: 950, stockKg: 12.0, soldToday: 8.8 },
  { id: "bc3", name: "Mutton leg", pricePerKg: 880, stockKg: 21.5, soldToday: 4.1 },
  { id: "bc4", name: "Chicken whole", pricePerKg: 620, stockKg: 34.0, soldToday: 11.2 },
  { id: "bc5", name: "Liver", pricePerKg: 720, stockKg: 6.4, soldToday: 2.0 },
  { id: "bc6", name: "Sausage", pricePerKg: 540, stockKg: 4.8, soldToday: 3.5 },
];

export const menu = [
  { id: "m1", category: "Mains", name: "Nyama choma (1kg)", price: 1500, available: true },
  { id: "m2", category: "Mains", name: "Goat ribs platter", price: 1800, available: true },
  { id: "m3", category: "Mains", name: "Tilapia whole", price: 1200, available: true },
  { id: "m4", category: "Mains", name: "Chicken wings (8pc)", price: 850, available: true },
  { id: "m5", category: "Sides", name: "Ugali", price: 150, available: true },
  { id: "m6", category: "Sides", name: "Pilau", price: 350, available: true },
  { id: "m7", category: "Sides", name: "Chapati", price: 60, available: true },
  { id: "m8", category: "Drinks", name: "Soda 500ml", price: 120, available: true },
  { id: "m9", category: "Drinks", name: "Tusker", price: 280, available: false },
];

export const dishMix = [
  { name: "Nyama choma", value: 38 },
  { name: "Goat ribs", value: 22 },
  { name: "Chicken", value: 18 },
  { name: "Tilapia", value: 14 },
  { name: "Other", value: 8 },
];
