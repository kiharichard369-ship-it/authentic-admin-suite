// Data layer for Water Retail. Talks to Supabase when configured, falls back
// to the in-memory mock catalogue so the demo keeps working without a backend.

import { supabase, hasSupabase } from "./supabase";
import {
  products as mockProducts,
  customers as mockCustomers,
  branch as mockBranch,
  waterKpis as mockWaterKpis,
  hourlySales as mockHourlySales,
  transactions as mockTransactions,
  cashiers as mockCashiers,
  stockRequests as mockStockRequests,
  branchExpenses as mockBranchExpenses,
  refunds as mockRefunds,
  type WaterProduct,
  type WaterCategory,
} from "./water-mock";

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  type: "Walk-in" | "Estate" | "Business" | "Institution";
  visits: number;
  spent: number;
  balance: number;
  lastVisit: string | null;
};

export type Product = WaterProduct;

export type CartLine = { productId: string; name: string; unitPrice: number; qty: number };

export type SaleInput = {
  customerId: string | null;
  cashierName: string;
  lines: CartLine[];
  discountPct: number;
  discountAmount: number;
  creditApplied: number;
  total: number;
  amountPaid: number;
  method: "cash" | "mpesa";
};

// ----------------------------------------------------------------------------
// In-memory store (mock fallback)
// ----------------------------------------------------------------------------
const mem = {
  customers: mockCustomers.map((c) => ({ ...c })) as Customer[],
  products: mockProducts.map((p) => ({ ...p })),
};

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

// ----------------------------------------------------------------------------
// Customers
// ----------------------------------------------------------------------------
export async function listCustomers(): Promise<Customer[]> {
  if (!hasSupabase || !supabase) return [...mem.customers];
  const { data, error } = await supabase
    .from("water_customers")
    .select("id,name,phone,type,visits,spent,balance,last_visit")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id, name: r.name, phone: r.phone, type: r.type,
    visits: r.visits, spent: Number(r.spent), balance: Number(r.balance),
    lastVisit: r.last_visit,
  }));
}

export async function createCustomer(input: Omit<Customer, "id" | "visits" | "spent" | "lastVisit">): Promise<Customer> {
  if (!hasSupabase || !supabase) {
    const c: Customer = { id: uid("cu"), visits: 0, spent: 0, lastVisit: null, ...input };
    mem.customers.unshift(c);
    return c;
  }
  const { data, error } = await supabase
    .from("water_customers")
    .insert({ name: input.name, phone: input.phone, type: input.type, balance: input.balance })
    .select("id,name,phone,type,visits,spent,balance,last_visit")
    .single();
  if (error) throw error;
  return {
    id: data.id, name: data.name, phone: data.phone, type: data.type,
    visits: data.visits, spent: Number(data.spent), balance: Number(data.balance),
    lastVisit: data.last_visit,
  };
}

export async function updateCustomerBalance(id: string, newBalance: number): Promise<void> {
  if (!hasSupabase || !supabase) {
    const c = mem.customers.find((x) => x.id === id);
    if (c) c.balance = newBalance;
    return;
  }
  const { error } = await supabase.from("water_customers").update({ balance: newBalance }).eq("id", id);
  if (error) throw error;
}

// ----------------------------------------------------------------------------
// Products
// ----------------------------------------------------------------------------
export async function listProducts(): Promise<Product[]> {
  if (!hasSupabase || !supabase) return [...mem.products];
  const { data, error } = await supabase
    .from("water_products")
    .select("id,sku,name,category,price,stock,reorder,unit")
    .order("category");
  if (error) throw error;
  return (data ?? []).map((p) => ({
    ...p,
    price: p.price == null ? null : Number(p.price),
    category: p.category as WaterCategory,
  })) as Product[];
}

// ----------------------------------------------------------------------------
// Sales
// ----------------------------------------------------------------------------
export async function recordSale(input: SaleInput): Promise<{ transactionId: string; overpayment: number }> {
  const subtotal = input.lines.reduce((a, l) => a + l.unitPrice * l.qty, 0);
  const overpayment = Math.max(0, input.amountPaid - input.total);

  if (!hasSupabase || !supabase) {
    if (input.customerId) {
      const c = mem.customers.find((x) => x.id === input.customerId);
      if (c) {
        c.balance = Math.max(0, c.balance - input.creditApplied) + overpayment;
        c.spent += input.total;
        c.visits += 1;
        c.lastVisit = new Date().toISOString().slice(0, 10);
      }
    }
    for (const l of input.lines) {
      const p = mem.products.find((x) => x.id === l.productId);
      if (p) p.stock = Math.max(0, p.stock - l.qty);
    }
    return { transactionId: uid("T"), overpayment };
  }

  const { data: tx, error: txErr } = await supabase
    .from("water_transactions")
    .insert({
      customer_id: input.customerId,
      cashier_name: input.cashierName,
      subtotal,
      discount_pct: input.discountPct,
      discount_amount: input.discountAmount,
      credit_applied: input.creditApplied,
      total: input.total,
      amount_paid: input.amountPaid,
      overpayment,
      method: input.method,
    })
    .select("id")
    .single();
  if (txErr) throw txErr;

  const items = input.lines.map((l) => ({
    transaction_id: tx.id,
    product_id: l.productId,
    product_name: l.name,
    unit_price: l.unitPrice,
    qty: l.qty,
    line_total: l.unitPrice * l.qty,
  }));
  const { error: itemsErr } = await supabase.from("water_transaction_items").insert(items);
  if (itemsErr) throw itemsErr;

  if (input.customerId) {
    const { data: c } = await supabase
      .from("water_customers")
      .select("balance,spent,visits")
      .eq("id", input.customerId)
      .single();
    if (c) {
      const newBalance = Math.max(0, Number(c.balance) - input.creditApplied) + overpayment;
      await supabase
        .from("water_customers")
        .update({
          balance: newBalance,
          spent: Number(c.spent) + input.total,
          visits: Number(c.visits) + 1,
          last_visit: new Date().toISOString().slice(0, 10),
        })
        .eq("id", input.customerId);
    }
  }

  for (const l of input.lines) {
    const { data: p } = await supabase.from("water_products").select("stock").eq("id", l.productId).single();
    if (p) {
      await supabase
        .from("water_products")
        .update({ stock: Math.max(0, Number(p.stock) - l.qty) })
        .eq("id", l.productId);
    }
  }

  return { transactionId: tx.id, overpayment };
}

