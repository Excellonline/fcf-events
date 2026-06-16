import type {
  AttendeeSummary,
  DashboardMetrics,
  EventSummary,
  SessionSummary,
  TicketTypeSummary,
} from "@/lib/types";

const now = Date.now();

export const demoOrganizationId = "11111111-1111-1111-1111-111111111111";

export const demoEvents: EventSummary[] = [
  {
    id: "33333333-3333-3333-3333-333333333333",
    organization_id: demoOrganizationId,
    title: "FCF Cannabis Business Conference",
    slug: "fcf-business-conference",
    starts_at: new Date(now + 1000 * 60 * 60 * 24 * 30).toISOString(),
    ends_at: new Date(now + 1000 * 60 * 60 * 24 * 30 + 1000 * 60 * 60 * 8).toISOString(),
    timezone: "America/Toronto",
    venue_name: "Metro Toronto Convention Centre",
    address: "255 Front St W, Toronto, ON",
    room: "North Building",
    description:
      "A private industry conference for verified adult cannabis professionals, with focused seminars, networking, and staff-managed check-in.",
    capacity: 500,
    status: "published",
    visibility: "public",
    minimum_age: 19,
    compliance_notes:
      "Organizer must confirm applicable federal, provincial, territorial, and venue rules.",
  },
  {
    id: "33333333-3333-3333-3333-333333333334",
    organization_id: demoOrganizationId,
    title: "FCF Retail Operators Night",
    slug: "fcf-retail-operators-night",
    starts_at: new Date(now + 1000 * 60 * 60 * 24 * 52).toISOString(),
    ends_at: new Date(now + 1000 * 60 * 60 * 24 * 52 + 1000 * 60 * 60 * 4).toISOString(),
    timezone: "America/Toronto",
    venue_name: "Private Venue",
    address: "Toronto, ON",
    room: "Main Hall",
    description: "A focused evening for retail teams, suppliers, and operators.",
    capacity: 220,
    status: "draft",
    visibility: "private",
    minimum_age: 19,
    compliance_notes: "Draft event. Confirm invite and venue compliance before publishing.",
  },
];

export const demoSessions: SessionSummary[] = [
  {
    id: "44444444-4444-4444-4444-444444444441",
    event_id: demoEvents[0].id,
    title: "Compliance Operations Panel",
    slug: "compliance-operations-panel",
    starts_at: new Date(now + 1000 * 60 * 60 * 24 * 30 + 1000 * 60 * 60 * 2).toISOString(),
    ends_at: new Date(now + 1000 * 60 * 60 * 24 * 30 + 1000 * 60 * 60 * 3).toISOString(),
    room: "Stage A",
    capacity: 150,
    type: "panel",
    requires_registration: true,
  },
  {
    id: "44444444-4444-4444-4444-444444444442",
    event_id: demoEvents[0].id,
    title: "Retail Networking Seminar",
    slug: "retail-networking-seminar",
    starts_at: new Date(now + 1000 * 60 * 60 * 24 * 30 + 1000 * 60 * 60 * 4).toISOString(),
    ends_at: new Date(now + 1000 * 60 * 60 * 24 * 30 + 1000 * 60 * 60 * 5).toISOString(),
    room: "Room 201",
    capacity: 120,
    type: "networking",
    requires_registration: true,
  },
];

export const demoTicketTypes: TicketTypeSummary[] = [
  {
    id: "55555555-5555-5555-5555-555555555551",
    event_id: demoEvents[0].id,
    name: "General Admission",
    description: "Standard conference access.",
    price: 99,
    currency: "CAD",
    capacity_limit: 350,
    visibility: "public",
  },
  {
    id: "55555555-5555-5555-5555-555555555552",
    event_id: demoEvents[0].id,
    name: "VIP",
    description: "Includes VIP networking access.",
    price: 249,
    currency: "CAD",
    capacity_limit: 75,
    visibility: "public",
  },
];

export const demoAttendees: AttendeeSummary[] = [
  {
    id: "66666666-6666-6666-6666-666666666661",
    first_name: "Maya",
    last_name: "Reed",
    full_name: "Maya Reed",
    email: "maya@example.com",
    phone: "+14165550100",
    company: "Northline Retail",
    role_title: "Operations Lead",
    sms_consent_status: true,
    email_consent_status: true,
    events_registered_count: 3,
    events_attended_count: 2,
    sessions_attended_count: 4,
    last_registered_at: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
    last_attended_at: new Date(now - 1000 * 60 * 60 * 24 * 90).toISOString(),
  },
  {
    id: "66666666-6666-6666-6666-666666666662",
    first_name: "Andre",
    last_name: "Singh",
    full_name: "Andre Singh",
    email: "andre@example.com",
    phone: "+14165550101",
    company: "Green Room Ops",
    role_title: "Founder",
    sms_consent_status: false,
    email_consent_status: true,
    events_registered_count: 1,
    events_attended_count: 0,
    sessions_attended_count: 0,
    last_registered_at: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    last_attended_at: null,
  },
];

export const demoMetrics: DashboardMetrics = {
  upcomingEvents: 2,
  activePublishedEvents: 1,
  totalRegistered: 184,
  totalCheckedIn: 132,
  checkInPercentage: 72,
  repeatAttendeeRate: 31,
  smsConsentRate: 68,
  smsDelivered: 146,
  smsFailed: 4,
};

export const demoRegistrationTrend = [
  { date: "Jun 1", registrations: 12, checkins: 0 },
  { date: "Jun 5", registrations: 28, checkins: 0 },
  { date: "Jun 9", registrations: 51, checkins: 0 },
  { date: "Jun 13", registrations: 84, checkins: 0 },
  { date: "Jun 16", registrations: 116, checkins: 0 },
];

export const demoTicketBreakdown = [
  { name: "General", value: 112 },
  { name: "VIP", value: 43 },
  { name: "Speaker", value: 18 },
  { name: "Press", value: 11 },
];

