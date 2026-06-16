"use server";

import { headers } from "next/headers";
import { EmailConfigurationError, sendEmail } from "@/lib/email/provider";
import { isServiceRoleConfigured } from "@/lib/env";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";
import { ticketUrl } from "@/lib/security/qr";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTicketDetails } from "@/lib/data";
import { ticketEmailSchema } from "@/lib/validation";
import { currency, eventLocationLabel } from "@/lib/utils";
import { writeAuditLog } from "@/lib/audit";
import type { TicketDetails } from "@/lib/types";

type TicketEmailResult = {
  ok: boolean;
  message: string;
};

export async function sendTicketEmail(input: unknown): Promise<TicketEmailResult> {
  const parsed = ticketEmailSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Use a valid email address." };
  }

  const values = parsed.data;
  const headerStore = await headers();
  const ipLimited = rateLimit(`ticket-email-ip:${clientIp(headerStore)}`, 10, 60 * 60 * 1000);
  if (!ipLimited.allowed) {
    return { ok: false, message: "Too many ticket email attempts. Please try again later." };
  }

  const limited = rateLimit(`ticket-email:${values.ticketCode}:${values.recipientEmail}`, 3, 60 * 60 * 1000);
  if (!limited.allowed) {
    return { ok: false, message: "Too many ticket email attempts. Please try again later." };
  }

  const ticket = await getTicketDetails(values.ticketCode);
  if (!ticket) return { ok: false, message: "Ticket could not be found." };

  const subject = `Your FCF ticket for ${ticket.event_title}`;
  const text = buildTicketEmailText(ticket);
  const html = buildTicketEmailHtml(ticket);

  if (!isServiceRoleConfigured()) {
    return { ok: true, message: "Ticket email validated. Connect Supabase and Resend to deliver emails." };
  }

  const supabase = createSupabaseAdminClient();
  const { data: emailSend } = await supabase
    .from("email_sends")
    .insert({
      organization_id: ticket.organization_id,
      registration_id: ticket.registration_id,
      attendee_id: ticket.attendee_id,
      to_email: values.recipientEmail,
      subject_snapshot: subject,
      body_snapshot: text,
      provider_status: "queued",
      status: "queued",
    })
    .select("id")
    .single();

  try {
    const send = await sendEmail({
      to: values.recipientEmail,
      subject,
      text,
      html,
      tags: {
        ticket_code: ticket.ticket_code,
        event_id: ticket.event_id,
      },
    });

    if (emailSend?.id) {
      await supabase
        .from("email_sends")
        .update({
          provider_status: send.id ? `resend:${send.id}` : "sent",
          status: "sent",
          updated_at: new Date().toISOString(),
        })
        .eq("id", emailSend.id);
    }

    await writeAuditLog({
      organizationId: ticket.organization_id,
      action: "ticket.email.sent",
      entityType: "ticket",
      entityId: ticket.ticket_id,
      metadata: { recipientEmail: values.recipientEmail, ticketCode: ticket.ticket_code },
    });

    return { ok: true, message: "Ticket email sent." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email delivery failed.";
    const isConfigurationError = error instanceof EmailConfigurationError;

    if (emailSend?.id) {
      await supabase
        .from("email_sends")
        .update({
          provider_status: isConfigurationError ? "provider_not_configured" : message,
          status: isConfigurationError ? "queued" : "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", emailSend.id);
    }

    if (isConfigurationError) {
      return { ok: true, message: "Ticket email queued. Configure Resend to deliver queued emails." };
    }

    return { ok: false, message };
  }
}

function buildTicketEmailText(ticket: TicketDetails) {
  const location = eventLocationLabel(ticket.venue_name, ticket.address) || "Venue TBA";
  const price =
    ticket.ticket_type_price === null
      ? null
      : currency(ticket.ticket_type_price, ticket.ticket_type_currency ?? "CAD");
  const sessions = ticket.sessions.length
    ? ticket.sessions.map((session) => `- ${session.title} (${formatDateTime(session.starts_at, ticket.event_timezone)})`).join("\n")
    : "No sessions selected.";

  return [
    `Your FCF event ticket is ready.`,
    ``,
    `Event: ${ticket.event_title}`,
    `Date and time: ${formatDateTime(ticket.event_starts_at, ticket.event_timezone)} - ${formatTime(ticket.event_ends_at, ticket.event_timezone)}`,
    `Location: ${location}`,
    ticket.room ? `Room: ${ticket.room}` : null,
    `Attendee: ${ticket.attendee_name}`,
    `Ticket type: ${ticket.ticket_type_name ?? "Event ticket"}${price ? ` (${price})` : ""}`,
    `Ticket code: ${ticket.ticket_code}`,
    `Ticket page: ${ticketUrl(ticket.ticket_code)}`,
    ``,
    `Selected sessions:`,
    sessions,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

function buildTicketEmailHtml(ticket: TicketDetails) {
  return `<div style="font-family:Arial,sans-serif;color:#111;line-height:1.5">
  <h1 style="margin:0 0 16px">Your FCF event ticket is ready</h1>
  <p><strong>Event:</strong> ${escapeHtml(ticket.event_title)}</p>
  <p><strong>Date and time:</strong> ${escapeHtml(formatDateTime(ticket.event_starts_at, ticket.event_timezone))} - ${escapeHtml(formatTime(ticket.event_ends_at, ticket.event_timezone))}</p>
  <p><strong>Location:</strong> ${escapeHtml(eventLocationLabel(ticket.venue_name, ticket.address) || "Venue TBA")}</p>
  <p><strong>Attendee:</strong> ${escapeHtml(ticket.attendee_name)}</p>
  <p><strong>Ticket type:</strong> ${escapeHtml(ticket.ticket_type_name ?? "Event ticket")}</p>
  <p><strong>Ticket code:</strong> <code>${escapeHtml(ticket.ticket_code)}</code></p>
  <p><a href="${escapeHtml(ticketUrl(ticket.ticket_code))}">Open ticket and QR code</a></p>
</div>`;
}

function formatDateTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

function formatTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
