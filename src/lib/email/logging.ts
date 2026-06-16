import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

export async function logEmailSend(input: {
  supabase: SupabaseAdminClient;
  organizationId: string;
  registrationId: string;
  attendeeId: string;
  toEmail: string;
  subject: string;
  body: string;
  status: "sent" | "failed";
  providerStatus: string;
}) {
  const { error } = await input.supabase.from("email_sends").insert({
    organization_id: input.organizationId,
    registration_id: input.registrationId,
    attendee_id: input.attendeeId,
    to_email: input.toEmail,
    subject_snapshot: input.subject,
    body_snapshot: input.body,
    provider_status: input.providerStatus.slice(0, 500),
    status: input.status,
  });

  if (error) {
    console.error("Could not log email send.", error);
  }
}

export async function hasSentTicketConfirmation(supabase: SupabaseAdminClient, registrationId: string) {
  const { data } = await supabase
    .from("email_sends")
    .select("id")
    .eq("registration_id", registrationId)
    .eq("status", "sent")
    .ilike("subject_snapshot", "Your FCF ticket for %")
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}
