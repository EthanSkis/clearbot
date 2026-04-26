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
    await admin
      .from("filings")
      .update({
        stage: "confirm",
        status: "confirmed",
        filed_at: outcome.submitted_at,
        confirmation_number: outcome.confirmation_number,
      })
      .eq("id", ctx.filing.id);
    await admin.from("activity_log").insert({
      workspace_id: ctx.filing.workspace_id,
      actor_label: "ClearBot",
      type: "filed",
      title: `${ctx.agency.code} confirmed filing ${ctx.filing.short_id}`,
      detail: `Confirmation ${outcome.confirmation_number}`,
      metadata: { filing_short_id: ctx.filing.short_id, confirmation_number: outcome.confirmation_number },
    });
    return { ok: true, confirmation_number: outcome.confirmation_number };
  }

  if (outcome.reason === "transient") {
    throw new Error(`transient: ${outcome.detail ?? "retry"}`);
  }

  await markRejected(admin, ctx.filing.id, `${outcome.reason}: ${outcome.detail ?? ""}`);
  return { ok: false, reason: outcome.reason };
};

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
