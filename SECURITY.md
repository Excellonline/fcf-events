# Security Policy

FCF Events handles attendee data, role-based access, payment reconciliation state, SMS consent records, and provider credentials. Treat security-sensitive changes with extra care.

## Supported Version

The supported version is the current `main` branch.

## Reporting a Vulnerability

Do not disclose vulnerabilities in public issues or pull requests.

Use GitHub private vulnerability reporting or contact the repository owner directly with:

- A short summary of the issue.
- Steps to reproduce.
- Impacted routes, tables, roles, or providers.
- Any relevant logs or screenshots with secrets removed.
- Suggested remediation, if known.

## Secret Handling

Never commit real values for:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SECRET_KEY`
- `APP_ENCRYPTION_KEY`
- `TWILIO_AUTH_TOKEN`
- `RESEND_API_KEY`
- `ZEFFY_API_KEY`
- `ZEFFY_WEBHOOK_SECRET`
- `ZEFFY_SYNC_SECRET`
- Airtable personal access tokens
- Database URLs or passwords

Use `.env.example` for names and documentation only. Use local `.env.local`, Vercel environment variables, and provider dashboards for real secrets.

## Security Checklist

Before production deployment:

- Confirm Supabase RLS policies for every role.
- Confirm service-role access stays server-side.
- Verify Twilio webhook signatures in production.
- Verify Zeffy webhook and sync secrets.
- Confirm SMS opt-out behavior and consent logs.
- Confirm audit logs capture sensitive operational actions.
- Rotate any provider key pasted into chat, tickets, screenshots, or shared documents.
