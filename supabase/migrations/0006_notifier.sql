-- =============================================================
-- Phase 1 — Notifier: job runs + reminder dedupe
-- =============================================================

create table if not exists public.job_runs (
  id           uuid primary key default gen_random_uuid(),
  job_name     text not null,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  status       text not null default 'running' check (status in ('running','ok','failed')),
  stats        jsonb not null default '{}'::jsonb,
  error        text
);
create index if not exists job_runs_job_name_started_at_idx
  on public.job_runs (job_name, started_at desc);

alter table public.job_runs enable row level security;
-- No policies: only the service-role key (cron + health endpoint) reads/writes.

create table if not exists public.notification_sends (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  filing_id     uuid not null references public.filings (id) on delete cascade,
  member_id     uuid not null references public.workspace_members (id) on delete cascade,
  kind          text not null check (kind in ('intake_opened','escalation')),
  channel       text not null default 'email' check (channel in ('email','sms','slack')),
  sent_at       timestamptz not null default now(),
  unique (filing_id, member_id, kind)
);
create index if not exists notification_sends_workspace_id_idx
  on public.notification_sends (workspace_id);
create index if not exists notification_sends_filing_id_idx
  on public.notification_sends (filing_id);

alter table public.notification_sends enable row level security;
drop policy if exists notification_sends_select on public.notification_sends;
create policy notification_sends_select on public.notification_sends
  for select to authenticated
  using (public.is_workspace_member(workspace_id));
-- Inserts happen via service-role only.
