-- =============================================================
-- Phase 0 — Background job queue (Postgres-native, no Redis)
-- =============================================================
create table if not exists public.jobs (
  id           uuid primary key default gen_random_uuid(),
  type         text not null,
  workspace_id uuid references public.workspaces (id) on delete cascade,
  payload      jsonb not null default '{}'::jsonb,
  status       text not null default 'queued'
                 check (status in ('queued','running','done','failed','cancelled')),
  attempts     int  not null default 0,
  max_attempts int  not null default 5,
  run_after    timestamptz not null default now(),
  locked_at    timestamptz,
  locked_by    text,
  started_at   timestamptz,
  finished_at  timestamptz,
  result       jsonb,
  error        text,
  created_at   timestamptz not null default now()
);
create index if not exists jobs_status_run_after_idx
  on public.jobs (status, run_after) where status = 'queued';
create index if not exists jobs_type_status_idx on public.jobs (type, status);
create index if not exists jobs_workspace_id_idx on public.jobs (workspace_id);

alter table public.jobs enable row level security;
-- No policies. Worker reads/writes via service-role only.

-- Atomically claim the next queued job for a worker. Uses SKIP LOCKED so
-- multiple workers can poll concurrently without stepping on each other.
create or replace function public.dequeue_job(worker_id text, lease_seconds int default 300)
returns public.jobs
language plpgsql
as $$
declare
  picked public.jobs;
begin
  with c as (
    select id from public.jobs
    where status = 'queued' and run_after <= now()
    order by run_after asc
    for update skip locked
    limit 1
  )
  update public.jobs j
     set status     = 'running',
         attempts   = j.attempts + 1,
         locked_at  = now(),
         locked_by  = worker_id,
         started_at = coalesce(j.started_at, now())
    from c
   where j.id = c.id
  returning j.* into picked;

  return picked;
end;
$$;

-- Release jobs whose lease has expired (worker died mid-process). Cron-driven.
create or replace function public.requeue_stale_jobs(stale_after_seconds int default 600)
returns int
language plpgsql
as $$
declare
  n int;
begin
  with bumped as (
    update public.jobs
       set status    = case when attempts >= max_attempts then 'failed' else 'queued' end,
           locked_at = null,
           locked_by = null,
           error     = case when attempts >= max_attempts then coalesce(error, 'lease expired') else error end,
           finished_at = case when attempts >= max_attempts then now() else finished_at end
     where status = 'running'
       and locked_at < now() - make_interval(secs => stale_after_seconds)
     returning 1
  )
  select count(*) into n from bumped;
  return n;
end;
$$;
