import { NextResponse } from "next/server";
import { isServiceRoleConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const form = await request.formData();
  const from = String(form.get("From") ?? "");
  const to = String(form.get("To") ?? "");
  const body = String(form.get("Body") ?? "");
  const optOutType = form.get("OptOutType") ? String(form.get("OptOutType")) : undefined;
  const sid = String(form.get("MessageSid") ?? form.get("SmsSid") ?? "");
  const normalized = from.replace(/[^\d+]/g, "");
  const isStop = optOutType === "STOP" || /^stop$/i.test(body.trim());

  if (isServiceRoleConfigured()) {
    const supabase = createSupabaseAdminClient();
    const { data: config } = await supabase.from("twilio_configs").select("organization_id").or(`twilio_phone_number.eq.${to},messaging_service_sid.not.is.null`).maybeSingle();

    await supabase.from("inbound_sms_events").insert({
      organization_id: config?.organization_id,
      from_phone: from,
      to_phone: to,
      body,
      opt_out_type: optOutType,
      provider_message_sid: sid,
      raw_payload: Object.fromEntries(form.entries()),
      handled_at: new Date().toISOString(),
    });

    if (isStop && config?.organization_id) {
      const { data: attendees } = await supabase
        .from("attendees")
        .select("id")
        .eq("organization_id", config.organization_id)
        .eq("normalized_phone", normalized);

      if (attendees?.length) {
        await supabase
          .from("attendees")
          .update({ sms_consent_status: false })
          .in(
            "id",
            attendees.map((attendee) => attendee.id),
          );
      }
    }
  }

  return new NextResponse("<Response></Response>", {
    headers: { "Content-Type": "text/xml" },
  });
}

