import "dotenv/config";
import { adminClient } from "./supabase";
import { handlers } from "./handlers";
import type { JobRow } from "./types";

const WORKER_ID = `${process.env.HOSTNAME ?? "worker"}-${process.pid}`;
const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_MS ?? 2000);
const STALE_LEASE_SECONDS = Number(process.env.WORKER_STALE_LEASE_SECONDS ?? 600);
const STALE_SWEEP_INTERVAL_MS = Number(process.env.WORKER_STALE_SWEEP_MS ?? 60_000);
const WEBHOOK_RETRY_INTERVAL_MS = Number(process.env.WORKER_WEBHOOK_RETRY_MS ?? 60_000);
const JANITOR_INTERVAL_MS = Number(process.env.WORKER_JANITOR_MS ?? 12 * 3_600_000);
const RETRY_BASE_MS = Number(process.env.WORKER_RETRY_BASE_MS ?? 60_000);

let stopping = false;
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

function shutdown(signal: string) {
  if (stopping) return;
  stopping = true;
  console.log(`[worker] ${signal} — finishing in-flight job then exiting…`);
}

async function dequeue(): Promise<JobRow | null> {
  const supabase = adminClient();
  const { data, error } = await supabase.rpc("dequeue_job", { worker_id: WORKER_ID });
  if (error) {
    console.error("[worker] dequeue error:", error);
    return null;
  }
  // dequeue_job returns "setof public.jobs" — an array. Empty queue → [].
  // Tolerate the legacy single-row shape too in case migration is mid-flight.
  const row: JobRow | null = Array.isArray(data) ? (data[0] ?? null) : (data as JobRow | null);
  if (!row || !row.id) return null;
  return row;
}

async function markDone(jobId: string, result: Record<string, unknown> | null) {
  const supabase = adminClient();
  const { error } = await supabase
    .from("jobs")
    .update({
      status: "done",
      finished_at: new Date().toISOString(),
      result: result ?? {},
      error: null,
    })
    .eq("id", jobId);
  if (error) console.error("[worker] markDone error:", error);
}

async function markFailed(job: JobRow, message: string) {
  const supabase = adminClient();
  const exhausted = job.attempts >= job.max_attempts;
  const retryDelay = RETRY_BASE_MS * Math.pow(2, Math.max(0, job.attempts - 1));
  const { error } = await supabase
    .from("jobs")
    .update({
      status: exhausted ? "failed" : "queued",
      finished_at: exhausted ? new Date().toISOString() : null,
      locked_at: null,
      locked_by: null,
      run_after: exhausted
        ? new Date().toISOString()
        : new Date(Date.now() + retryDelay).toISOString(),
      error: message,
    })
    .eq("id", job.id);
  if (error) console.error("[worker] markFailed error:", error);
}

async function requeueStale() {
  const supabase = adminClient();
  const { data, error } = await supabase.rpc("requeue_stale_jobs", {
    stale_after_seconds: STALE_LEASE_SECONDS,
  });
  if (error) {
    console.error("[worker] stale sweep error:", error);
    return;
  }
  const n = (data as number) ?? 0;
  if (n > 0) console.log(`[worker] requeued ${n} stale job(s)`);
}

// Re-enqueues `deliver_webhook` jobs for any pending webhook_deliveries
// whose next_retry_at has passed. The handler does the actual HTTP send;
// this sweep is just the fan-out trigger. Vercel Hobby crons are capped
// at 2/day, so we run the sweep here in the long-lived worker instead.
async function webhookRetrySweep() {
  const supabase = adminClient();
  const { data: rows, error } = await supabase
    .from("webhook_retry_due")
    .select("id, workspace_id");
  if (error) {
    console.error("[worker] webhook retry sweep error:", error);
    return;
  }
  if (!rows || rows.length === 0) return;
  let enqueued = 0;
  for (const r of rows) {
    const { data: existing } = await supabase
      .from("jobs")
      .select("id")
      .eq("type", "deliver_webhook")
      .in("status", ["queued", "running"])
      .contains("payload", { delivery_id: r.id });
    if (existing && existing.length > 0) continue;
    const { error: insErr } = await supabase.from("jobs").insert({
      type: "deliver_webhook",
      workspace_id: r.workspace_id,
      payload: { delivery_id: r.id },
      max_attempts: 3,
    });
    if (!insErr) enqueued += 1;
  }
  if (enqueued > 0) console.log(`[worker] webhook retry: enqueued ${enqueued} delivery job(s)`);
}

// Once-a-day-ish maintenance: trim the jobs table and form_snapshots so the
// DB doesn't grow unbounded. Both RPCs ship in migration 0011.
async function janitorSweep() {
  const supabase = adminClient();
  const [jobsRes, snapsRes] = await Promise.all([
    supabase.rpc("janitor_purge_jobs", { retain_days: 14 }),
    supabase.rpc("janitor_purge_form_snapshots", { retain_per_url: 30 }),
  ]);
  if (jobsRes.error) console.error("[worker] janitor jobs purge:", jobsRes.error);
  if (snapsRes.error) console.error("[worker] janitor snapshots purge:", snapsRes.error);
  const jobsN = (jobsRes.data as number) ?? 0;
  const snapsN = (snapsRes.data as number) ?? 0;
  if (jobsN > 0 || snapsN > 0) {
    console.log(`[worker] janitor: purged ${jobsN} jobs, ${snapsN} snapshots`);
  }
}

async function processOne(job: JobRow) {
  const handler = handlers[job.type];
  const started = Date.now();
  if (!handler) {
    await markFailed(job, `no handler for type "${job.type}"`);
    console.error(`[worker] no handler for ${job.type} (job ${job.id})`);
    return;
  }
  try {
    console.log(`[worker] ${job.type} ${job.id} attempt ${job.attempts}`);
    const result = await handler(job, adminClient());
    const ms = Date.now() - started;
    await markDone(job.id, { ...(result ?? {}), elapsed_ms: ms });
    console.log(`[worker] ${job.type} ${job.id} done in ${ms}ms`);
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error(`[worker] ${job.type} ${job.id} failed:`, msg);
    await markFailed(job, msg);
  }
}

async function main() {
  console.log(`[worker] starting ${WORKER_ID} (poll ${POLL_INTERVAL_MS}ms)`);
  let lastStaleSweep = 0;
  let lastWebhookSweep = 0;
  let lastJanitor = 0;
  while (!stopping) {
    const now = Date.now();
    if (now - lastStaleSweep > STALE_SWEEP_INTERVAL_MS) {
      lastStaleSweep = now;
      void requeueStale().catch((e) => console.error("[worker] stale sweep:", e));
    }
    if (now - lastWebhookSweep > WEBHOOK_RETRY_INTERVAL_MS) {
      lastWebhookSweep = now;
      void webhookRetrySweep().catch((e) => console.error("[worker] webhook retry:", e));
    }
    if (now - lastJanitor > JANITOR_INTERVAL_MS) {
      lastJanitor = now;
      void janitorSweep().catch((e) => console.error("[worker] janitor:", e));
    }
    const job = await dequeue();
    if (!job) {
      await sleep(POLL_INTERVAL_MS);
      continue;
    }
    await processOne(job);
  }
  console.log("[worker] exited cleanly");
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

main().catch((e) => {
  console.error("[worker] fatal:", e);
  process.exit(1);
});
