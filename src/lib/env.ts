export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  encryptionKey: process.env.APP_ENCRYPTION_KEY,
  airtableApiBase: process.env.AIRTABLE_API_BASE ?? "https://api.airtable.com/v0",
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function isServiceRoleConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}

export function requireServiceConfig() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error("Supabase service role is not configured.");
  }
  return {
    url: env.supabaseUrl,
    serviceRoleKey: env.supabaseServiceRoleKey,
  };
}