// ----------------------------------------------------------------------------
// Read-only helpers — all backed by live views, fall back to mocks
// ----------------------------------------------------------------------------

export const fetchBranch = async () => {
  if (!hasSupabase || !supabase) return mockBranch;
  const { data, error } = await supabase
    .from("water_branch")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return mockBranch;
  return {
    name: data.name,
    code: data.code ?? "",
    address: data.address ?? "",
    manager: data.manager ?? "",
    paybill: data.paybill ?? "",
  };
};

export const fetchWaterKpis = async () => {
  if (!hasSupabase || !supabase) return mockWaterKpis;
  const { data, error } = await supabase
    .from("water_kpis")
    .select("today_revenue,today_litres,txns,pending_requests,low_stock_items,cashiers_on_shift")
    .maybeSingle();
  if (error) throw error;
  if (!data) return mockWaterKpis;
  return {
    todayRevenue: Number(data.today_revenue),
    todayLitres: Number(data.today_litres),
    txns: data.txns,
    pendingRequests: data.pending_requests,
    lowStockItems: data.low_stock_items,
    cashiersOnShift: data.cashiers_on_shift,
  };
};

export const fetchHourlySales = async () => {
  if (!hasSupabase || !supabase) return mockHourlySales as any[];
  const { data, error } = await supabase
    .from("water_hourly_sales")
    .select("hour,litres,revenue");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    hour: r.hour,
    litres: Number(r.litres),
    revenue: Number(r.revenue),
  }));
};

export const fetchTransactions = async () => {
  if (!hasSupabase || !supabase) return mockTransactions;
  const { data, error } = await supabase
    .from("water_transactions_view")
    .select("id,time,cashier,items,amount,method,status")
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id, time: r.time, cashier: r.cashier,
    items: r.items ?? "", amount: Number(r.amount),
    method: r.method, status: r.status,
  }));
};

export const fetchCashiers = async () => {
  if (!hasSupabase || !supabase) return mockCashiers;
  const { data, error } = await supabase
    .from("water_cashiers_live")
    .select("id,name,phone,shift,status,today_sales,txns");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id, name: r.name, phone: r.phone, shift: r.shift ?? "",
    status: r.status, todaySales: Number(r.today_sales), txns: r.txns,
  }));
};

export const fetchStockRequests = async () => {
  if (!hasSupabase || !supabase) return mockStockRequests;
  const { data, error } = await supabase
    .from("water_stock_requests")
    .select("id,date,items,status,note")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id, date: r.date, items: r.items,
    status: r.status, note: r.note ?? "",
  }));
};

export const fetchBranchExpenses = async () => {
  if (!hasSupabase || !supabase) return mockBranchExpenses;
  const { data, error } = await supabase
    .from("water_branch_expenses")
    .select("id,date,staff,category,description,amount,status")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id, date: r.date, staff: r.staff, category: r.category,
    description: r.description ?? "", amount: Number(r.amount), status: r.status,
  }));
};

export const fetchRefunds = async () => {
  if (!hasSupabase || !supabase) return mockRefunds;
  const { data, error } = await supabase
    .from("water_refunds")
    .select("id,txn,date,customer,cashier,reason,amount,status")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    txn: r.txn ?? "",
    date: r.date,
    customer: r.customer ?? "Walk-in",
    cashier: r.cashier ?? "",
    reason: r.reason ?? "",
    amount: Number(r.amount),
    status: r.status,
  }));
};

// Revenue summary helpers used by water-admin.revenue.tsx
export const fetchWaterRevenueSplit = async (): Promise<{ mpesa: number; cash: number; total: number }> => {
  if (!hasSupabase || !supabase) {
    const kpis = mockWaterKpis;
    const mpesa = Math.round(kpis.todayRevenue * 0.65);
    return { mpesa, cash: kpis.todayRevenue - mpesa, total: kpis.todayRevenue };
  }
  const { data, error } = await supabase
    .from("water_transactions")
    .select("total,method")
    .gte("created_at", new Date().toISOString().slice(0, 10));
  if (error) throw error;
  const rows = data ?? [];
  const mpesa = rows.filter((r) => r.method === "mpesa").reduce((a, r) => a + Number(r.total), 0);
  const cash = rows.filter((r) => r.method === "cash").reduce((a, r) => a + Number(r.total), 0);
  return { mpesa, cash, total: mpesa + cash };
};
