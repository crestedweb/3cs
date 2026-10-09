-- Keep a timestamped, append-only case history for admin workflow changes.
alter table public.leads
  add column if not exists case_activity jsonb not null default '[]'::jsonb;

comment on column public.leads.case_activity is
  'Timestamped admin case events; internal operational history, not family messages.';
