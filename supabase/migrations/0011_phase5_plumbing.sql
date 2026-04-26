-- =============================================================
-- Phase 5 — Operational plumbing (retry crons, agency request
-- inbox, license cycle history, audit access, and a couple of
-- helpers the public API + dashboard rely on).
-- =============================================================

-- ── webhook_deliveries: speed up the retry sweep ───────────────
-- Drop the old partial index (was scoped to status='pending'
-- without next_retry_at ordering) and replace with a richer one.
drop index if exists public.webhook_deliveries_status_next_retry_idx;
create index if not exists webhook_deliveries_pending_due_idx
  on public.webhook_deliveries (next_retry_at)
  where status = 'pending';
create index if not exists webhook_deliveries_workspace_event_idx
  on public.webhook_deliveries (workspace_id, event, created_at desc);

-- ── agency_requests: customers asking us to add a new portal ───
create table if not exists public.agency_requests (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  requested_by  uuid references auth.users (id) on delete set null,
  agency_name   text not null,
  jurisdiction  text not null,
  notes         text,
  status        text not null default 'open' check (status in ('open','in_progress','done','declined')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists agency_requests_workspace_id_idx
  on public.agency_requests (workspace_id);
create index if not exists agency_requests_status_idx
  on public.agency_requests (status);

drop trigger if exists agency_requests_set_updated_at on public.agency_requests;
create trigger agency_requests_set_updated_at before update on public.agency_requests
  for each row execute function public.set_updated_at();

alter table public.agency_requests enable row level security;
drop policy if exists agency_requests_select on public.agency_requests;
create policy agency_requests_select on public.agency_requests
  for select to authenticated using (public.is_workspace_member(workspace_id));
drop policy if exists agency_requests_insert on public.agency_requests;
create policy agency_requests_insert on public.agency_requests
  for insert to authenticated with check (public.is_workspace_member(workspace_id));

-- ── license_renewal_history: snapshot of every cycle close ─────
-- Lets the dashboard show a real "renewal timeline" per license,
-- and gives the auditor an immutable record beyond the activity log.
create table if not exists public.license_renewal_history (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  license_id      uuid not null references public.licenses (id) on delete cascade,
  filing_id       uuid references public.filings (id) on delete set null,
  prior_expires_at  date,
  new_expires_at    date,
  fee_cents       int  not null default 0,
  confirmation_number text,
  filed_at        timestamptz not null default now()
);
create index if not exists license_renewal_history_license_id_idx
  on public.license_renewal_history (license_id, filed_at desc);
create index if not exists license_renewal_history_workspace_id_idx
  on public.license_renewal_history (workspace_id);

alter table public.license_renewal_history enable row level security;
drop policy if exists license_renewal_history_select on public.license_renewal_history;
create policy license_renewal_history_select on public.license_renewal_history
  for select to authenticated using (public.is_workspace_member(workspace_id));
-- Inserts are service-role only.

-- ── jobs: convenience indexes for the queue viewer ─────────────
create index if not exists jobs_created_at_idx
  on public.jobs (created_at desc);

-- ── webhooks: track creator + last-event metadata ──────────────
alter table public.webhooks
  add column if not exists created_by uuid references auth.users (id) on delete set null;
alter table public.webhooks
  add column if not exists description text;
alter table public.webhooks
  add column if not exists events text[] not null default array['filing.confirmed']::text[];
-- Backfill events[] from the legacy single `event` column.
update public.webhooks
   set events = array[event]
 where (events is null or array_length(events, 1) is null)
   and event is not null;

-- ── api_keys: name uniqueness per workspace ────────────────────
create unique index if not exists api_keys_workspace_name_idx
  on public.api_keys (workspace_id, name) where revoked_at is null;

-- ── janitor RPC: deletes done/cancelled jobs older than N days ─
create or replace function public.janitor_purge_jobs(retain_days int default 14)
returns int
language plpgsql
as $$
declare
  n int;
begin
  with bumped as (
    delete from public.jobs
     where status in ('done','cancelled','failed')
       and finished_at is not null
       and finished_at < now() - make_interval(days => retain_days)
     returning 1
  )
  select count(*) into n from bumped;
  return n;
end;
$$;

create or replace function public.janitor_purge_form_snapshots(retain_per_url int default 30)
returns int
language plpgsql
as $$
declare
  n int;
begin
  with ranked as (
    select id, row_number() over (
      partition by agency_id, source_url
      order by fetched_at desc
    ) as rn
    from public.form_snapshots
  ),
  doomed as (
    delete from public.form_snapshots fs
     using ranked r
     where fs.id = r.id and r.rn > retain_per_url
     returning 1
  )
  select count(*) into n from doomed;
  return n;
end;
$$;

-- ── webhook_retry_due: a worker-friendly view of pending deliveries
-- whose next_retry_at <= now. Cron uses this to enqueue redelivery jobs.
create or replace view public.webhook_retry_due as
  select id, workspace_id, webhook_id, attempts, max_attempts, next_retry_at
    from public.webhook_deliveries
   where status = 'pending'
     and next_retry_at <= now();
