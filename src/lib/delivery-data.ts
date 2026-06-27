// Data layer for Water Delivery. Talks to Supabase when configured, otherwise
// returns the in-memory mocks so the demo works without a backend.

import { supabase, hasSupabase } from "./supabase";
import * as mock from "./delivery-mock";

// ---------------------------------------------------------------------------
// Fleet header (one-row summary table per vendor)
// ---------------------------------------------------------------------------
export const fetchFleet = async () => {
  if (!hasSupabase || !supabase) return mock.fleet;
  const { data, error } = await supabase
    .from("delivery_fleet")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return mock.fleet;
  return {
    name: mock.fleet.name,
    base: mock.fleet.base,
    manager: mock.fleet.manager,
    vehicles: data.vehicles ?? mock.fleet.vehicles,
    driversOnDuty: data.active ?? mock.fleet.driversOnDuty,
  };
};

// ---------------------------------------------------------------------------
// KPIs — live computed view
// ---------------------------------------------------------------------------
export const fetchDeliveryKpis = async () => {
  if (!hasSupabase || !supabase) return mock.deliveryKpis;
  const { data, error } = await supabase
    .from("delivery_kpis_live")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) return mock.deliveryKpis;
  return {
    todayRevenue: Number(data.today_revenue ?? 0),
    mpesaToday: Number(data.mpesa_today ?? 0),
    cashToday: Number(data.cash_today ?? 0),
    litresDelivered: Number(data.litres_delivered ?? 0),
    activeDispatches: data.active_dispatches ?? 0,
    pendingDebt: Number(data.pending_debt ?? 0),
    creditOutstanding: Number(data.credit_outstanding ?? 0),
    fuelToday: Number(data.fuel_today ?? 0),
  };
};

// ---------------------------------------------------------------------------
// Litres by day (last 7 days bar chart)
// ---------------------------------------------------------------------------
export const fetchLitresByDay = async () => {
  if (!hasSupabase || !supabase) return mock.litresByDay;
  const { data, error } = await supabase
    .from("delivery_litres_by_day_live")
    .select("day,litres");
  if (error) throw error;
  if (!data || data.length === 0) return mock.litresByDay;
  return data.map((r) => ({ day: r.day, litres: Number(r.litres) }));
};

// ---------------------------------------------------------------------------
// Dispatches — reads from full table via live view
// ---------------------------------------------------------------------------
export const fetchDispatches = async () => {
  if (!hasSupabase || !supabase) return mock.dispatches;
  const { data, error } = await supabase
    .from("v_delivery_dispatches_live")
    .select("id,product,driver,vehicle,customer,dispatched_at,delivered_at,returned_at,status,litres,payment,paid")
    .order("dispatched_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    product: r.product,
    driver: r.driver ?? "",
    vehicle: r.vehicle ?? "",
    customer: r.customer ?? "",
    dispatchedAt: r.dispatched_at ?? "—",
    deliveredAt: r.delivered_at ?? "—",
    returnedAt: r.returned_at ?? "—",
    status: r.status,
    litres: r.litres,
    payment: r.payment ?? "",
    paid: r.paid,
  }));
};

// ---------------------------------------------------------------------------
// Drivers — reads from full table via live view
// ---------------------------------------------------------------------------
export const fetchDrivers = async () => {
  if (!hasSupabase || !supabase) return mock.drivers;
  const { data, error } = await supabase
    .from("v_delivery_drivers_live")
    .select("id,name,phone,vehicle,trips,rating,status");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone ?? "",
    vehicle: r.vehicle ?? "—",
    trips: r.trips,
    rating: Number(r.rating),
    status: r.status,
  }));
};

// ---------------------------------------------------------------------------
// Debts
// ---------------------------------------------------------------------------
export const fetchDebts = async () => {
  if (!hasSupabase || !supabase) return mock.debts;
  const { data, error } = await supabase
    .from("delivery_debts")
    .select("id,customer,phone,driver,dispatch,amount,due_date,status,note")
    .order("due_date", { ascending: true })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    customer: r.customer,
    phone: r.phone ?? "",
    driver: r.driver ?? "",
    dispatch: r.dispatch ?? "",
    amount: Number(r.amount),
    dueDate: r.due_date,
    status: r.status,
    note: r.note ?? "",
  }));
};

// ---------------------------------------------------------------------------
// Credits
// ---------------------------------------------------------------------------
export const fetchCredits = async () => {
  if (!hasSupabase || !supabase) return mock.credits;
  const { data, error } = await supabase
    .from("delivery_credits")
    .select("id,customer,phone,source,balance,last_updated,note")
    .order("last_updated", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    customer: r.customer,
    phone: r.phone ?? "",
    source: r.source ?? "",
    balance: Number(r.balance),
    lastUpdated: r.last_updated,
    note: r.note ?? "",
  }));
};

// ---------------------------------------------------------------------------
// Fuel logs
// ---------------------------------------------------------------------------
export const fetchFuelLogs = async () => {
  if (!hasSupabase || !supabase) return mock.fuelLogs;
  const { data, error } = await supabase
    .from("delivery_fuel_logs")
    .select("id,date,driver,vehicle,litres,amount,station")
    .order("date", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    date: r.date,
    driver: r.driver ?? "",
    vehicle: r.vehicle ?? "",
    litres: Number(r.litres),
    amount: Number(r.amount),
    station: r.station ?? "",
  }));
};

// ---------------------------------------------------------------------------
// Daily revenue (from log table, falls back to live dispatch data)
// ---------------------------------------------------------------------------
export const fetchDailyRevenue = async () => {
  if (!hasSupabase || !supabase) return mock.dailyRevenue;
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("delivery_daily_revenue_log")
    .select("*")
    .eq("date", today)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ...mock.dailyRevenue, date: today };
  return {
    date: data.date,
    mpesa: Number(data.mpesa),
    cash: Number(data.cash),
    total: Number(data.total),
    startingStockLitres: data.starting_stock_litres,
    finishingStockLitres: data.finishing_stock_litres,
    outstandingDebt: Number(data.outstanding_debt),
  };
};

// ---------------------------------------------------------------------------
// GPS vehicles — live view with formatted last_ping
// ---------------------------------------------------------------------------
export const fetchGpsVehicles = async () => {
  if (!hasSupabase || !supabase) return mock.gpsVehicles;
  const { data, error } = await supabase
    .from("delivery_gps_live")
    .select("id,driver,lat,lng,speed,heading,last_ping,status");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    driver: r.driver ?? "",
    lat: Number(r.lat),
    lng: Number(r.lng),
    speed: Number(r.speed),
    heading: r.heading ?? "—",
    lastPing: r.last_ping,
    status: r.status,
  }));
};
