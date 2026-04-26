import "server-only";
import { NextResponse } from "next/server";
import { authenticateApi, isErr } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Workspace-scoped job inspector. Useful for ops dashboards built on
// top of ClearBot — see what's queued, running, failed without giving
// up the service-role key.
export async function GET(req: Request) {
  const auth = await authenticateApi(req);
  if (isErr(auth)) return auth;
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 50));

  const admin = createAdminClient();
  let q = admin
    .from("jobs")
    .select("id, type, status, attempts, max_attempts, run_after, started_at, finished_at, error, result, created_at")
    .eq("workspace_id", auth.workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status) q = q.eq("status", status);
  if (type) q = q.eq("type", type);
  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
