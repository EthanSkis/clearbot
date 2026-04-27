import type { Handler } from "../types";
import type { AdapterContext } from "../adapters/types";
import { findAdapter } from "../adapters";
import { openJson } from "../../lib/crypto";

export const submitFilingHandler: Handler = async (job, admin) => {
  const filingId = job.payload?.filing_id as string | undefined;
  if (!filingId) throw new Error("payload.filing_id required");

  const ctx = await loadContext(admin, filingId);
  const adapter = findAdapter(ctx.agency.code);
  if (!adapter) {
    await markRejected(admin, ctx.filing.id, `no adapter for agency ${ctx.agency.code}`);
    return { skipped: "no_adapter", agency_code: ctx.agency.code };
  }

  const outcome = await adapter.submit(ctx);

  if (outcome.ok) {
    const isAuto = ctx.filing.mode === "auto";
    await admin
      .from("filings")
      .update({
        stage: isAuto ? "done" : "confirm",
        status: "confirmed",
        filed_at: outcome.submitted_at,
        confirmation_number: outcome.confirmation_number,
      })
      .eq("id", ctx.filing.id);

    // Roll the license expiry forward by its renewal cycle. Manual stage-advance
    // already does this on intake → confirm, but the auto path bypasses the
    // dashboard server action, so the same bookkeeping has to happen here.
    if (ctx.license.expires_at && ctx.license.cycle_days) {
      const base = new Date(`${ctx.license.expires_at}T00:00:00Z`);
      const nextExp = new Date(base.getTime() + ctx.license.cycle_days * 86_400_000)
        .toISOString()
        .slice(0, 10);
      await admin
        .from("licenses")
        .update({ expires_at: nextExp, status: "active" })
        .eq("id", ctx.license.id);
    }

    await admin.from("activity_log").insert({
      workspace_id: ctx.filing.workspace_id,
      actor_label: "ClearBot",
      type: "filed",
      title: `${ctx.agency.code} confirmed filing ${ctx.filing.short_id}`,
      detail: `Confirmation ${outcome.confirmation_number}${isAuto ? " · auto" : ""}`,
      metadata: { filing_short_id: ctx.filing.short_id, confirmation_number: outcome.confirmation_number },
    });

    // Webhook fanout — same shape as lib/webhooks.ts but inline so the worker
    // doesn't need to import server-only helpers.
    await fanoutFilingConfirmed(admin, ctx, outcome);

    return { ok: true, confirmation_number: outcome.confirmation_number, finalized: isAuto };
  }

  if (outcome.reason === "transient") {
    throw new Error(`transient: ${outcome.detail ?? "retry"}`);
  }

  // Hard rejection by the agency stays a rejection — it's a real outcome, not
  // something a human can usefully retry without first fixing the data.
  if (outcome.reason === "agency_rejected") {
    await markRejected(admin, ctx.filing.id, `${outcome.reason}: ${outcome.detail ?? ""}`);
    await admin.from("activity_log").insert({
      workspace_id: ctx.filing.workspace_id,
      actor_label: "ClearBot",
      type: "alert",
      title: `${ctx.agency.code} rejected ${ctx.filing.short_id}`,
      detail: outcome.detail ?? "Agency rejected the filing.",
      metadata: { filing_short_id: ctx.filing.short_id, reason: outcome.reason },
    });
    return { ok: false, reason: outcome.reason };
  }

  // Everything else (not_implemented, credentials_invalid, fee_payment_failed,
  // portal_changed) — drop the filing back to `review` so a human can fix the
  // underlying issue (add credentials, retry payment, re-check the form) and
  // re-submit, instead of dead-ending an auto-mode filing on rejection.
  await admin
    .from("filings")
    .update({
      stage: "review",
      notes: `Auto submit paused: ${outcome.reason}${outcome.detail ? ` — ${outcome.detail}` : ""}`,
    })
    .eq("id", ctx.filing.id);
  await admin.from("activity_log").insert({
    workspace_id: ctx.filing.workspace_id,
    actor_label: "ClearBot",
    type: "alert",
    title: `Filing ${ctx.filing.short_id} held for review`,
    detail: `${outcome.reason}${outcome.detail ? `: ${outcome.detail}` : ""}`,
    metadata: { filing_short_id: ctx.filing.short_id, reason: outcome.reason },
  });
  return { ok: false, reason: outcome.reason, held_for_review: true };
};

