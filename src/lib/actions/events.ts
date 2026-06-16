"use server";

import { revalidatePath } from "next/cache";
import { requireDashboardAccess } from "@/lib/auth";
import { isServiceRoleConfigured } from "@/lib/env";
import { demoOrganizationId } from "@/lib/demo-data";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  eventSchema,
  eventTicketTypesCreateSchema,
  eventUpdateSchema,
  ticketTypeSchema,
  zeffyEventSettingsSchema,
} from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import type { Role } from "@/lib/types";
import { fetchZeffyTicketOffers, type ZeffyTicketOffer } from "@/lib/zeffy";

const EVENT_MANAGEMENT_ROLES: Role[] = ["owner", "admin", "manager"];

type ActionResult = {
  ok: boolean;
  message: string;
};

export async function createEventAction(input: FormData) {
  const zeffyFields = readZeffyFields(input);
  const ticketTypes = readTicketTypeDraftForms(input);
  const parsed = eventSchema.safeParse({
    title: input.get("title"),
    slug: input.get("slug"),
    startsAt: input.get("startsAt"),
    endsAt: input.get("endsAt"),
    venueName: input.get("venueName"),
    address: input.get("address"),
    room: input.get("room"),
    description: input.get("description"),
    complianceNotes: input.get("complianceNotes"),
    capacity: input.get("capacity") || undefined,
    status: input.get("status"),
    visibility: input.get("visibility"),
    minimumAge: input.get("minimumAge"),
    ...zeffyFields,
  });
  const parsedTicketTypes = eventTicketTypesCreateSchema.safeParse(ticketTypes);

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid event." };
  }

  if (!parsedTicketTypes.success) {
    return { ok: false, message: parsedTicketTypes.error.issues[0]?.message ?? "Invalid ticket types." };
  }

  if (!isServiceRoleConfigured()) {
    return { ok: true, message: "Event and ticket types validated. Connect Supabase to persist them.", persisted: false };
  }

  const values = parsed.data;
  const ticketTypeValues = parsedTicketTypes.data;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      organization_id: demoOrganizationId,
      title: values.title,
      slug: values.slug,
      starts_at: values.startsAt,
      ends_at: values.endsAt,
      venue_name: values.venueName,
      address: values.address,
      room: values.room,
      description: values.description,
      compliance_notes: values.complianceNotes || null,
      capacity: values.capacity,
      status: values.status,
      visibility: values.visibility,
      minimum_age: values.minimumAge,
      zeffy_campaign_id: values.zeffyCampaignId || null,
      zeffy_form_url: values.zeffyFormUrl || null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: error.message };

  if (ticketTypeValues.length) {
    const { error: ticketTypeError } = await supabase.from("ticket_types").insert(
      ticketTypeValues.map((ticketType) => ({
        organization_id: demoOrganizationId,
        event_id: data.id,
        ...toTicketTypePayload(ticketType),
      })),
    );

    if (ticketTypeError) {
      await supabase.from("events").delete().eq("id", data.id).eq("organization_id", demoOrganizationId);
      return { ok: false, message: ticketTypeError.message };
    }
  }

  const syncResult = values.zeffyFormUrl
    ? await syncZeffyTicketTypes({
        supabase,
        eventId: data.id,
        organizationId: demoOrganizationId,
        formUrl: values.zeffyFormUrl,
      })
    : null;

  await writeAuditLog({
    organizationId: demoOrganizationId,
    action: "event.created",
    entityType: "event",
    entityId: data.id,
    metadata: { ticketTypeCount: ticketTypeValues.length + (syncResult?.synced ?? 0) },
  });

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard/check-in");
  revalidatePath("/check-in");
  revalidatePath(`/e/${values.slug}`);
  return {
    ok: true,
    message: withZeffySyncMessage(
      ticketTypeValues.length ? "Event and ticket types created." : "Event created.",
      syncResult,
    ),
    persisted: true,
    slug: values.slug,
  };
}

