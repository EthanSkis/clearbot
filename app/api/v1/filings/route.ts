import "server-only";
import { NextResponse } from "next/server";
import { authenticateApi, isErr } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await authenticateApi(req);
  if (isErr(auth)) return auth;
  const url = new URL(req.url);
  const stage = url.searchParams.get("stage");
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 50));

  const admin = createAdminClient();
  let q = admin
    .from("filings")
    .select(
      "id, short_id, stage, status, mode, fee_cents, filed_at, confirmation_number, created_at, license:license_id(license_type, license_number), agency:agency_id(code, name), location:location_id(name, city, state)"
    )
    .eq("workspace_id", auth.workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (stage) q = q.eq("stage", stage);
  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
