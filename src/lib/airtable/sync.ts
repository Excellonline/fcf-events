import { isServiceRoleConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function runAirtableSyncJob(organizationId: string) {
  if (!isServiceRoleConfigured()) {
    return { ok: true, message: "Sync request validated. Connect Supabase to record sync logs." };
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("airtable_sync_logs").insert({
    organization_id: organizationId,
    entity_type: "manual_sync",
    status: "skipped",
    error_message: "TODO_EXTERNAL_PROVIDER_REQUIRED: complete field mappings and token before production sync.",
  });
  return { ok: true, message: "Sync log created. Complete mappings before production sync." };
}
