# Contributing

Thanks for helping improve FCF Events. This project supports event operations, attendee data, payment reconciliation, and communication workflows, so changes should be small, reviewable, and careful with security-sensitive code.

## Workflow

1. Create a short-lived branch from `main`.
2. Keep changes scoped to one feature, fix, or documentation update.
3. Update docs when setup, environment variables, provider behavior, or operational workflows change.
4. Open a pull request with a clear summary, screenshots for UI changes, and the checks you ran.

## Commit Style

Use concise, imperative commit messages:

```text
Improve attendee check-in search
Document Zeffy webhook setup
Fix reminder dispatch idempotency
```

## Local Checks

Run the relevant checks before requesting review:

```bash
npm run lint
npm run build
npm run mobile:checkin:typecheck
```

If a check cannot be run locally, note why in the pull request.

## Code Standards

- Prefer existing patterns in `src/components`, `src/lib/actions`, and `src/lib/data`.
- Keep provider secrets server-side. Never expose service-role keys, Twilio auth tokens, Airtable tokens, Zeffy keys, or `APP_ENCRYPTION_KEY` to browser bundles.
- Validate user input with the existing Zod schemas and server-side guards.
- Keep audit-sensitive workflows idempotent where possible.
- Avoid adding broad abstractions unless they remove clear duplication or match the surrounding code.

## Documentation Standards

Update the README or `docs/` when a change affects:

- Local setup
- Environment variables
- Database schema or migrations
- Provider setup
- Deployment steps
- QA or launch checklists
- Staff check-in workflows

## Security

Do not open public issues for vulnerabilities, leaked secrets, or exploitable behavior. Follow [SECURITY.md](SECURITY.md).
