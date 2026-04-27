import type { Handler } from "../types";
import { generatePacket } from "../../lib/packet-generator";
import { findAdapter } from "../adapters";

export const generatePacketHandler: Handler = async (job, admin) => {
  const filingId = job.payload?.filing_id as string | undefined;
  if (!filingId) throw new Error("payload.filing_id required");

  const result = await generatePacket(filingId, admin);
  if (!result.ok) throw new Error(result.error);

  // Auto-filing handoff: if the filing is in `auto` mode and is still on the
  // happy path (stage=prep, just advanced by the packet generator), skip the
  // human review step and chain straight to submit. `prep`-mode filings stay
  // at prep waiting for a human to approve. Filings already bumped to `review`
  // by form_hash_check stay there — a human re-checks before we submit.
  let autoSubmitted = false;
  const { data: filing } = await admin
    .from("filings")
    .select("id, short_id, workspace_id, mode, stage, agency:agency_id(code)")
    .eq("id", filingId)
    .maybeSingle();
  if (filing && filing.mode === "auto" && filing.stage === "prep") {
    const agencyCode = (filing.agency as unknown as { code: string } | null)?.code ?? null;
    const adapter = findAdapter(agencyCode);
    if (adapter) {
      const { error: stageErr } = await admin
        .from("filings")
        .update({ stage: "submit" })
        .eq("id", filingId)
        .eq("stage", "prep"); // guard against a concurrent bump
      if (!stageErr) {
        await admin.from("jobs").insert({
          type: "submit_filing",
          workspace_id: filing.workspace_id,
          payload: { filing_id: filingId },
          max_attempts: 3,
        });
        await admin.from("activity_log").insert({
          workspace_id: filing.workspace_id,
          actor_label: "ClearBot",
          type: "prepared",
          title: `Auto-filing queued for ${filing.short_id}`,
          detail: `Adapter: ${agencyCode}`,
          metadata: { filing_short_id: filing.short_id, agency_code: agencyCode },
        });
        autoSubmitted = true;
      }
    } else {
      // No adapter for this agency — leave at prep so a human can take over.
      // Don't auto-reject; the customer asked for `auto`, not "fail loudly".
      await admin.from("activity_log").insert({
        workspace_id: filing.workspace_id,
        actor_label: "ClearBot",
        type: "alert",
        title: `Auto-filing unavailable for ${filing.short_id}`,
        detail: agencyCode
          ? `No adapter for ${agencyCode} yet — needs human submission.`
          : `Filing has no agency assigned.`,
        metadata: { filing_short_id: filing.short_id, agency_code: agencyCode },
      });
    }
  }

  return {
    document_id: result.documentId,
    storage_path: result.storagePath,
    bytes: result.bytes,
    used_template: result.usedTemplate,
    auto_submitted: autoSubmitted,
  };
};