export async function updateEventAction(input: FormData) {
  const zeffyFields = readZeffyFields(input);
  const parsed = eventUpdateSchema.safeParse({
    eventId: input.get("eventId"),
    title: input.get("title"),
    slug: input.get("slug"),
    startsAt: input.get("startsAt"),
    endsAt: input.get("endsAt"),
    venueName: input.get("venueName"),
    address: input.get("address"),
    room: input.get("room"),
    description: input.get("description"),
    complianceNotes: input.get("complianceNotes"),
    capacity: input.get("capacity") || undefined,
    status: input.get("status"),
    visibility: input.get("visibility"),
    minimumAge: input.get("minimumAge"),
    ...zeffyFields,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid event." };
  }

  if (!isServiceRoleConfigured()) {
    return { ok: true, message: "Event validated. Connect Supabase to persist it.", persisted: false };
  }

  const values = parsed.data;
  const supabase = createSupabaseAdminClient();
  const { data: existingEvent, error: eventError } = await supabase
    .from("events")
    .select("id, organization_id, slug")
    .eq("id", values.eventId)
    .maybeSingle();

  if (eventError || !existingEvent) return { ok: false, message: "Event not found." };

  const { error } = await supabase
    .from("events")
    .update({
      title: values.title,
      slug: values.slug,
      starts_at: values.startsAt,
      ends_at: values.endsAt,
      venue_name: values.venueName || null,
      address: values.address || null,
      room: values.room || null,
      description: values.description,
      compliance_notes: values.complianceNotes || null,
      capacity: values.capacity ?? null,
      status: values.status,
      visibility: values.visibility,
      minimum_age: values.minimumAge,
      zeffy_campaign_id: values.zeffyCampaignId || null,
      zeffy_form_url: values.zeffyFormUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", values.eventId);

  if (error) return { ok: false, message: error.message };

  const syncResult = values.zeffyFormUrl
    ? await syncZeffyTicketTypes({
        supabase,
        eventId: existingEvent.id,
        organizationId: existingEvent.organization_id,
        formUrl: values.zeffyFormUrl,
      })
    : null;

  await writeAuditLog({
    organizationId: existingEvent.organization_id,
    action: "event.updated",
    entityType: "event",
    entityId: existingEvent.id,
    metadata: syncResult ? { zeffyTicketTypesSynced: syncResult.synced } : undefined,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard/check-in");
  revalidatePath("/check-in");
  revalidatePath("/");
  revalidatePath(`/dashboard/events/${existingEvent.slug}`);
  revalidatePath(`/dashboard/events/${values.slug}`);
  revalidatePath(`/e/${existingEvent.slug}`);
  revalidatePath(`/e/${values.slug}`);

  return {
    ok: true,
    message: withZeffySyncMessage("Event updated.", syncResult),
    persisted: true,
    slug: values.slug,
  };
}

export async function updateEventZeffySettingsAction(input: FormData) {
  const zeffyFields = readZeffyFields(input);
  const parsed = zeffyEventSettingsSchema.safeParse({
    eventId: input.get("eventId"),
    ...zeffyFields,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid Zeffy settings." };
  }

  if (!isServiceRoleConfigured()) {
    return { ok: true, message: "Zeffy settings validated. Connect Supabase to persist them." };
  }

  const values = parsed.data;
  const supabase = createSupabaseAdminClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, organization_id, slug")
    .eq("id", values.eventId)
    .maybeSingle();

  if (eventError || !event) return { ok: false, message: "Event not found." };

  const { error } = await supabase
    .from("events")
    .update({
      zeffy_campaign_id: values.zeffyCampaignId || null,
      zeffy_form_url: values.zeffyFormUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", values.eventId);

  if (error) return { ok: false, message: error.message };

  const syncResult = values.zeffyFormUrl
    ? await syncZeffyTicketTypes({
        supabase,
        eventId: event.id,
        organizationId: event.organization_id,
        formUrl: values.zeffyFormUrl,
      })
    : null;

  await writeAuditLog({
    organizationId: event.organization_id,
    action: "event.zeffy_settings.updated",
    entityType: "event",
    entityId: event.id,
    metadata: syncResult ? { zeffyTicketTypesSynced: syncResult.synced } : undefined,
  });

  revalidatePath("/dashboard/events");
  revalidatePath(`/dashboard/events/${event.slug}`);
  revalidatePath(`/e/${event.slug}`);
  return { ok: true, message: withZeffySyncMessage("Zeffy settings updated.", syncResult) };
}

export async function createTicketTypeAction(input: FormData): Promise<ActionResult> {
  const access = await requireDashboardAccess(EVENT_MANAGEMENT_ROLES);
  const parsed = ticketTypeSchema.safeParse(readTicketTypeForm(input));

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid ticket type." };
  }

  if (!isServiceRoleConfigured()) {
    return { ok: true, message: "Ticket type validated. Connect Supabase to persist it." };
  }

  const values = parsed.data;
  const supabase = createSupabaseAdminClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, organization_id, slug")
    .eq("id", values.eventId)
    .maybeSingle();

  if (eventError || !event) return { ok: false, message: "Event not found." };

  const { data, error } = await supabase
    .from("ticket_types")
    .insert({
      organization_id: event.organization_id,
      event_id: event.id,
      ...toTicketTypePayload(values),
    })
    .select("id")
    .single();

  if (error) return { ok: false, message: error.message };

  await writeAuditLog({
    organizationId: event.organization_id,
    actorUserId: access.userId ?? undefined,
    action: "ticket_type.created",
    entityType: "ticket_type",
    entityId: data.id,
    metadata: { eventId: event.id, name: values.name },
  });

  revalidateTicketTypePaths(event.slug);
  return { ok: true, message: "Ticket type created." };
}

export async function updateTicketTypeAction(input: FormData): Promise<ActionResult> {
  const access = await requireDashboardAccess(EVENT_MANAGEMENT_ROLES);
  const parsed = ticketTypeSchema.safeParse(readTicketTypeForm(input, { requireId: true }));

  if (!parsed.success || !parsed.data.id) {
    return { ok: false, message: parsed.error?.issues[0]?.message ?? "Choose a ticket type to update." };
  }

  if (!isServiceRoleConfigured()) {
    return { ok: true, message: "Ticket type changes validated. Connect Supabase to persist them." };
  }

  const values = parsed.data;
  const supabase = createSupabaseAdminClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, organization_id, slug")
    .eq("id", values.eventId)
    .maybeSingle();

  if (eventError || !event) return { ok: false, message: "Event not found." };

  const { data, error } = await supabase
    .from("ticket_types")
    .update({
      ...toTicketTypePayload(values),
      updated_at: new Date().toISOString(),
    })
    .eq("id", values.id)
    .eq("event_id", event.id)
    .eq("organization_id", event.organization_id)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, message: error.message };
  if (!data) return { ok: false, message: "Ticket type not found." };

  await writeAuditLog({
    organizationId: event.organization_id,
    actorUserId: access.userId ?? undefined,
    action: "ticket_type.updated",
    entityType: "ticket_type",
    entityId: data.id,
    metadata: { eventId: event.id, name: values.name },
  });

  revalidateTicketTypePaths(event.slug);
  return { ok: true, message: "Ticket type updated." };
}

function readTicketTypeForm(input: FormData, options?: { requireId?: boolean }) {
  const ticketTypeId = String(input.get("id") ?? "").trim();

  return {
    id: options?.requireId ? ticketTypeId : ticketTypeId || undefined,
    eventId: input.get("eventId"),
    name: input.get("name"),
    description: input.get("description") ?? "",
    price: input.get("price"),
    currency: input.get("currency") || "CAD",
    capacityLimit: input.get("capacityLimit"),
    visibility: input.get("visibility"),
  };
}

type TicketTypePayloadValues = {
  name: string;
  description?: string;
  price: number;
  currency: string;
  capacityLimit?: number;
  visibility: "public" | "private" | "hidden";
};

function toTicketTypePayload(values: TicketTypePayloadValues) {
  return {
    name: values.name,
    description: values.description || "",
    price: values.price,
    currency: values.currency,
    capacity_limit: values.capacityLimit ?? null,
    visibility: values.visibility,
    payment_method: values.price === 0 ? "free" : "manual",
  };
}

type ZeffyTicketSyncResult = {
  synced: number;
  inserted: number;
  updated: number;
  error?: string;
};

async function syncZeffyTicketTypes({
  supabase,
  eventId,
  organizationId,
  formUrl,
}: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  eventId: string;
  organizationId: string;
  formUrl: string;
}): Promise<ZeffyTicketSyncResult> {
  try {
    const offers = await fetchZeffyTicketOffers(formUrl);
    if (!offers.length) {
      return { synced: 0, inserted: 0, updated: 0, error: "No Zeffy ticket prices were found on the form." };
    }

    const { data: existingTicketTypes, error } = await supabase
      .from("ticket_types")
      .select("id, name")
      .eq("event_id", eventId)
      .eq("organization_id", organizationId);

    if (error) return { synced: 0, inserted: 0, updated: 0, error: error.message };

    const existingByName = new Map(
      (existingTicketTypes ?? []).map((ticketType) => [normalizeTicketName(ticketType.name as string), ticketType.id as string]),
    );
    let inserted = 0;
    let updated = 0;

    for (const offer of offers) {
      const existingId = existingByName.get(normalizeTicketName(offer.name));
      const payload = toZeffyTicketTypePayload(offer);

      if (existingId) {
        const { error: updateError } = await supabase
          .from("ticket_types")
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingId)
          .eq("event_id", eventId)
          .eq("organization_id", organizationId);

        if (updateError) return { synced: inserted + updated, inserted, updated, error: updateError.message };
        updated += 1;
        continue;
      }

      const { error: insertError } = await supabase.from("ticket_types").insert({
        organization_id: organizationId,
        event_id: eventId,
        ...payload,
      });

      if (insertError) return { synced: inserted + updated, inserted, updated, error: insertError.message };
      inserted += 1;
    }

    return { synced: inserted + updated, inserted, updated };
  } catch (error) {
    return {
      synced: 0,
      inserted: 0,
      updated: 0,
      error: error instanceof Error ? error.message : "Could not sync Zeffy ticket prices.",
    };
  }
}

function toZeffyTicketTypePayload(offer: ZeffyTicketOffer) {
  return {
    name: offer.name,
    description: offer.description.slice(0, 1000),
    price: offer.price,
    currency: offer.currency,
    capacity_limit: null,
    visibility: "public" as const,
    payment_method: offer.price === 0 ? "free" : "future_provider",
  };
}

function normalizeTicketName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function withZeffySyncMessage(message: string, syncResult: ZeffyTicketSyncResult | null) {
  if (!syncResult) return message;
  if (syncResult.error) return `${message} Zeffy ticket sync warning: ${syncResult.error}`;
  if (!syncResult.synced) return `${message} No Zeffy ticket prices were found.`;
  return `${message} Synced ${syncResult.synced} Zeffy ticket type${syncResult.synced === 1 ? "" : "s"}.`;
}

function readTicketTypeDraftForms(input: FormData) {
  const names = input.getAll("ticketName");
  const descriptions = input.getAll("ticketDescription");
  const prices = input.getAll("ticketPrice");
  const currencies = input.getAll("ticketCurrency");
  const capacityLimits = input.getAll("ticketCapacityLimit");
  const visibilities = input.getAll("ticketVisibility");
  const count = Math.max(
    names.length,
    descriptions.length,
    prices.length,
    currencies.length,
    capacityLimits.length,
    visibilities.length,
  );

  return Array.from({ length: count }).flatMap((_, index) => {
    const name = String(names[index] ?? "").trim();
    const description = String(descriptions[index] ?? "").trim();
    const price = String(prices[index] ?? "").trim();
    const capacityLimit = String(capacityLimits[index] ?? "").trim();

    if (!name && !description && !price && !capacityLimit) return [];

    return {
      name,
      description,
      price,
      currency: String(currencies[index] ?? "CAD"),
      capacityLimit,
      visibility: String(visibilities[index] ?? "public"),
    };
  });
}

function revalidateTicketTypePaths(eventSlug: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard/discounts");
  revalidatePath("/dashboard/check-in");
  revalidatePath("/check-in");
  revalidatePath(`/dashboard/events/${eventSlug}`);
  revalidatePath(`/e/${eventSlug}`);
}

function readZeffyFields(input: FormData) {
  let zeffyCampaignId = String(input.get("zeffyCampaignId") ?? "").trim();
  let zeffyFormUrl = String(input.get("zeffyFormUrl") ?? "").trim();

  if (isZeffyUrl(zeffyCampaignId)) {
    zeffyFormUrl ||= zeffyCampaignId;
    zeffyCampaignId = "";
  }

  return { zeffyCampaignId, zeffyFormUrl };
}

function isZeffyUrl(value: string) {
  return /^https?:\/\/([^/]+\.)?zeffy\.com\//i.test(value);
}
