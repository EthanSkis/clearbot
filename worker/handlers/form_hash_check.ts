import { createHash } from "crypto";
import type { Handler } from "../types";

const FETCH_TIMEOUT_MS = 20_000;

export const formHashCheckHandler: Handler = async (job, admin) => {
  const agencyId = job.payload?.agency_id as string | undefined;
  if (!agencyId) throw new Error("payload.agency_id required");

  const { data: agency, error: agencyErr } = await admin
    .from("agencies")
    .select("id, code, name, portal_url")
    .eq("id", agencyId)
    .single();
  if (agencyErr || !agency) throw new Error(`agency: ${agencyErr?.message ?? "not found"}`);

  if (!agency.portal_url) {
    return { skipped: "no_portal_url", agency_code: agency.code };
  }

  let body: string;
  let contentType: string | null;
  let bytes: number;
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(agency.portal_url as string, {
      headers: {
        "user-agent": "ClearBot agency-watch/1.0 (+https://clearbot.io)",
        accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.5",
      },
      signal: ac.signal,
      redirect: "follow",
    }).finally(() => clearTimeout(timer));
    if (!res.ok) {
      throw new Error(`fetch ${res.status}`);
    }
    contentType = res.headers.get("content-type");
    const buf = Buffer.from(await res.arrayBuffer());
    bytes = buf.byteLength;
    body = buf.toString("utf8");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`fetch failed: ${msg}`);
  }

  const hash = createHash("sha256").update(body).digest("hex");

  // Latest known hash for this URL.
  const { data: prev } = await admin
    .from("form_snapshots")
    .select("content_hash")
    .eq("agency_id", agencyId)
    .eq("source_url", agency.portal_url as string)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const changed = prev && prev.content_hash !== hash;
  const firstSeen = !prev;

  // Insert (or skip if same hash already there from earlier today).
  const { error: snapErr } = await admin.from("form_snapshots").insert({
    agency_id: agencyId,
    source_url: agency.portal_url,
    content_hash: hash,
    content_type: contentType,
    byte_size: bytes,
  });
  if (snapErr && !snapErr.message.includes("duplicate")) {
    console.error("[form_hash_check] snapshot insert:", snapErr);
  }

  if (changed) {
    await admin.from("agency_changes").insert({
      agency_id: agencyId,
      kind: "portal",
      detail: `Portal HTML changed (${bytes} bytes, sha256 ${hash.slice(0, 12)}…)`,
    });
    await admin
      .from("agencies")
      .update({ last_changed_at: new Date().toISOString() })
      .eq("id", agencyId);

    // Bump in-flight filings for this agency to review so a human re-checks
    // the packet before it hits the (now-changed) portal.
    const { data: bumped } = await admin
      .from("filings")
      .update({ stage: "review" })
      .eq("agency_id", agencyId)
      .eq("status", "in_flight")
      .in("stage", ["intake", "prep", "submit"])
      .select("id, workspace_id, short_id");
    for (const f of bumped ?? []) {
      await admin.from("activity_log").insert({
        workspace_id: f.workspace_id,
        actor_label: "ClearBot",
        type: "agency",
        title: `${agency.code} portal changed — ${f.short_id} bumped to review`,
        detail: "Re-check the packet before approving.",
        metadata: { agency_id: agencyId, filing_short_id: f.short_id },
      });
    }
  }

  return {
    agency_code: agency.code,
    changed,
    first_seen: firstSeen,
    bytes,
    hash: hash.slice(0, 16),
  };
};
