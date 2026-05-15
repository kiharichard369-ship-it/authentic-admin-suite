// Mock data for Water Delivery (v2 — dispatch tracking, debts, credits, GPS).

export const fleet = {
  name: "Maji Delivery Fleet",
  base: "Westlands Depot",
  manager: "Daniel Kiprop",
  vehicles: 4,
  driversOnDuty: 3,
};

export const deliveryKpis = {
  todayRevenue: 64800,
  mpesaToday: 41200,
  cashToday: 23600,
  litresDelivered: 12800,
  activeDispatches: 3,
  pendingDebt: 18400,
  creditOutstanding: 6200,
  fuelToday: 9400,
};

export const litresByDay = [
  { day: "Mon", litres: 9200 }, { day: "Tue", litres: 11400 }, { day: "Wed", litres: 10100 },
  { day: "Thu", litres: 12800 }, { day: "Fri", litres: 14200 }, { day: "Sat", litres: 8600 }, { day: "Sun", litres: 4200 },
];

// Dispatch records — per v2: product, time of dispatch, time of delivery, time of return.
export const dispatches = [
  {
    id: "DSP-2041", product: "Refill 20L ×60",
    driver: "Daniel Kiprop", vehicle: "KCB 412Y",
    customer: "Riverside Apartments",
    dispatchedAt: "13:10", deliveredAt: "13:48", returnedAt: "—",
    status: "delivering", litres: 1200, payment: "M-Pesa", paid: true,
  },
  {
    id: "DSP-2040", product: "New 20L ×12",
    driver: "Joseph Maina", vehicle: "KDA 905T",
    customer: "Lavington School",
    dispatchedAt: "12:42", deliveredAt: "13:25", returnedAt: "—",
    status: "delivering", litres: 240, payment: "Cash", paid: false,
  },
  {
    id: "DSP-2039", product: "Refill 20L ×40",
    driver: "Patrick Owino", vehicle: "KCH 220M",
    customer: "St. Catherine School",
    dispatchedAt: "11:55", deliveredAt: "12:38", returnedAt: "13:30",
    status: "returned", litres: 800, payment: "M-Pesa", paid: true,
  },
  {
    id: "DSP-2038", product: "Refill 10L ×80",
    driver: "Daniel Kiprop", vehicle: "KCB 412Y",
    customer: "Acacia Offices",
    dispatchedAt: "10:20", deliveredAt: "11:08", returnedAt: "12:00",
    status: "returned", litres: 800, payment: "Cash", paid: false,
  },
];

export const drivers = [
  { id: "d1", name: "Daniel Kiprop", phone: "+254 711 408 220", vehicle: "KCB 412Y", trips: 142, rating: 4.8, status: "on_route" },
  { id: "d2", name: "Joseph Maina", phone: "+254 722 991 014", vehicle: "KDA 905T", trips: 98, rating: 4.6, status: "on_route" },
  { id: "d3", name: "Patrick Owino", phone: "+254 733 220 770", vehicle: "KCH 220M", trips: 64, rating: 4.4, status: "loading" },
  { id: "d4", name: "Eric Wafula", phone: "+254 712 660 014", vehicle: "—", trips: 21, rating: 4.2, status: "off" },
];

// Debt module (NEW): unpaid deliveries.
export const debts = [
  { id: "DBT-114", customer: "Lavington School", phone: "+254 720 110 488", driver: "Joseph Maina", dispatch: "DSP-2040", amount: 4800, dueDate: "2026-05-22", status: "unpaid", note: "Bursar away — promised Friday" },
  { id: "DBT-113", customer: "Acacia Offices", phone: "+254 711 920 100", driver: "Daniel Kiprop", dispatch: "DSP-2038", amount: 6400, dueDate: "2026-05-18", status: "partial", note: "Paid 2,000 on delivery" },
  { id: "DBT-112", customer: "Sunset Villas", phone: "+254 722 414 909", driver: "Patrick Owino", dispatch: "DSP-2031", amount: 7200, dueDate: "2026-05-12", status: "unpaid", note: "" },
  { id: "DBT-111", customer: "Greenview Hostel", phone: "+254 733 808 220", driver: "Daniel Kiprop", dispatch: "DSP-2025", amount: 3200, dueDate: "2026-05-09", status: "paid", note: "Cleared 11 May" },
];

// Credit / overpayment carry-forward. Applies to both retail and delivery.
export const credits = [
  { id: "CR-088", customer: "Riverside Apartments", phone: "+254 720 414 901", source: "Delivery", balance: 1800, lastUpdated: "2026-05-12", note: "Overpaid by 1,800" },
  { id: "CR-087", customer: "Mama Njeri", phone: "+254 711 220 040", source: "Retail", balance: 600, lastUpdated: "2026-05-11", note: "Round-up retained" },
  { id: "CR-086", customer: "Westgate Salon", phone: "+254 722 909 110", source: "Delivery", balance: 2400, lastUpdated: "2026-05-10", note: "Paid for 2 dispatches in one M-Pesa" },
  { id: "CR-085", customer: "Spring Valley Estate", phone: "+254 733 008 224", source: "Delivery", balance: 1400, lastUpdated: "2026-05-08", note: "" },
];

export const fuelLogs = [
  { id: "F-091", date: "2026-05-11", driver: "Daniel Kiprop", vehicle: "KCB 412Y", litres: 45, amount: 7200, station: "Total Westlands" },
  { id: "F-090", date: "2026-05-11", driver: "Joseph Maina", vehicle: "KDA 905T", litres: 30, amount: 4800, station: "Shell Lavington" },
  { id: "F-089", date: "2026-05-10", driver: "Patrick Owino", vehicle: "KCH 220M", litres: 25, amount: 4000, station: "Total Westlands" },
  { id: "F-088", date: "2026-05-10", driver: "Daniel Kiprop", vehicle: "KCB 412Y", litres: 40, amount: 6400, station: "Rubis Riverside" },
];

export const dailyRevenue = {
  date: new Date().toISOString().slice(0, 10),
  mpesa: 41200,
  cash: 23600,
  total: 64800,
  startingStockLitres: 6600,
  finishingStockLitres: 1200,
  outstandingDebt: 18400,
};

// GPS — mock vehicle positions for the GPS preview map.
export const gpsVehicles = [
  { id: "KCB 412Y", driver: "Daniel Kiprop", lat: -1.2641, lng: 36.8089, speed: 28, heading: "NW", lastPing: "13:48", status: "moving" },
  { id: "KDA 905T", driver: "Joseph Maina", lat: -1.2810, lng: 36.7790, speed: 0, heading: "—", lastPing: "13:46", status: "stopped" },
  { id: "KCH 220M", driver: "Patrick Owino", lat: -1.2920, lng: 36.8210, speed: 41, heading: "E", lastPing: "13:49", status: "moving" },
];
