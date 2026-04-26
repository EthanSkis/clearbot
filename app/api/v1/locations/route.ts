import "server-only";
import { NextResponse } from "next/server";
import { authenticateApi, isErr, requireScope } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await authenticateApi(req);
  if (isErr(auth)) return auth;
  const url = new URL(req.url);
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit")) || 100));
  const status = url.searchParams.get("status");

  const admin = createAdminClient();
  let q = admin
    .from("locations")
    .select("id, name, address_line1, city, state, zip, status, opened_year, tag, created_at")
    .eq("workspace_id", auth.workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const auth = await authenticateApi(req);
  if (isErr(auth)) return auth;
  const scopeErr = requireScope(auth, "read_write");
  if (scopeErr) return scopeErr;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ ok: false, error: "name required" }, { status: 400 });
  const state = body.state ? String(body.state).toUpperCase().slice(0, 2) : null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("locations")
    .insert({
      workspace_id: auth.workspaceId,
      name,
      address_line1: body.address_line1 ? String(body.address_line1) : null,
      city: body.city ? String(body.city) : null,
      state,
      zip: body.zip ? String(body.zip) : null,
      tag: body.tag ? String(body.tag) : "Flagship",
      opened_year: body.opened_year ? Number(body.opened_year) : null,
    })
    .select("id, name, city, state")
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, data }, { status: 201 });
}
