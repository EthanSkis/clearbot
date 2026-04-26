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
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit")) || 100));

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("licenses")
    .select(
      "id, license_type, license_number, status, expires_at, automation_mode, fee_cents, location:location_id(name, city, state), agency:agency_id(code, name)"
    )
    .eq("workspace_id", auth.workspaceId)
    .order("expires_at", { ascending: true, nullsFirst: false })
    .limit(limit);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
