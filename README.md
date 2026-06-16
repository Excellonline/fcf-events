# FCF Events

Private event operations MVP for FCF: event management, sessions, registration, QR tickets, staff check-in, attendee CRM, analytics, SMS reminders, Airtable sync, and audit logs.

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

`@twilio/rest` is not published on npm, so this MVP uses a server-only Twilio REST adapter with `fetch` rather than silently adding the separate `twilio` package.

## Run
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verify
```bash
npm run lint
npm run build
```

## Setup
- Copy `.env.example` to `.env.local`.
- Apply `supabase/schema.sql` to Supabase.
- Read `docs/setup.md` for Supabase, Twilio, Airtable, Vercel, scheduled reminder, and QR scanner setup.
- Read `docs/qa-checklists.md` before launch.

## Important Limitations
- Payments are future-provider/manual only. Stripe is intentionally not included.
- Email sending is adapter-only and marked `TODO_EXTERNAL_PROVIDER_REQUIRED`.
- Ticket PDF export uses browser print/save.
- Twilio credentials and Airtable tokens require `APP_ENCRYPTION_KEY` before production storage.
