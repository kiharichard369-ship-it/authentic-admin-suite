// Loads the vendor's payment configuration from water_payment_config.
// Falls back to defaults (both methods enabled, no M-Pesa credentials)
// so the POS always renders even if config hasn't been saved yet.

import { supabase, hasSupabase } from "./supabase";
import { getSession } from "./auth";

export type PaymentConfig = {
  shortcode:       string;
  passkey:         string;
  consumer_key:    string;
  consumer_secret: string;
  callback_url:    string;
  environment:     "sandbox" | "production";
  mpesa_enabled:   boolean;
  cash_enabled:    boolean;
  paybill_display: string;
  account_display: string;
};

export const PAYMENT_DEFAULTS: PaymentConfig = {
  shortcode: "", passkey: "", consumer_key: "", consumer_secret: "",
  callback_url: "", environment: "sandbox",
  mpesa_enabled: true, cash_enabled: true,
  paybill_display: "", account_display: "",
};

export async function fetchPaymentConfig(): Promise<PaymentConfig> {
  if (!hasSupabase || !supabase) return PAYMENT_DEFAULTS;
  const vendorId = getSession()?.vendorId;
  if (!vendorId) return PAYMENT_DEFAULTS;

  const { data } = await supabase
    .from("water_payment_config")
    .select("shortcode,passkey,consumer_key,consumer_secret,callback_url,environment,mpesa_enabled,cash_enabled,paybill_display,account_display")
    .eq("vendor_id", vendorId)
    .maybeSingle();

  if (!data) return PAYMENT_DEFAULTS;
  return {
    shortcode:       data.shortcode       ?? "",
    passkey:         data.passkey         ?? "",
    consumer_key:    data.consumer_key    ?? "",
    consumer_secret: data.consumer_secret ?? "",
    callback_url:    data.callback_url    ?? "",
    environment:     (data.environment as "sandbox" | "production") ?? "sandbox",
    mpesa_enabled:   data.mpesa_enabled   ?? true,
    cash_enabled:    data.cash_enabled    ?? true,
    paybill_display: data.paybill_display ?? "",
    account_display: data.account_display ?? "",
  };
}
