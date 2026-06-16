"use server";

import { revalidatePath } from "next/cache";
import { requireDashboardAccess } from "@/lib/auth";
import { isServiceRoleConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { attendeeUpdateSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

type AttendeeActionResult = {
  ok: boolean;
  message: string;
};

export async function updateAttendeeAction(input: FormData): Promise<AttendeeActionResult> {
  const access = await requireDashboardAccess(["owner", "admin", "manager"]);
  const parsed = attendeeUpdateSchema.safeParse({
    attendeeId: input.get("attendeeId"),
    firstName: input.get("firstName"),
    lastName: input.get("lastName"),
    email: input.get("email"),
    phone: input.get("phone"),
    company: input.get("company"),
    roleTitle: input.get("roleTitle"),
    dateOfBirth: input.get("dateOfBirth"),
    notes: input.get("notes"),
    smsConsent: input.get("smsConsent") === "on",
    emailConsent: input.get("emailConsent") === "on",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid attendee update." };
  }

  if (!isServiceRoleConfigured()) {
    return { ok: true, message: "Attendee update validated. Connect Supabase to persist it." };
  }

  const values = parsed.data;
  const supabase = createSupabaseAdminClient();
  const { data: attendee, error } = await supabase
    .from("attendees")
    .update({
      first_name: values.firstName,
      last_name: values.lastName,
      email: values.email || null,
      phone: values.phone || null,
      company: values.company || null,
      role_title: values.roleTitle || null,
      date_of_birth: values.dateOfBirth || null,
      notes: values.notes || null,
      sms_consent_status: values.smsConsent,
      email_consent_status: values.emailConsent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", values.attendeeId)
    .select("id, organization_id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "Another attendee already uses that email address." };
    }

    return { ok: false, message: error.message };
  }

  if (!attendee) {
    return { ok: false, message: "Attendee not found." };
  }

  await writeAuditLog({
    organizationId: attendee.organization_id,
    actorUserId: access.userId ?? undefined,
    action: "attendee.updated",
    entityType: "attendee",
    entityId: attendee.id,
  });

  revalidatePath("/dashboard/attendees");
  revalidatePath(`/dashboard/attendees/${attendee.id}`);

  return { ok: true, message: "Attendee updated." };
}
