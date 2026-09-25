import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://phsiawenrgkzxxhrgtlm.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder";

/**
 * Public client for client-side interactions and auth
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Admin client with Service Role for backend privileged operations
 */
export function getSupabaseAdmin() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || serviceRoleKey.includes("placeholder")) {
    return supabase;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Trigger Google OAuth with Supabase Auth
 */
export async function signInWithGoogleOAuth(redirectTo?: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const targetRedirect = redirectTo || `${origin}/auth/callback`;

  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: targetRedirect,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
}

/**
 * Request password reset email via Supabase Auth
 */
export async function sendPasswordResetEmail(email: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });
}

/**
 * Update user password after clicking reset link
 */
export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({
    password: newPassword,
  });
}
