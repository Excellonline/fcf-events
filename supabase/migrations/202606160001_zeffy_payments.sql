alter table public.events
  add column if not exists zeffy_campaign_id text,
  add column if not exists zeffy_form_url text;

alter table public.registrations
  add column if not exists external_payment_provider text,
  add column if not exists external_payment_id text,
  add column if not exists external_payment_payload jsonb not null default '{}'::jsonb,
  add column if not exists external_payment_completed_at timestamptz;

create index if not exists events_zeffy_campaign_idx
  on public.events (zeffy_campaign_id)
  where zeffy_campaign_id is not null;

create index if not exists registrations_external_payment_idx
  on public.registrations (external_payment_provider, external_payment_id)
  where external_payment_id is not null;
