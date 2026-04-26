import "server-only";
import { NextResponse } from "next/server";
import { authenticateApi, isErr } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public catalog. Anyone with a valid API key can read the agency list
// (it's the same catalog we ship in the dashboard). No workspace scoping
// since this is reference data.
export async function GET(req: Request) {
  const auth = await authenticateApi(req);
  if (isErr(auth)) return auth;
  const url = new URL(req.url);
  const state = url.searchParams.get("state");
  const level = url.searchParams.get("jurisdiction_level");
  const limit = Math.min(1000, Math.max(1, Number(url.searchParams.get("limit")) || 200));

  const admin = createAdminClient();
  let q = admin
    .from("agencies")
    .select("id, code, name, jurisdiction_level, state, portal_url, status, last_changed_at")
    .order("code", { ascending: true })
    .limit(limit);
  if (state) q = q.eq("state", state.toUpperCase().slice(0, 2));
  if (level) q = q.eq("jurisdiction_level", level);
  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}
