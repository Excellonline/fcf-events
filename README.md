# FCF Events

Private event operations MVP for FCF: event management, sessions, registration, Zeffy payment handoff, QR tickets, staff check-in, attendee CRM, analytics, SMS reminders, Airtable sync, and audit logs.

## Stack
- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn-style Radix UI primitives
- Supabase Auth, PostgreSQL, Storage, Edge Function-ready schema
- React Hook Form + Zod
- Recharts
- lucide-react
- react-qr-code
- html5-qrcode
- date-fns
- sonner
- next-themes
- qrcode

`@twilio/rest` is not published on npm, so this MVP uses a server-only Twilio REST adapter with `fetch` rather than silently adding the separate `twilio` package.

## Run
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Android Check-in App
The admin-only check-in companion app lives in `apps/admin-checkin`. It uses Expo and reuses the web app check-in APIs.

```bash
npm run mobile:checkin:android
```

Copy `apps/admin-checkin/.env.example` to `apps/admin-checkin/.env` before running it.

## Verify
```bash
npm run lint
npm run build
npm run mobile:checkin:typecheck
```

## Setup
- Copy `.env.example` to `.env.local`.
- Apply `supabase/schema.sql` to Supabase.
- Read `docs/setup.md` for Supabase, Twilio, Airtable, Vercel, scheduled reminder, and QR scanner setup.
- Read `docs/qa-checklists.md` before launch.

## Important Limitations
- Paid registrations use Zeffy-hosted forms plus webhook/sync reconciliation. Zeffy forms are created manually in Zeffy, then linked to events in the dashboard.
- Stripe is intentionally not included directly.
- Event confirmation email uses Resend when `RESEND_API_KEY` and `EMAIL_FROM` are configured.
- Supabase Auth email still needs Supabase SMTP configuration for production account emails.
- Ticket PDF export uses browser print/save.
- Twilio credentials and Airtable tokens require `APP_ENCRYPTION_KEY` before production storage.
