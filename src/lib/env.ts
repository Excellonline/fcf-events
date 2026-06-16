export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM,
  emailReplyTo: process.env.EMAIL_REPLY_TO,
  encryptionKey: process.env.APP_ENCRYPTION_KEY,
  airtableApiBase: process.env.AIRTABLE_API_BASE ?? "https://api.airtable.com/v0",
  zeffyApiBase: process.env.ZEFFY_API_BASE ?? "https://api.zeffy.com",
  zeffyApiKey: process.env.ZEFFY_API_KEY,
  zeffyWebhookSecret: process.env.ZEFFY_WEBHOOK_SECRET,
  zeffySyncSecret: process.env.ZEFFY_SYNC_SECRET,
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
