import "server-only";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { authenticateApi, isErr, requireScope } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_EVENTS = new Set([
  "filing.opened",
  "filing.packet_ready",
  "filing.approved",
  "filing.submitted",
  "filing.confirmed",
  "filing.rejected",
  "license.state_changed",
]);

export async function GET(req: Request) {
  const auth = await authenticateApi(req);
  if (isErr(auth)) return auth;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("webhooks")
    .select("id, url, event, events, description, active, last_fired_at, last_status, created_at")
    .eq("workspace_id", auth.workspaceId)
    .order("created_at", { ascending: false });
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

  const url = String(body.url ?? "").trim();
  if (!url) return NextResponse.json({ ok: false, error: "url required" }, { status: 400 });
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ ok: false, error: "url must be absolute" }, { status: 400 });
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json({ ok: false, error: "url must be http(s)" }, { status: 400 });
  }

  const requested = Array.isArray(body.events)
    ? (body.events as unknown[]).map((e) => String(e))
    : body.event
      ? [String(body.event)]
      : ["filing.confirmed"];
  const events = requested.filter((e) => VALID_EVENTS.has(e));
  if (events.length === 0) {
    return NextResponse.json(
      { ok: false, error: `no valid events. accepted: ${[...VALID_EVENTS].join(", ")}` },
      { status: 400 }
    );
  }

  const signingSecret = `whsec_${randomBytes(24).toString("base64url")}`;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("webhooks")
    .insert({
      workspace_id: auth.workspaceId,
      url,
      event: events[0],
      events,
      description: body.description ? String(body.description).slice(0, 200) : null,
      signing_secret: signingSecret,
      active: true,
    })
    .select("id, url, event, events, description, active, created_at")
    .single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // Return the signing secret on creation only — it's never exposed in
  // subsequent GETs. Standard pattern for webhook secrets.
  return NextResponse.json(
    { ok: true, data, signing_secret: signingSecret },
    { status: 201 }
  );
}
