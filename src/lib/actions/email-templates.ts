"use server";

import { revalidatePath } from "next/cache";
import { MANAGEMENT_ROLES, requireDashboardAccess } from "@/lib/auth";
import { isServiceRoleConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { emailTemplateSchema } from "@/lib/validation";

export async function createEmailTemplateAction(input: FormData) {
  const access = await requireDashboardAccess(MANAGEMENT_ROLES);
  const parsed = emailTemplateSchema.omit({ id: true }).safeParse({
    organizationId: input.get("organizationId"),
    name: input.get("name"),
    subject: input.get("subject"),
    body: input.get("body"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid email template." };
  }

  if (parsed.data.organizationId !== access.organizationId) {
    return { ok: false, message: "Template organization does not match your access." };
  }

  if (!isServiceRoleConfigured()) {
    revalidatePath("/dashboard/email-templates");
    return { ok: true, message: "Demo mode: template details validated." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("email_templates").insert({
    organization_id: parsed.data.organizationId,
    name: parsed.data.name,
    subject: parsed.data.subject,
    body: parsed.data.body,
  });

  revalidatePath("/dashboard/email-templates");
  return error ? { ok: false, message: error.message } : { ok: true, message: "Email template created." };
}

export async function updateEmailTemplateAction(input: FormData) {
  const access = await requireDashboardAccess(MANAGEMENT_ROLES);
  const parsed = emailTemplateSchema.safeParse({
    id: input.get("id"),
    organizationId: input.get("organizationId"),
    name: input.get("name"),
    subject: input.get("subject"),
    body: input.get("body"),
  });

  if (!parsed.success || !parsed.data.id) {
    return { ok: false, message: parsed.error?.issues[0]?.message ?? "Invalid email template." };
  }

  if (parsed.data.organizationId !== access.organizationId) {
    return { ok: false, message: "Template organization does not match your access." };
  }

  if (!isServiceRoleConfigured()) {
    revalidatePath("/dashboard/email-templates");
    return { ok: true, message: "Demo mode: template details validated." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("email_templates")
    .update({
      name: parsed.data.name,
      subject: parsed.data.subject,
      body: parsed.data.body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id)
    .eq("organization_id", parsed.data.organizationId);

  revalidatePath("/dashboard/email-templates");
  return error ? { ok: false, message: error.message } : { ok: true, message: "Email template updated." };
}
