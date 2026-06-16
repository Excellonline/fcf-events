# FCF Events Architecture Review

## What We Are Building
FCF Events is a private Eventbrite-style MVP for Canadian cannabis industry events. It supports event/session management, ticket registration, secure QR check-in, attendee CRM, repeat attendee analytics, SMS reminders, Airtable sync, and operational audit logs.

## Architecture Summary
- Next.js 15 App Router runs the public registration pages, protected dashboard, check-in mode, route handlers, and server actions.
- Supabase provides Auth, PostgreSQL, Storage, RLS, and optional Edge Functions for scheduled SMS and sync workers.
- PostgreSQL owns integrity-sensitive workflows: duplicate check-in prevention, unique ticket codes, idempotent reminders, consent records, and audit logs.
- Twilio SMS is implemented through a server-only REST adapter because `@twilio/rest` is not published on npm. No Twilio secrets are exposed to client code.
- Resend sends consented event confirmation emails with inline QR tickets. Supabase Auth owns account email once custom SMTP is configured. Ticket pages are print-optimized instead of server-generated PDFs.

## Key Assumptions
- Deployment target is Vercel plus Supabase Cloud.
- One seeded FCF organization is enough for the first MVP, but the schema remains multi-organization ready.
- Age-gating defaults to 19 and remains configurable per event.
- Payment processing uses manually created Zeffy-hosted ticketing forms. FCF Events stores the linked Zeffy campaign/form, redirects paid registrations to Zeffy, and issues QR tickets only after Zeffy payment webhook or sync reconciliation.
- SMS reminders are transactional event communications and still record CASL-style proof of consent, source, timestamp, purpose, message body snapshot, and opt-out handling.

## Fixed Stack Gaps
- `@twilio/rest` does not exist in npm; the app uses direct Twilio REST calls via server-side `fetch` and documents the gap.
- Event confirmation email uses Resend. Supabase Auth email requires production SMTP setup in Supabase.
- No PDF library is approved, so downloadable tickets use browser print/save.
- Zeffy is approved as the hosted payment flow. The app does not create Zeffy forms through the API because Zeffy's public API is read-only.

## Security And Compliance Risks
- RLS must be tested with every role before launch.
- Service-role Supabase key must never be exposed to browser bundles.
- Twilio and Airtable tokens must be encrypted before persistence and only decrypted server-side.
- SMS sends must respect consent, opt-out state, event/registration cancellation, quiet hours, and idempotency keys.
- Cannabis copy must avoid youth-targeted, glamour, lifestyle, danger, or inducement framing.

## MVP Acceptance Criteria
- Organizer can create and publish events, sessions, ticket types, discounts, and reminder schedules.
- Guest can register, provide DOB and consent choices, receive a ticket code, and see a QR ticket.
- Staff can scan or enter a ticket code, check in the attendee atomically, and see duplicate/wrong/revoked/cancelled warnings.
- Repeat attendees are tracked by normalized email and phone.
- Twilio settings can be saved securely, test SMS can be sent, reminders can be queued/sent, and send logs are auditable.
- Airtable can be configured and manually synced server-side.
- Dashboard and analytics use real database-backed queries when Supabase is configured and safe demo data otherwise.
