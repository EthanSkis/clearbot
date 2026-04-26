import "server-only";
import { NextResponse } from "next/server";
import { authenticateApi, isErr } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SELECT =
  "id, short_id, stage, status, mode, fee_cents, filed_at, confirmation_number, notes, created_at, updated_at," +
  " license:license_id(id, license_type, license_number, expires_at, cycle_days, fee_cents)," +
  " location:location_id(id, name, city, state, zip)," +
  " agency:agency_id(id, code, name, portal_url)";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = await authenticateApi(req);
  if (isErr(auth)) return auth;
  const admin = createAdminClient();

  // Allow lookup by either UUID or short_id (CB-12345). Customers tend
  // to plumb short_id through their own systems.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    params.id
  );

  let query = admin.from("filings").select(SELECT).eq("workspace_id", auth.workspaceId).limit(1);
  query = isUuid ? query.eq("id", params.id) : query.eq("short_id", params.id);
  const { data, error } = await query.maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  const filing = data as unknown as { id: string } & Record<string, unknown>;

  // Documents attached to the filing.
  const { data: documents } = await admin
    .from("documents")
    .select("id, kind, name, mime_type, size_bytes, storage_path, created_at")
    .eq("workspace_id", auth.workspaceId)
    .eq("filing_id", filing.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ ok: true, data: { ...filing, documents: documents ?? [] } });
}
