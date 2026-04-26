import "server-only";
import { NextResponse } from "next/server";
import { authenticateApi, isErr } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Minimal-info health probe scoped to the caller's workspace. Returns the
// last cron run timestamps + queue depth so customers can wire it into
// their own monitoring (Datadog/PagerDuty/etc.).
export async function GET(req: Request) {
  const auth = await authenticateApi(req);
  if (isErr(auth)) return auth;
  const admin = createAdminClient();

  const [{ data: lastSweep }, { data: lastWatch }, { data: queue }] = await Promise.all([
    admin
      .from("job_runs")
      .select("started_at, finished_at, status, stats")
      .eq("job_name", "daily_sweep")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("job_runs")
      .select("started_at, finished_at, status, stats")
      .eq("job_name", "agency_watch")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("jobs")
      .select("status")
      .in("status", ["queued", "running", "failed"])
      .eq("workspace_id", auth.workspaceId),
  ]);

  const queueDepth = { queued: 0, running: 0, failed: 0 };
  for (const r of queue ?? []) {
    const s = r.status as keyof typeof queueDepth;
    if (s in queueDepth) queueDepth[s] += 1;
  }

  return NextResponse.json({
    ok: true,
    now: new Date().toISOString(),
    workspace_id: auth.workspaceId,
    last_runs: {
      daily_sweep: lastSweep ?? null,
      agency_watch: lastWatch ?? null,
    },
    queue: queueDepth,
  });
}
