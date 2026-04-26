import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueJob } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JOB = "webhook_retry";

function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  if (req.headers.get("x-cron-secret") === secret) return true;
  return false;
}

export async function GET(req: Request) {
  return run(req);
}
export async function POST(req: Request) {
  return run(req);
}

// Re-enqueues `deliver_webhook` jobs for any pending webhook_deliveries
// whose next_retry_at has passed. The handler itself does the actual
// HTTP send + retry math; this cron is just the fan-out trigger.
async function run(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: jobRow } = await admin
    .from("job_runs")
    .insert({ job_name: JOB, status: "running" })
    .select("id")
    .single();
  const jobRunId = (jobRow?.id as string) ?? null;

  let due = 0;
  let enqueued = 0;
  try {
    const { data: rows, error } = await admin
      .from("webhook_retry_due")
      .select("id, workspace_id");
    if (error) throw new Error(`webhook_retry_due: ${error.message}`);
    due = rows?.length ?? 0;

    for (const r of rows ?? []) {
      // Avoid stacking up: skip if there's already an unfinished job for
      // this delivery (so the worker isn't double-pinned on a slow URL).
      const { data: existing } = await admin
        .from("jobs")
        .select("id")
        .eq("type", "deliver_webhook")
        .in("status", ["queued", "running"])
        .contains("payload", { delivery_id: r.id });
      if (existing && existing.length > 0) continue;

      const enq = await enqueueJob(
        {
          type: "deliver_webhook",
          workspaceId: r.workspace_id as string,
          payload: { delivery_id: r.id },
          maxAttempts: 3,
        },
        admin
      );
      if (enq) enqueued += 1;
    }

    if (jobRunId) {
      await admin
        .from("job_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "ok",
          stats: { due, enqueued },
        })
        .eq("id", jobRunId);
    }
    return NextResponse.json({ ok: true, due, enqueued });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (jobRunId) {
      await admin
        .from("job_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "failed",
          error: msg,
          stats: { due, enqueued },
        })
        .eq("id", jobRunId);
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
