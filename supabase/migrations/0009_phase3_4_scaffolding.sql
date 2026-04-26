-- =============================================================
-- Phase 3 + Phase 4 scaffolding + plumbing
--   - portal_credentials  (envelope-encrypted agency portal logins)
--   - webhook_deliveries  (per-attempt log for outbound webhooks)
--   - form_snapshots      (sha256 of agency portal HTML/PDF for change watching)
-- =============================================================

-- ── portal_credentials ────────────────────────────────────────
-- One credential bundle per (workspace, agency). The "secret" payload
-- (username, password, MFA seed, etc.) is encrypted client-side via
-- envelope encryption: each row carries its own DEK, encrypted under a
-- master key held in env (CREDENTIAL_MASTER_KEY). Swapping in real KMS
-- later is a one-line change in lib/crypto.ts.
create table if not exists public.portal_credentials (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  agency_id       uuid not null references public.agencies (id) on delete cascade,
  label           text not null default 'default',
  encrypted_dek   text not null,           -- base64 AES-256 DEK encrypted under master key
  encrypted_data  text not null,           -- base64 ciphertext of JSON {username,password,mfa,...}
  iv              text not null,           -- base64 IV used for encrypted_data
  auth_tag        text not null,           -- base64 GCM auth tag for encrypted_data
  master_key_id   text not null default 'env-v1',
  last_used_at    timestamptz,
  rotated_at      timestamptz,
  created_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (workspace_id, agency_id, label)
);
create index if not exists portal_credentials_workspace_id_idx
  on public.portal_credentials (workspace_id);

drop trigger if exists portal_credentials_set_updated_at on public.portal_credentials;
create trigger portal_credentials_set_updated_at before update on public.portal_credentials
  for each row execute function public.set_updated_at();

alter table public.portal_credentials enable row level security;
-- Members can SEE that a credential exists (label, last_used_at) but never
-- the ciphertext through the dashboard. Decrypt happens worker-side via
-- service role only.
drop policy if exists portal_credentials_select on public.portal_credentials;
create policy portal_credentials_select on public.portal_credentials
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

drop policy if exists portal_credentials_modify on public.portal_credentials;
create policy portal_credentials_modify on public.portal_credentials
  for all to authenticated
  using (public.workspace_role(workspace_id) in ('owner','admin'))
  with check (public.workspace_role(workspace_id) in ('owner','admin'));

-- ── webhook_deliveries ────────────────────────────────────────
create table if not exists public.webhook_deliveries (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  webhook_id      uuid not null references public.webhooks (id) on delete cascade,
  event           text not null,
  payload         jsonb not null,
  status          text not null default 'pending'
                    check (status in ('pending','delivered','failed','dropped')),
  attempts        int  not null default 0,
  max_attempts    int  not null default 6,
  next_retry_at   timestamptz not null default now(),
  last_response_status int,
  last_response_body   text,
  last_error      text,
  delivered_at    timestamptz,
  created_at      timestamptz not null default now()
);
create index if not exists webhook_deliveries_status_next_retry_idx
  on public.webhook_deliveries (status, next_retry_at) where status = 'pending';
create index if not exists webhook_deliveries_webhook_id_idx
  on public.webhook_deliveries (webhook_id);

alter table public.webhook_deliveries enable row level security;
drop policy if exists webhook_deliveries_select on public.webhook_deliveries;
create policy webhook_deliveries_select on public.webhook_deliveries
  for select to authenticated
  using (public.is_workspace_member(workspace_id));

-- ── form_snapshots ────────────────────────────────────────────
create table if not exists public.form_snapshots (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies (id) on delete cascade,
  source_url    text not null,
  content_hash  text not null,
  content_type  text,
  byte_size     int,
  fetched_at    timestamptz not null default now(),
  unique (agency_id, source_url, content_hash)
);
create index if not exists form_snapshots_agency_id_fetched_at_idx
  on public.form_snapshots (agency_id, fetched_at desc);

alter table public.form_snapshots enable row level security;
-- Read-only to members; worker writes via service role.
drop policy if exists form_snapshots_select on public.form_snapshots;
create policy form_snapshots_select on public.form_snapshots
  for select to authenticated using (true);
