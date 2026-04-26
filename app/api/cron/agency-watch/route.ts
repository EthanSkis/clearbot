import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueJob } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JOB = "agency_watch";

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
  const jobId = (jobRow?.id as string) ?? null;

  let enqueued = 0;
  let agencies = 0;
  let failed = 0;
  try {
    const { data: rows, error } = await admin
      .from("agencies")
      .select("id, code, portal_url")
      .not("portal_url", "is", null);
    if (error) throw new Error(`agencies: ${error.message}`);
    agencies = rows?.length ?? 0;
    for (const a of rows ?? []) {
      const enq = await enqueueJob(
        { type: "form_hash_check", payload: { agency_id: a.id, agency_code: a.code } },
        admin
      );
      if (enq) enqueued += 1;
      else failed += 1;
    }
    if (jobId) {
      await admin
        .from("job_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: failed > 0 ? "failed" : "ok",
          stats: { agencies, enqueued, failed },
        })
        .eq("id", jobId);
    }
    return NextResponse.json({ ok: true, agencies, enqueued, failed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (jobId) {
      await admin
        .from("job_runs")
        .update({
          finished_at: new Date().toISOString(),
          status: "failed",
          error: msg,
          stats: { agencies, enqueued, failed },
        })
        .eq("id", jobId);
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
