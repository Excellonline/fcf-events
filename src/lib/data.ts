import {
  demoAttendees,
  demoEvents,
  demoMetrics,
  demoRegistrationTrend,
  demoSessions,
  demoTicketBreakdown,
  demoTicketTypes,
} from "@/lib/demo-data";
import { isServiceRoleConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  AttendeeSummary,
  DashboardMetrics,
  EventSummary,
  SessionSummary,
  TicketTypeSummary,
} from "@/lib/types";

export async function getEvents(): Promise<EventSummary[]> {
  if (!isServiceRoleConfigured()) return demoEvents;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("events").select("*").order("starts_at");
  if (error || !data || data.length === 0) return demoEvents;
  return data as EventSummary[];
}

export async function getEventBySlug(slug: string): Promise<EventSummary | null> {
  if (!isServiceRoleConfigured()) return demoEvents.find((event) => event.slug === slug) ?? null;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  if (error || !data) return demoEvents.find((event) => event.slug === slug) ?? null;
  return data as EventSummary;
}

export async function getEventById(id: string): Promise<EventSummary | null> {
  if (!isServiceRoleConfigured()) return demoEvents.find((event) => event.id === id) ?? null;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (error || !data) return demoEvents.find((event) => event.id === id) ?? null;
  return data as EventSummary;
}

export async function getSessions(eventId?: string): Promise<SessionSummary[]> {
  if (!isServiceRoleConfigured()) {
    return eventId ? demoSessions.filter((session) => session.event_id === eventId) : demoSessions;
  }
  const supabase = createSupabaseAdminClient();
  let query = supabase.from("sessions").select("*").order("starts_at");
  if (eventId) query = query.eq("event_id", eventId);
  const { data, error } = await query;
  if (error || !data) return eventId ? demoSessions.filter((session) => session.event_id === eventId) : demoSessions;
  return data as SessionSummary[];
}

export async function getTicketTypes(eventId?: string): Promise<TicketTypeSummary[]> {
  if (!isServiceRoleConfigured()) {
    return eventId ? demoTicketTypes.filter((ticket) => ticket.event_id === eventId) : demoTicketTypes;
  }
  const supabase = createSupabaseAdminClient();
  let query = supabase.from("ticket_types").select("*").order("price");
  if (eventId) query = query.eq("event_id", eventId);
  const { data, error } = await query;
  if (error || !data) return eventId ? demoTicketTypes.filter((ticket) => ticket.event_id === eventId) : demoTicketTypes;
  return data.map((ticket) => ({
    ...ticket,
    price: Number(ticket.price),
  })) as TicketTypeSummary[];
}

export async function getAttendees(): Promise<AttendeeSummary[]> {
  if (!isServiceRoleConfigured()) return demoAttendees;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("attendees").select("*").order("last_registered_at", { ascending: false });
  if (error || !data) return demoAttendees;
  return data as AttendeeSummary[];
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  if (!isServiceRoleConfigured()) return demoMetrics;

  const supabase = createSupabaseAdminClient();
  const [{ count: eventCount }, { count: registrationCount }, { count: attendanceCount }, { count: consentCount }] =
    await Promise.all([
      supabase.from("events").select("*", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("registrations").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
      supabase.from("attendance_logs").select("*", { count: "exact", head: true }),
      supabase.from("attendees").select("*", { count: "exact", head: true }).eq("sms_consent_status", true),
    ]);

  const totalRegistered = registrationCount ?? 0;
  const totalCheckedIn = attendanceCount ?? 0;
  const smsConsentRate = totalRegistered > 0 ? Math.round(((consentCount ?? 0) / totalRegistered) * 100) : 0;

  return {
    upcomingEvents: eventCount ?? 0,
    activePublishedEvents: eventCount ?? 0,
    totalRegistered,
    totalCheckedIn,
    checkInPercentage: totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0,
    repeatAttendeeRate: 0,
    smsConsentRate,
    smsDelivered: 0,
    smsFailed: 0,
  };
}

export async function getAnalyticsData() {
  return {
    registrationTrend: demoRegistrationTrend,
    ticketBreakdown: demoTicketBreakdown,
  };
}
