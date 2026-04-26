import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRACKED_JOBS = ["daily_sweep"] as const;

export async function GET() {
  try {
    const admin = createAdminClient();
    const jobs: Record<string, unknown> = {};
    for (const name of TRACKED_JOBS) {
      const { data } = await admin
        .from("job_runs")
        .select("started_at, finished_at, status, stats, error")
        .eq("job_name", name)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      jobs[name] = data ?? null;
    }
    const { data: queue } = await admin
      .from("jobs")
      .select("status", { count: "exact", head: false })
      .in("status", ["queued", "running", "failed"]);
    const queueDepth = { queued: 0, running: 0, failed: 0 };
    for (const r of queue ?? []) {
      const s = r.status as keyof typeof queueDepth;
      if (s in queueDepth) queueDepth[s] += 1;
    }
    return NextResponse.json({
      ok: true,
      now: new Date().toISOString(),
      jobs,
      queue: queueDepth,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
