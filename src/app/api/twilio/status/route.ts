import { NextResponse } from "next/server";
import { isServiceRoleConfigured } from "@/lib/env";
import { verifyTwilioRequest } from "@/lib/security/request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const form = await request.formData();
  if (!(await verifyTwilioRequest(request, form))) {
    return NextResponse.json({ ok: false, message: "Invalid Twilio signature." }, { status: 403 });
  }

  const messageSid = String(form.get("MessageSid") ?? form.get("SmsSid") ?? "");
  const messageStatus = String(form.get("MessageStatus") ?? form.get("SmsStatus") ?? "");
  const errorCode = form.get("ErrorCode");

  if (isServiceRoleConfigured() && messageSid) {
    const supabase = createSupabaseAdminClient();
    await supabase
      .from("message_sends")
      .update({
        provider_status: messageStatus,
        provider_error: errorCode ? `Twilio error ${String(errorCode)}` : null,
        status: messageStatus === "delivered" ? "delivered" : messageStatus === "failed" ? "failed" : "sent",
        delivered_at: messageStatus === "delivered" ? new Date().toISOString() : null,
      })
      .eq("provider_message_sid", messageSid);
  }

  return NextResponse.json({ ok: true });
}
