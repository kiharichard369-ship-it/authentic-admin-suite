// Data layer for Water Delivery. Talks to Supabase when configured, otherwise
// returns the in-memory mocks so the demo works without a backend.

import { supabase, hasSupabase } from "./supabase";
import * as mock from "./delivery-mock";

async function fromTable<T>(table: string, mapper: (row: any) => T, fallback: T[]): Promise<T[]> {
  if (!hasSupabase || !supabase) return fallback;
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw error;
  return (data ?? []).map(mapper);
}

export const fetchFleet = async () => {
  if (!hasSupabase || !supabase) return mock.fleet;
  const { data, error } = await supabase.from("delivery_fleet").select("*").limit(1).maybeSingle();
  if (error) throw error;
  return data ?? mock.fleet;
};

export const fetchDeliveryKpis = async () => {
  if (!hasSupabase || !supabase) return mock.deliveryKpis;
  const { data, error } = await supabase.from("delivery_kpis").select("*").limit(1).maybeSingle();
  if (error) throw error;
  return data ?? mock.deliveryKpis;
};

export const fetchLitresByDay = async () =>
  fromTable("delivery_litres_by_day", (r) => ({ day: r.day, litres: Number(r.litres) }), mock.litresByDay);

export const fetchDispatches = async () =>
  fromTable("delivery_dispatches", (r) => ({
    id: r.id, product: r.product, driver: r.driver, vehicle: r.vehicle, customer: r.customer,
    dispatchedAt: r.dispatched_at, deliveredAt: r.delivered_at, returnedAt: r.returned_at,
    status: r.status, litres: r.litres, payment: r.payment, paid: r.paid,
  }), mock.dispatches);

export const fetchDrivers = async () =>
  fromTable("delivery_drivers", (r) => ({
    id: r.id, name: r.name, phone: r.phone, vehicle: r.vehicle,
    trips: r.trips, rating: Number(r.rating), status: r.status,
  }), mock.drivers);

export const fetchDebts = async () =>
  fromTable("delivery_debts", (r) => ({
    id: r.id, customer: r.customer, phone: r.phone, driver: r.driver, dispatch: r.dispatch,
    amount: Number(r.amount), dueDate: r.due_date, status: r.status, note: r.note ?? "",
  }), mock.debts);

export const fetchCredits = async () =>
  fromTable("delivery_credits", (r) => ({
    id: r.id, customer: r.customer, phone: r.phone, source: r.source,
    balance: Number(r.balance), lastUpdated: r.last_updated, note: r.note ?? "",
  }), mock.credits);

export const fetchFuelLogs = async () =>
  fromTable("delivery_fuel_logs", (r) => ({
    id: r.id, date: r.date, driver: r.driver, vehicle: r.vehicle,
    litres: Number(r.litres), amount: Number(r.amount), station: r.station,
  }), mock.fuelLogs);

export const fetchDailyRevenue = async () => {
  if (!hasSupabase || !supabase) return mock.dailyRevenue;
  const { data, error } = await supabase.from("delivery_daily_revenue").select("*").limit(1).maybeSingle();
  if (error) throw error;
  return data ?? mock.dailyRevenue;
};

export const fetchGpsVehicles = async () =>
  fromTable("delivery_gps_vehicles", (r) => ({
    id: r.id, driver: r.driver, lat: Number(r.lat), lng: Number(r.lng),
    speed: Number(r.speed), heading: r.heading, lastPing: r.last_ping, status: r.status,
  }), mock.gpsVehicles);
