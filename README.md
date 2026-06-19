# FCF Events

[![CI](https://github.com/Excellonline/fcf-events/actions/workflows/ci.yml/badge.svg)](https://github.com/Excellonline/fcf-events/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?logo=supabase&logoColor=white)

FCF Events is a private event operations platform for Canadian cannabis industry events. It covers the operational work around registration, ticketing, check-in, communications, attendee intelligence, and compliance-aware audit trails.

The app is built as a Next.js dashboard with Supabase-backed data, Zeffy payment reconciliation, Twilio SMS, Resend email confirmations, Airtable sync, and an Android-focused Expo companion app for staff check-in.

## Highlights

- Public event pages with registration, attendee profiles, consent capture, and QR ticket delivery.
- Organizer dashboard for events, sessions, ticket types, discounts, attendees, analytics, communications, settings, and audit logs.
- Paid registration handoff to Zeffy with webhook and manual sync reconciliation before issuing active tickets.
- Camera-first staff check-in with QR scanning, manual code entry, attendee search, walk-up registration, duplicate detection, and role-scoped access.
- Consent-aware SMS reminders with Twilio configuration, send logs, opt-out handling, and idempotent reminder records.
- Airtable field mapping and server-side sync logging.
- Supabase schema with multi-organization structure, role-based access, RLS-ready tables, storage buckets, and audit-sensitive workflows.

## Tech Stack

| Area | Tools |
| --- | --- |
| Web app | Next.js 15 App Router, React 19, TypeScript, Tailwind CSS |
| UI | Radix primitives, shadcn-style components, lucide-react, Recharts, Sonner |
| Data | Supabase Auth, PostgreSQL, Storage, server actions, route handlers |
| Validation | React Hook Form, Zod |
| Tickets | `react-qr-code`, `qrcode`, browser print/save ticket pages |
| Check-in | `html5-qrcode` for web scanning, Expo for Android staff workflows |
| Messaging | Twilio REST via server-only `fetch`, Resend transactional email |
| Integrations | Zeffy payment sync, Airtable sync, Vercel deployment |

`@twilio/rest` is not published on npm, so this project intentionally uses a small server-only Twilio REST adapter instead of adding a different package silently.

## Repository Layout

```text
apps/admin-checkin/       Expo Android companion app for staff check-in
docs/                     Setup, architecture, and QA launch notes
public/brand/             FCF brand assets used by the web app
public/downloads/         Published Android check-in APK
src/app/                  Next.js App Router pages and route handlers
src/components/           Shared UI and workflow components
src/lib/                  Server actions, integrations, auth, validation, data access
supabase/                 Schema and migrations
```

## Getting Started

Requirements:

- Node.js 22 LTS or newer
- npm
- Supabase project for persistent data
- Optional provider accounts for Twilio, Resend, Zeffy, Airtable, and Vercel

Install and run the web app:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For local demo review, the app can render safe demo data when Supabase is not fully configured. Production use requires the environment variables and database setup described in [docs/setup.md](docs/setup.md).

## Configuration

1. Copy `.env.example` to `.env.local`.
2. Fill in the Supabase public URL, anon key, service role key, and `APP_ENCRYPTION_KEY`.
3. Apply `supabase/schema.sql` to the Supabase project.
4. Create the Supabase storage buckets listed in [docs/setup.md](docs/setup.md).
5. Add provider credentials for the features you plan to use:
   - Twilio for SMS and webhook signature verification.
   - Resend for registration confirmation email.
   - Zeffy for paid ticket reconciliation.
   - Airtable for external CRM or reporting sync.
6. Set `NEXT_PUBLIC_APP_URL` to the deployed app URL before production.

Generate a local encryption key with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Create a production web build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint over the web app and config files |
| `npm run mobile:checkin:android` | Run the Android check-in app through Expo |
| `npm run mobile:checkin:typecheck` | Type-check the Expo check-in app |

## Android Check-in App

The staff companion app lives in [apps/admin-checkin](apps/admin-checkin). It reuses the web app check-in APIs for context loading, QR/manual ticket check-in, attendee lookup, list refresh, and walk-up registration.

```bash
cd apps/admin-checkin
npm install
cp .env.example .env
npm run android
```

From the repo root, use:

```bash
npm run mobile:checkin:android
```

See [apps/admin-checkin/README.md](apps/admin-checkin/README.md) for Android emulator, physical device, and production URL setup.

## Quality Checks

Run these before opening a pull request or deploying:

```bash
npm run lint
npm run build
npm run mobile:checkin:typecheck
```

GitHub Actions also runs the web lint/build checks and the check-in app typecheck on pushes and pull requests.

## Documentation

- [Setup Guide](docs/setup.md): Supabase, Twilio, Resend, Zeffy, Airtable, Vercel, scheduled jobs, and QR scanner setup.
- [Architecture Review](docs/architecture-review.md): architecture assumptions, security risks, stack choices, and MVP acceptance criteria.
- [QA Checklists](docs/qa-checklists.md): launch checks for registration, payments, check-in, security, SMS, email, analytics, and mobile app flows.
- [Contributing](CONTRIBUTING.md): branch, commit, validation, and review expectations.
- [Security](SECURITY.md): secret handling and vulnerability reporting guidance.

## Production Notes

- Paid registrations use manually created Zeffy-hosted forms. FCF Events stores linked Zeffy campaign/form metadata, redirects paid registrations to Zeffy, and issues QR tickets only after webhook or sync confirmation.
- Supabase Auth production email should be configured with custom SMTP.
- Ticket export uses browser print/save rather than a server-side PDF service.
- Provider credentials and Airtable tokens require `APP_ENCRYPTION_KEY` before production storage.
- Cannabis-related event copy should remain adult, factual, and compliance-aware.

## License

No open-source license has been granted. Treat this codebase as proprietary unless the repository owner adds a license.
