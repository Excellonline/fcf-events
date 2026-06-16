# FCF Events Setup Guide

## Local Development
1. Copy `.env.example` to `.env.local`.
2. Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `APP_ENCRYPTION_KEY`.
3. Run `npm install`.
4. Apply `supabase/schema.sql` in Supabase SQL editor or with the Supabase CLI.
5. Run `npm run dev` and open `http://localhost:3000`.

## Supabase
- Enable Email Auth for organizer accounts.
- Configure Supabase Auth custom SMTP before production. Resend can be used as the SMTP provider with the same API key as the SMTP password.
- Apply `supabase/schema.sql`.
- Create Storage buckets:
  - `event-banners`: public or signed-read, image uploads only.
  - `organization-assets`: signed-read for logos and private organizer assets.
  - `speaker-images`: public or signed-read, image uploads only.
- Keep `SUPABASE_SERVICE_ROLE_KEY` only in server-side environments.
- Use RLS tests before production launch.

## Twilio
- Add Account SID, Auth Token, sender number, or Messaging Service SID in Dashboard > Settings.
- Configure inbound webhook to `{NEXT_PUBLIC_APP_URL}/api/twilio/inbound`.
- Configure status callback to `{NEXT_PUBLIC_APP_URL}/api/twilio/status`.
- Verify STOP/START handling in Twilio and in FCF opt-out logs before first campaign.

## Email
- Add `RESEND_API_KEY` and `EMAIL_FROM` to Vercel and local `.env.local`.
- Verify the sender domain/address in Resend before sending production email.
- Event registrations with email consent send a Resend confirmation email with an inline QR ticket image.
- Account signup, invite, password reset, and email-change messages are sent by Supabase Auth once custom SMTP is configured there.

## Zeffy Payments
- Add `ZEFFY_API_KEY`, `ZEFFY_WEBHOOK_SECRET`, and `ZEFFY_SYNC_SECRET` to local and production environments.
- Create one Zeffy ticketing form per paid event in Zeffy. Keep ticket names and prices aligned with the event ticket types in FCF Events.
- Copy the Zeffy campaign ID and public form URL into Dashboard > Events > Event > Zeffy Payment Settings.
- Configure the Zeffy webhook URL to `{NEXT_PUBLIC_APP_URL}/api/zeffy/webhook?token={ZEFFY_WEBHOOK_SECRET}`.
- Ask Zeffy support to redirect successful payments to `{NEXT_PUBLIC_APP_URL}/payment/complete` if the account does not expose redirect settings.
- Use `POST {NEXT_PUBLIC_APP_URL}/api/zeffy/sync?token={ZEFFY_SYNC_SECRET}` as a manual or scheduled fallback to reconcile recent successful payments.
- Rotate any Zeffy API key that has been pasted into chat, tickets, or other shared systems.

## Airtable
- Create a personal access token with access only to the target base.
- Add Base ID and table names in Dashboard > Airtable Sync.
- Map local fields to Airtable fields.
- Use Sync Now for the first run and inspect `airtable_sync_logs`.

## Vercel
- Add every variable from `.env.example`.
- Set `NEXT_PUBLIC_APP_URL` to the production URL.
- Deploy from the main branch.
- Confirm Twilio and Zeffy webhooks point to the production URL after deployment.

## Scheduled SMS Reminders
- Preferred: configure a Supabase scheduled Edge Function that calls the same reminder dispatcher used by `/api/reminders/dispatch`.
- MVP fallback: call `/api/reminders/dispatch` from a trusted cron with an internal secret header added before production.
- The dispatcher must create one `message_sends` row per registration/reminder idempotency key before sending.

## QR Scanner Testing
- Use HTTPS or localhost so camera permissions work.
- Test on phone, tablet, and laptop.
- Verify success, duplicate, wrong event, revoked ticket, cancelled ticket, and unauthorized staff cases.
