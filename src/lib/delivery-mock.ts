// Mock data for the Water Delivery admin workspace.

export const fleet = {
  name: "Maji Delivery Fleet",
  base: "Westlands Depot",
  manager: "Daniel Kiprop",
  vehicles: 4,
  driversOnDuty: 3,
};

export const deliveryKpis = {
  todayRevenue: 64800,
  litresDelivered: 12800,
  activeRoutes: 3,
  pendingDrops: 6,
  fuelToday: 9400,
  completedDrops: 18,
};

export const litresByDay = [
  { day: "Mon", litres: 9200 }, { day: "Tue", litres: 11400 }, { day: "Wed", litres: 10100 },
  { day: "Thu", litres: 12800 }, { day: "Fri", litres: 14200 }, { day: "Sat", litres: 8600 }, { day: "Sun", litres: 4200 },
];

export const routes = [
  { id: "R-201", driver: "Daniel Kiprop", vehicle: "KCB 412Y", status: "in_transit", drops: 6, completed: 4, litres: 4800, eta: "14:50" },
  { id: "R-202", driver: "Joseph Maina", vehicle: "KDA 905T", status: "in_transit", drops: 5, completed: 2, litres: 3600, eta: "15:20" },
  { id: "R-203", driver: "Patrick Owino", vehicle: "KCH 220M", status: "loading", drops: 4, completed: 0, litres: 2400, eta: "16:00" },
  { id: "R-200", driver: "Daniel Kiprop", vehicle: "KCB 412Y", status: "completed", drops: 5, completed: 5, litres: 4000, eta: "—" },
];

export const drivers = [
  { id: "d1", name: "Daniel Kiprop", phone: "+254 711 408 220", vehicle: "KCB 412Y", trips: 142, rating: 4.8, status: "on_route" },
  { id: "d2", name: "Joseph Maina", phone: "+254 722 991 014", vehicle: "KDA 905T", trips: 98, rating: 4.6, status: "on_route" },
  { id: "d3", name: "Patrick Owino", phone: "+254 733 220 770", vehicle: "KCH 220M", trips: 64, rating: 4.4, status: "loading" },
  { id: "d4", name: "Eric Wafula", phone: "+254 712 660 014", vehicle: "—", trips: 21, rating: 4.2, status: "off" },
];

export const drops = [
  { id: "DP-001", customer: "Riverside Apartments", address: "Riverside Dr, Westlands", litres: 1200, recurring: true, route: "R-201", status: "delivered" },
  { id: "DP-002", customer: "Spring Valley Estate", address: "Spring Valley Rd", litres: 600, recurring: true, route: "R-201", status: "delivered" },
  { id: "DP-003", customer: "Acacia Offices", address: "Lower Kabete Rd", litres: 400, recurring: false, route: "R-201", status: "in_progress" },
  { id: "DP-004", customer: "Lavington School", address: "James Gichuru Rd", litres: 1800, recurring: true, route: "R-202", status: "pending" },
  { id: "DP-005", customer: "Kileleshwa Salon", address: "Othaya Rd", litres: 200, recurring: false, route: "R-202", status: "pending" },
  { id: "DP-006", customer: "St. Catherine School", address: "Ngong Rd", litres: 2400, recurring: true, route: "R-203", status: "pending" },
];

export const fuelLogs = [
  { id: "F-091", date: "2026-05-11", driver: "Daniel Kiprop", vehicle: "KCB 412Y", litres: 45, amount: 7200, station: "Total Westlands" },
  { id: "F-090", date: "2026-05-11", driver: "Joseph Maina", vehicle: "KDA 905T", litres: 30, amount: 4800, station: "Shell Lavington" },
  { id: "F-089", date: "2026-05-10", driver: "Patrick Owino", vehicle: "KCH 220M", litres: 25, amount: 4000, station: "Total Westlands" },
  { id: "F-088", date: "2026-05-10", driver: "Daniel Kiprop", vehicle: "KCB 412Y", litres: 40, amount: 6400, station: "Rubis Riverside" },
];
