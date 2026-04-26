import "server-only";
import { NextResponse } from "next/server";
import { authenticateApi, isErr, requireScope } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fanoutWebhook } from "@/lib/webhooks";
import { enqueueJob } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGES = ["intake", "prep", "review", "submit", "confirm", "done"] as const;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await authenticateApi(req);
  if (isErr(auth)) return auth;
  const scopeErr = requireScope(auth, "read_write");
  if (scopeErr) return scopeErr;

  const admin = createAdminClient();
  const { data: filing, error } = await admin
    .from("filings")
    .select("id, short_id, stage, workspace_id, license_id")
    .eq("id", params.id)
    .eq("workspace_id", auth.workspaceId)
    .maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!filing) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  const idx = STAGES.indexOf(filing.stage as (typeof STAGES)[number]);
  if (idx < 0 || idx >= STAGES.length - 1) {
    return NextResponse.json({ ok: false, error: "filing already complete" }, { status: 400 });
  }
  const next = STAGES[idx + 1];

  const patch: Record<string, unknown> = { stage: next };
  if (next === "confirm") {
    patch.filed_at = new Date().toISOString();
    patch.status = "confirmed";
    patch.confirmation_number = `CB-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  }
  const { error: upErr } = await admin.from("filings").update(patch).eq("id", filing.id);
  if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });

  if (next === "submit") {
    await enqueueJob(
      {
        type: "submit_filing",
        workspaceId: auth.workspaceId,
        payload: { filing_id: filing.id },
        maxAttempts: 3,
      },
      admin
    );
  }
  await fanoutWebhook({
    workspaceId: auth.workspaceId,
    event:
      next === "review"
        ? "filing.approved"
        : next === "submit"
          ? "filing.submitted"
          : next === "confirm"
            ? "filing.confirmed"
            : "filing.opened",
    payload: {
      filing_id: filing.id,
      filing_short_id: filing.short_id,
      previous_stage: filing.stage,
      new_stage: next,
      via: "api_v1",
      api_key_id: auth.apiKeyId,
    },
    client: admin,
  });
  return NextResponse.json({ ok: true, stage: next });
}
