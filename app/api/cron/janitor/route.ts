import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JOB = "janitor";

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

// Cleanup pass for the queue + form-snapshot table. Runs nightly.
//   - jobs older than 14 days that are done/cancelled/failed → deleted
//   - form_snapshots beyond the latest 30 per (agency, source_url) → deleted
//   - notification_sends older than 180 days → deleted
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

  const stats: Record<string, unknown> = {};
  try {
    const { data: jobs } = await admin.rpc("janitor_purge_jobs", { retain_days: 14 });
    stats.jobs_purged = jobs ?? 0;

    const { data: snaps } = await admin.rpc("janitor_purge_form_snapshots", { retain_per_url: 30 });
    stats.snapshots_purged = snaps ?? 0;

    const cutoff = new Date(Date.now() - 180 * 86_400_000).toISOString();
    const { error: nsErr, count: nsDeleted } = await admin
      .from("notification_sends")
      .delete({ count: "exact" })
      .lt("sent_at", cutoff);
    if (nsErr) throw new Error(`notification_sends: ${nsErr.message}`);
    stats.notification_sends_purged = nsDeleted ?? 0;

    if (jobRunId) {
      await admin
        .from("job_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "ok",
          stats,
        })
        .eq("id", jobRunId);
    }
    return NextResponse.json({ ok: true, stats });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (jobRunId) {
      await admin
        .from("job_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "failed",
          error: msg,
          stats,
        })
        .eq("id", jobRunId);
    }
    return NextResponse.json({ ok: false, error: msg, stats }, { status: 500 });
  }
}
