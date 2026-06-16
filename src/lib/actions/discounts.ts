"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDashboardAccess } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { demoOrganizationId } from "@/lib/demo-data";
import { isServiceRoleConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { discountCodeSchema } from "@/lib/validation";
import type { Role } from "@/lib/types";

const DISCOUNT_MANAGEMENT_ROLES: Role[] = ["owner", "admin", "manager"];

type ActionResult = {
  ok: boolean;
  message: string;
};

export async function createDiscountCodeAction(input: FormData): Promise<ActionResult> {
  const access = await requireDashboardAccess(DISCOUNT_MANAGEMENT_ROLES);
  const parsed = discountCodeSchema.safeParse(readDiscountForm(input));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid discount code." };
  }

  if (!isServiceRoleConfigured()) {
    return { ok: true, message: "Discount code validated. Connect Supabase to persist it." };
  }

  const values = parsed.data;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .insert({
      organization_id: demoOrganizationId,
      ...toDiscountPayload(values),
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: friendlyDiscountError(error.message) };

  await writeAuditLog({
    organizationId: demoOrganizationId,
    actorUserId: access.userId ?? undefined,
    action: "discount.created",
    entityType: "discount_code",
    entityId: data.id,
    metadata: { code: values.code, type: values.type },
  });

  revalidatePath("/dashboard/discounts");
  return { ok: true, message: "Discount code created." };
}

export async function updateDiscountCodeAction(input: FormData): Promise<ActionResult> {
  const access = await requireDashboardAccess(DISCOUNT_MANAGEMENT_ROLES);
  const parsed = discountCodeSchema.safeParse(readDiscountForm(input, { requireId: true }));

  if (!parsed.success || !parsed.data.id) {
    return { ok: false, message: parsed.error?.issues[0]?.message ?? "Choose a discount code to update." };
  }

  if (!isServiceRoleConfigured()) {
    return { ok: true, message: "Discount code changes validated. Connect Supabase to persist them." };
  }

  const values = parsed.data;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("discount_codes")
    .update(toDiscountPayload(values))
    .eq("organization_id", demoOrganizationId)
    .eq("id", values.id)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, message: friendlyDiscountError(error.message) };
  if (!data) return { ok: false, message: "Discount code not found." };

  await writeAuditLog({
    organizationId: demoOrganizationId,
    actorUserId: access.userId ?? undefined,
    action: "discount.updated",
    entityType: "discount_code",
    entityId: data.id,
    metadata: { code: values.code, type: values.type },
  });

  revalidatePath("/dashboard/discounts");
  return { ok: true, message: "Discount code updated." };
}

export async function removeDiscountCodeAction(input: FormData): Promise<ActionResult> {
  const access = await requireDashboardAccess(DISCOUNT_MANAGEMENT_ROLES);
  const parsed = z.string().uuid().safeParse(input.get("id"));

  if (!parsed.success) return { ok: false, message: "Choose a discount code to remove." };

  if (!isServiceRoleConfigured()) {
    return { ok: true, message: "Discount code removal validated. Connect Supabase to persist it." };
  }

  const discountId = parsed.data;
  const supabase = createSupabaseAdminClient();
  const { data: discount } = await supabase
    .from("discount_codes")
    .select("id, code")
    .eq("organization_id", demoOrganizationId)
    .eq("id", discountId)
    .maybeSingle();

  if (!discount) return { ok: false, message: "Discount code not found." };

  const { count } = await supabase
    .from("discount_redemptions")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", demoOrganizationId)
    .eq("discount_code_id", discountId)
    .eq("success", true);

  if ((count ?? 0) > 0) {
    const { error } = await supabase
      .from("discount_codes")
      .update({ active: false })
      .eq("organization_id", demoOrganizationId)
      .eq("id", discountId);

    if (error) return { ok: false, message: error.message };

    await writeAuditLog({
      organizationId: demoOrganizationId,
      actorUserId: access.userId ?? undefined,
      action: "discount.deactivated",
      entityType: "discount_code",
      entityId: discountId,
      metadata: { code: discount.code, reason: "has_redemptions" },
    });

    revalidatePath("/dashboard/discounts");
    return { ok: true, message: "Discount code has redemptions, so it was deactivated." };
  }

  const { error } = await supabase
    .from("discount_codes")
    .delete()
    .eq("organization_id", demoOrganizationId)
    .eq("id", discountId);

  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    organizationId: demoOrganizationId,
    actorUserId: access.userId ?? undefined,
    action: "discount.deleted",
    entityType: "discount_code",
    entityId: discountId,
    metadata: { code: discount.code },
  });

  revalidatePath("/dashboard/discounts");
  return { ok: true, message: "Discount code removed." };
}

function readDiscountForm(input: FormData, options?: { requireId?: boolean }) {
  const maxTotalUses = optionalNumber(input.get("maxTotalUses"));

  return {
    id: options?.requireId ? String(input.get("id") ?? "") : optionalString(input.get("id")),
    code: input.get("code"),
    description: input.get("description") ?? "",
    type: input.get("type"),
    amount: input.get("amount") || "0",
    appliesToEventIds: stringArray(input, "appliesToEventIds"),
    appliesToTicketTypeIds: stringArray(input, "appliesToTicketTypeIds"),
    maxTotalUses,
    oneUsePerAttendee: input.get("oneUsePerAttendee") === "true",
    expiresAt: input.get("expiresAt") ?? "",
    active: input.get("active") === "true",
    minimumTicketQuantity: input.get("minimumTicketQuantity") || "1",
    internalNotes: input.get("internalNotes") ?? "",
  };
}

function toDiscountPayload(values: z.infer<typeof discountCodeSchema>) {
  return {
    code: values.code,
    description: values.description || null,
    type: values.type,
    amount: values.type === "comp" || values.type === "access_only" ? 0 : values.amount,
    applies_to_event_ids: values.appliesToEventIds,
    applies_to_ticket_type_ids: values.appliesToTicketTypeIds,
    max_total_uses: values.maxTotalUses ?? null,
    one_use_per_attendee: values.oneUsePerAttendee,
    expires_at: normalizeDateTime(values.expiresAt),
    active: values.active,
    minimum_ticket_quantity: values.minimumTicketQuantity,
    internal_notes: values.internalNotes || null,
  };
}

function stringArray(input: FormData, key: string) {
  return input
    .getAll(key)
    .map((value) => String(value))
    .filter(Boolean);
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

function optionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : undefined;
}

function normalizeDateTime(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function friendlyDiscountError(message: string) {
  if (message.toLowerCase().includes("duplicate key")) {
    return "That discount code already exists.";
  }

  return message;
}
