import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

/**
 * Public client for client-side interactions and auth
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Admin client with Service Role for backend privileged operations
 */
export function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || serviceRoleKey.includes("placeholder")) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY is not configured. Falling back to anon client.");
    return supabase;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
