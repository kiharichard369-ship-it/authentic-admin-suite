// Data layer for Water Retail. Talks to Supabase when configured, falls back
// to the in-memory mock catalogue so the demo keeps working without a backend.

import { supabase, hasSupabase } from "./supabase";
import {
  products as mockProducts,
  customers as mockCustomers,
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
  total: number;          // amount the customer owes after credit
  amountPaid: number;     // what they actually paid
  method: "cash" | "mpesa";
};

// ----------------------------------------------------------------------------
// In-memory store (mock fallback). Mutates the mock arrays so the demo
// behaves like a real backend — add customer, edit balance, record sale.
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
    // Mock: mutate in-memory customer balance and product stock.
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

  // Update customer balance / aggregates
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

  // Decrement stock
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
// Read-only helpers for branch, KPIs, cashiers, transactions, refunds, etc.
// Mirror water-mock exports so routes can swap their import path 1:1.
// ----------------------------------------------------------------------------
import * as wmock from "./water-mock";

async function fromTable<T>(table: string, mapper: (row: any) => T, fallback: T[]): Promise<T[]> {
  if (!hasSupabase || !supabase) return fallback;
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw error;
  return (data ?? []).map(mapper);
}

export const fetchBranch = async () => {
  if (!hasSupabase || !supabase) return wmock.branch;
  const { data, error } = await supabase.from("water_branch").select("*").limit(1).maybeSingle();
  if (error) throw error;
  return data ?? wmock.branch;
};

export const fetchWaterKpis = async () => {
  if (!hasSupabase || !supabase) return wmock.waterKpis;
  const { data, error } = await supabase.from("water_kpis").select("*").limit(1).maybeSingle();
  if (error) throw error;
  return data ?? wmock.waterKpis;
};

export const fetchHourlySales = async () =>
  fromTable("water_hourly_sales", (r) => ({ hour: r.hour, litres: Number(r.litres), revenue: Number(r.revenue) }), wmock.hourlySales as any);

export const fetchTransactions = async () =>
  fromTable("water_transactions_view", (r) => ({
    id: r.id, time: r.time, cashier: r.cashier, items: r.items,
    amount: Number(r.amount), method: r.method, status: r.status,
  }), wmock.transactions);

export const fetchCashiers = async () =>
  fromTable("water_cashiers", (r) => ({
    id: r.id, name: r.name, phone: r.phone, shift: r.shift, status: r.status,
    todaySales: Number(r.today_sales), txns: r.txns,
  }), wmock.cashiers);

export const fetchStockRequests = async () =>
  fromTable("water_stock_requests", (r) => ({
    id: r.id, date: r.date, items: r.items, status: r.status, note: r.note ?? "",
  }), wmock.stockRequests);

export const fetchBranchExpenses = async () =>
  fromTable("water_branch_expenses", (r) => ({
    id: r.id, date: r.date, staff: r.staff, category: r.category,
    description: r.description, amount: Number(r.amount), status: r.status,
  }), wmock.branchExpenses);

export const fetchRefunds = async () =>
  fromTable("water_refunds", (r) => ({
    id: r.id, txn: r.txn, date: r.date, customer: r.customer, cashier: r.cashier,
    reason: r.reason, amount: Number(r.amount), status: r.status,
  }), wmock.refunds);
