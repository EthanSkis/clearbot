import "server-only";
import { NextResponse } from "next/server";
import { authenticateApi, isErr, requireScope } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = await authenticateApi(req);
  if (isErr(auth)) return auth;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("webhooks")
    .select("id, url, event, events, description, active, last_fired_at, last_status, created_at")
    .eq("id", params.id)
    .eq("workspace_id", auth.workspaceId)
    .maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  const { data: deliveries } = await admin
    .from("webhook_deliveries")
    .select("id, event, status, attempts, last_response_status, last_error, delivered_at, created_at")
    .eq("workspace_id", auth.workspaceId)
    .eq("webhook_id", params.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ ok: true, data: { ...data, recent_deliveries: deliveries ?? [] } });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await authenticateApi(req);
  if (isErr(auth)) return auth;
  const scopeErr = requireScope(auth, "read_write");
  if (scopeErr) return scopeErr;
  const admin = createAdminClient();
  const { error } = await admin
    .from("webhooks")
    .delete()
    .eq("id", params.id)
    .eq("workspace_id", auth.workspaceId);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
