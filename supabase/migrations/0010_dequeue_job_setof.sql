-- PostgREST serializes "returns <composite>" as an all-null object when the
-- composite is NULL, which trips up clients. Switch to setof so empty queues
-- come back as an empty array.
drop function if exists public.dequeue_job(text, int);
create or replace function public.dequeue_job(worker_id text, lease_seconds int default 300)
returns setof public.jobs
language plpgsql
as $$
begin
  return query
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
    returning j.*;
end;
$$;
