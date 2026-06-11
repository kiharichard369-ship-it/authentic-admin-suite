// Data layer for platform-wide (Super Admin) data. Talks to Supabase when
// configured, otherwise returns in-memory mocks so the demo works without DB.

import { supabase, hasSupabase } from "./supabase";
import * as mock from "./mock-data";

async function fromTable<T>(table: string, mapper: (row: any) => T, fallback: T[]): Promise<T[]> {
  if (!hasSupabase || !supabase) return fallback;
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw error;
  return (data ?? []).map(mapper);
}

export const fetchBusinesses = async () =>
  fromTable("platform_businesses", (r) => ({
    id: r.id, name: r.name, today: Number(r.today), txns: r.txns, color: r.color,
  }), mock.businesses);

export const fetchShops = async () =>
  fromTable("platform_shops", (r) => ({
    id: r.id, vendor: r.vendor, name: r.name, location: r.location, admin: r.admin,
    cashiers: r.cashiers, drivers: r.drivers, status: r.status, created: r.created,
  }), mock.shops);

export const fetchUsers = async () =>
  fromTable("platform_users", (r) => ({
    id: r.id, name: r.name, email: r.email, role: r.role, business: r.business,
    vendor: r.vendor, shop: r.shop, status: r.status, lastLogin: r.last_login,
  }), mock.users);

export const fetchRecentActivity = async () =>
  fromTable("platform_activity", (r) => ({
    id: r.id, time: r.time, business: r.business, text: r.text,
  }), mock.recentActivity);

export const fetchAssets = async () =>
  fromTable("platform_assets", (r) => ({
    id: r.id, name: r.name, type: r.type, shop: r.shop, status: r.status,
    added: r.added, mileage: r.mileage, lastService: r.last_service,
  }), mock.assets);

export const fetchPlatformExpenses = async () =>
  fromTable("platform_expenses", (r) => ({
    id: r.id, date: r.date, staff: r.staff, shop: r.shop, category: r.category,
    description: r.description, amount: Number(r.amount), status: r.status,
  }), mock.expenses);
