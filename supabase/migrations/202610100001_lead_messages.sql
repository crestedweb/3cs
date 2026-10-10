-- Private case-linked messages between administrators and the assigned provider.
alter table public.leads
  add column if not exists assigned_provider_id text;

update public.leads as lead
set assigned_provider_id = provider.id::text
from public.providers as provider
where lead.assigned_provider_id is null
  and lead.provider_name in (provider.business_name, provider.name);

create index if not exists leads_assigned_provider_id_idx
  on public.leads (assigned_provider_id);

create table if not exists public.lead_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id text not null,
  provider_id text not null,
  sender_role text not null check (sender_role in ('admin', 'provider')),
  sender_id text not null,
  sender_name text not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists lead_messages_conversation_idx
  on public.lead_messages (lead_id, provider_id, created_at);

alter table public.lead_messages enable row level security;
revoke all on public.lead_messages from public, anon, authenticated;
grant all on public.lead_messages to service_role;

comment on table public.lead_messages is
  'Private admin and assigned-provider conversation messages for a care case. Accessed only through the authenticated application server.';