async function fanoutFilingConfirmed(
  admin: AdapterContext["admin"],
  ctx: AdapterContext,
  outcome: { confirmation_number: string; submitted_at: string }
) {
  try {
    const { data: hooks } = await admin
      .from("webhooks")
      .select("id")
      .eq("workspace_id", ctx.filing.workspace_id)
      .eq("active", true);
    for (const h of hooks ?? []) {
      const { data: delivery } = await admin
        .from("webhook_deliveries")
        .insert({
          workspace_id: ctx.filing.workspace_id,
          webhook_id: h.id,
          event: "filing.confirmed",
          payload: {
            filing_id: ctx.filing.id,
            filing_short_id: ctx.filing.short_id,
            agency_code: ctx.agency.code,
            confirmation_number: outcome.confirmation_number,
            submitted_at: outcome.submitted_at,
            via: "auto_adapter",
          },
        })
        .select("id")
        .single();
      if (delivery) {
        await admin.from("jobs").insert({
          type: "deliver_webhook",
          workspace_id: ctx.filing.workspace_id,
          payload: { delivery_id: delivery.id },
        });
      }
    }
  } catch (e) {
    console.error("[submit] webhook fanout (non-fatal):", e);
  }
}

async function loadContext(
  admin: AdapterContext["admin"],
  filingId: string
): Promise<AdapterContext> {
  const { data: filing, error } = await admin
    .from("filings")
    .select("id, short_id, workspace_id, license_id, location_id, agency_id, fee_cents, stage, mode")
    .eq("id", filingId)
    .single();
  if (error || !filing) throw new Error(`filing: ${error?.message ?? "not found"}`);
  if (!filing.agency_id) throw new Error("filing has no agency_id");

  const [{ data: license }, { data: location }, { data: agency }, { data: packet }] = await Promise.all([
    admin
      .from("licenses")
      .select("id, license_type, license_number, expires_at, cycle_days")
      .eq("id", filing.license_id)
      .single(),
    admin
      .from("locations")
      .select("id, name, address_line1, city, state, zip")
      .eq("id", filing.location_id)
      .single(),
    admin
      .from("agencies")
      .select("id, code, name, portal_url")
      .eq("id", filing.agency_id)
      .single(),
    admin
      .from("documents")
      .select("storage_path, size_bytes")
      .eq("filing_id", filing.id)
      .eq("kind", "application")
      .maybeSingle(),
  ]);

  if (!license || !location || !agency) throw new Error("missing related rows");

  let credentials: AdapterContext["credentials"] = null;
  const { data: credRow } = await admin
    .from("portal_credentials")
    .select("encrypted_dek, encrypted_data, iv, auth_tag, master_key_id")
    .eq("workspace_id", filing.workspace_id)
    .eq("agency_id", filing.agency_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (credRow) {
    try {
      credentials = openJson<AdapterContext["credentials"]>(credRow);
      await admin
        .from("portal_credentials")
        .update({ last_used_at: new Date().toISOString() })
        .eq("workspace_id", filing.workspace_id)
        .eq("agency_id", filing.agency_id);
    } catch (e) {
      console.error("[submit] credential decrypt failed:", e);
    }
  }

  return {
    admin,
    filing: filing as AdapterContext["filing"],
    license: license as AdapterContext["license"],
    location: location as AdapterContext["location"],
    agency: agency as AdapterContext["agency"],
    packet: packet
      ? { storage_path: packet.storage_path as string, bytes: (packet.size_bytes as number) ?? 0 }
      : null,
    credentials,
  };
}

async function markRejected(admin: AdapterContext["admin"], filingId: string, note: string) {
  await admin
    .from("filings")
    .update({ stage: "rejected", status: "rejected", notes: note })
    .eq("id", filingId);
}
