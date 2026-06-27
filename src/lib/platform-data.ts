// Data layer for platform-wide (Super Admin) data. Talks to Supabase when
// configured, otherwise returns in-memory mocks so the demo works without DB.

import { supabase, hasSupabase } from "./supabase";
import * as mock from "./mock-data";

// ---------------------------------------------------------------------------
// Businesses — live view aggregating today's revenue across arms
// ---------------------------------------------------------------------------
export const fetchBusinesses = async () => {
  if (!hasSupabase || !supabase) return mock.businesses;
  const { data, error } = await supabase
    .from("platform_businesses_live")
    .select("id,name,today,txns,color");
  if (error) throw error;
  if (!data || data.length === 0) return mock.businesses;
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    today: Number(r.today),
    txns: r.txns,
    color: r.color ?? "",
  }));
};

// ---------------------------------------------------------------------------
// Shops
// ---------------------------------------------------------------------------
export const fetchShops = async () => {
  if (!hasSupabase || !supabase) return mock.shops;
  const { data, error } = await supabase
    .from("platform_shops")
    .select("id,vendor,name,location,admin,cashiers,drivers,status,created")
    .order("created", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    vendor: r.vendor ?? "",
    name: r.name,
    location: r.location ?? "",
    admin: r.admin ?? "—",
    cashiers: r.cashiers,
    drivers: r.drivers,
    status: r.status,
    created: r.created,
  }));
};

// ---------------------------------------------------------------------------
// Users — pulled from vendor_members + auth.users via a platform view
// ---------------------------------------------------------------------------
export const fetchUsers = async () => {
  if (!hasSupabase || !supabase) return mock.users;
  const { data, error } = await supabase
    .from("platform_users")
    .select("id,name,email,role,business,vendor,shop,status,last_login")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    business: r.business ?? "—",
    vendor: r.vendor ?? "—",
    shop: r.shop ?? "—",
    status: r.status,
    lastLogin: r.last_login ?? "—",
  }));
};

// ---------------------------------------------------------------------------
// Recent activity — live view across all transactions
// ---------------------------------------------------------------------------
export const fetchRecentActivity = async () => {
  if (!hasSupabase || !supabase) return mock.recentActivity;
  const { data, error } = await supabase
    .from("platform_activity_live")
    .select("id,time,business,text")
    .limit(10);
  if (error) throw error;
  if (!data || data.length === 0) return mock.recentActivity;
  return data.map((r, i) => ({
    id: r.id ?? i,
    time: r.time,
    business: r.business,
    text: r.text ?? "",
  }));
};

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------
export const fetchAssets = async () => {
  if (!hasSupabase || !supabase) return mock.assets;
  const { data, error } = await supabase
    .from("platform_assets")
    .select("id,name,type,shop,status,added,mileage,last_service")
    .order("added", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type ?? "",
    shop: r.shop ?? "",
    status: r.status,
    added: r.added,
    mileage: r.mileage ?? null,
    lastService: r.last_service ?? null,
  }));
};

// ---------------------------------------------------------------------------
// Platform expenses
// ---------------------------------------------------------------------------
export const fetchPlatformExpenses = async () => {
  if (!hasSupabase || !supabase) return mock.expenses;
  const { data, error } = await supabase
    .from("platform_expenses")
    .select("id,date,staff,shop,category,description,amount,status")
    .order("date", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    date: r.date,
    staff: r.staff ?? "",
    shop: r.shop ?? "",
    category: r.category ?? "",
    description: r.description ?? "",
    amount: Number(r.amount),
    status: r.status,
  }));
};

// ---------------------------------------------------------------------------
// Dashboard KPI helpers — pending approvals + active users via RPCs
// ---------------------------------------------------------------------------
export const fetchPendingApprovals = async (): Promise<number> => {
  if (!hasSupabase || !supabase) return mock.pendingApprovals;
  const { data, error } = await supabase.rpc("platform_pending_approvals");
  if (error) return mock.pendingApprovals;
  return (data as number) ?? mock.pendingApprovals;
};

export const fetchActiveUsers = async (): Promise<number> => {
  if (!hasSupabase || !supabase) return mock.activeUsers;
  const { data, error } = await supabase.rpc("platform_active_users");
  if (error) return mock.activeUsers;
  return (data as number) ?? mock.activeUsers;
};

// ---------------------------------------------------------------------------
// Analytics — revenue series for charts (last 7 days)
// ---------------------------------------------------------------------------
export type RevenueSeries = { day: string; Water: number; Delivery: number };

export const fetchRevenueSeries = async (): Promise<RevenueSeries[]> => {
  if (!hasSupabase || !supabase) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((d, i) => ({
      day: d,
      Water: 30000 + i * 2400 + (i % 2) * 4000,
      Delivery: 12000 + i * 900,
    }));
  }
  // Pull last 7 days of water transactions grouped by day
  const { data: waterData } = await supabase
    .from("water_transactions")
    .select("created_at,total")
    .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());

  // Pull last 7 days of delivery revenue log
  const { data: delivData } = await supabase
    .from("delivery_daily_revenue_log")
    .select("date,total")
    .gte("date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const map: Record<string, RevenueSeries> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    map[key] = { day: dayNames[d.getDay()], Water: 0, Delivery: 0 };
  }

  for (const r of waterData ?? []) {
    const key = (r.created_at as string).slice(0, 10);
    if (map[key]) map[key].Water += Number(r.total);
  }
  for (const r of delivData ?? []) {
    const key = r.date as string;
    if (map[key]) map[key].Delivery += Number(r.total);
  }

  return Object.values(map);
};

// Top products for analytics
export type TopProduct = { name: string; sold: number; revenue: number };

export const fetchTopProducts = async (): Promise<TopProduct[]> => {
  if (!hasSupabase || !supabase) {
    return [
      { name: "5L Bottled Water", sold: 412, revenue: 82400 },
      { name: "20L Refill", sold: 188, revenue: 28200 },
      { name: "1L Bottled Water", sold: 380, revenue: 22800 },
      { name: "10L Refill", sold: 156, revenue: 12480 },
      { name: "PET Bottle 1.5L", sold: 142, revenue: 4260 },
      { name: "Caps", sold: 88, revenue: 1760 },
    ];
  }
  const { data, error } = await supabase
    .from("water_transaction_items")
    .select("product_name,qty,line_total");
  if (error) return [];

  const agg: Record<string, { sold: number; revenue: number }> = {};
  for (const r of data ?? []) {
    if (!agg[r.product_name]) agg[r.product_name] = { sold: 0, revenue: 0 };
    agg[r.product_name].sold += r.qty;
    agg[r.product_name].revenue += Number(r.line_total);
  }
  return Object.entries(agg)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);
};
