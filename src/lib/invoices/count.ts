import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;
let hasWarnedAboutConfiguration = false;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    if (!hasWarnedAboutConfiguration) {
      console.error(
        "Invoice counter is not configured. Set NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.",
      );
      hasWarnedAboutConfiguration = true;
    }
    return null;
  }

  adminClient ??= createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}

function normalizeCount(value: unknown) {
  const count = typeof value === "number" ? value : Number(value);
  return Number.isSafeInteger(count) && count >= 0 ? count : null;
}

export async function getProcessedInvoiceCount() {
  const client = getAdminClient();
  if (!client) return null;

  const { data, error } = await client
    .from("invoice_metrics")
    .select("processed_count")
    .eq("id", "global")
    .maybeSingle();

  if (error) {
    console.error("Could not read the processed invoice count:", error.message);
    return null;
  }

  return normalizeCount(data?.processed_count);
}

export async function incrementProcessedInvoiceCount() {
  const client = getAdminClient();
  if (!client) return null;

  const { data, error } = await client.rpc("increment_invoice_count");

  if (error) {
    console.error("Could not increment the processed invoice count:", error.message);
    return null;
  }

  return normalizeCount(data);
}
