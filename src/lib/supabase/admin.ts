import { createClient } from "@supabase/supabase-js";
import { requireServiceConfig } from "@/lib/env";

export function createSupabaseAdminClient() {
  const config = requireServiceConfig();

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

