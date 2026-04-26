import "dotenv/config";
import { adminClient } from "./supabase";
import { handlers } from "./handlers";
import type { JobRow } from "./types";

const WORKER_ID = `${process.env.HOSTNAME ?? "worker"}-${process.pid}`;
const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_MS ?? 2000);
const STALE_LEASE_SECONDS = Number(process.env.WORKER_STALE_LEASE_SECONDS ?? 600);
const STALE_SWEEP_INTERVAL_MS = Number(process.env.WORKER_STALE_SWEEP_MS ?? 60_000);
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
  if (!data) return null;
  return data as JobRow;
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
  while (!stopping) {
    const now = Date.now();
    if (now - lastStaleSweep > STALE_SWEEP_INTERVAL_MS) {
      lastStaleSweep = now;
      void requeueStale().catch((e) => console.error("[worker] stale sweep:", e));
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
