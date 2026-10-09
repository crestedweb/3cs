-- Structured provider onboarding fields. Existing provider columns remain the
-- source for legacy profiles; new fields are reviewed before referral use.
alter table public.providers
  add column if not exists profile_data jsonb not null default '{}'::jsonb,
  add column if not exists account_status text not null default 'pending'
    check (account_status in ('pending', 'active', 'suspended')),
  add column if not exists verification_status text not null default 'incomplete'
    check (verification_status in ('incomplete', 'pending_review', 'verified', 'rejected', 'expired')),
  add column if not exists referral_eligibility text not null default 'temporarily_ineligible'
    check (referral_eligibility in ('eligible', 'temporarily_ineligible', 'ineligible'));

update public.providers
set account_status = status
where status in ('pending', 'active', 'suspended');

create index if not exists providers_account_verification_idx
  on public.providers (account_status, verification_status, referral_eligibility);

create unique index if not exists providers_email_lower_unique_idx
  on public.providers (lower(email));

create index if not exists providers_profile_data_gin_idx
  on public.providers using gin (profile_data jsonb_path_ops);

-- Private provider evidence. The API uses the service role and never returns
-- public object URLs. Configure the application server with the service role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'provider-documents',
  'provider-documents',
  false,
  5242880,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
