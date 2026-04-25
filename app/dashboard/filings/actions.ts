"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireContext } from "@/lib/workspace";
import { logActivity } from "@/lib/activity";

type Result = { ok: true } | { ok: false; error: string };

const STAGES = ["intake", "prep", "review", "submit", "confirm", "done"] as const;
type Stage = (typeof STAGES)[number];

export async function advanceFilingStage(filingId: string): Promise<Result> {
  const ctx = await requireContext();
  const supabase = createClient();
  const { data: row } = await supabase
    .from("filings")
    .select("id, stage, status, license_id, license:license_id(license_type, expires_at, cycle_days), short_id")
    .eq("id", filingId)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();
  if (!row) return { ok: false, error: "Filing not found." };

  const idx = STAGES.indexOf(row.stage as Stage);
  if (idx < 0 || idx >= STAGES.length - 1) return { ok: false, error: "Filing already complete." };
  const nextStage = STAGES[idx + 1];
  const patch: Record<string, unknown> = { stage: nextStage };

  if (nextStage === "confirm") {
    patch.filed_at = new Date().toISOString();
    patch.status = "confirmed";
    patch.confirmation_number =
      (row as { confirmation_number?: string }).confirmation_number ??
      `CB-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  }
  if (nextStage === "done") {
    patch.status = "confirmed";
  }
  const { error } = await supabase.from("filings").update(patch).eq("id", filingId);
  if (error) return { ok: false, error: error.message };

  if (nextStage === "confirm" && row.license_id) {
    const license = row.license as unknown as { license_type: string; expires_at: string | null; cycle_days: number } | null;
    if (license) {
      const cycle = license.cycle_days ?? 365;
      const base = license.expires_at ? new Date(license.expires_at) : new Date();
      const newExp = new Date(base.getTime() + cycle * 86_400_000).toISOString().slice(0, 10);
      await supabase
        .from("licenses")
        .update({ expires_at: newExp, status: "active" })
        .eq("id", row.license_id);
    }
    await logActivity({
      workspaceId: ctx.workspace.id,
      type: "filed",
      title: `Filing ${row.short_id} confirmed`,
      detail: license ? license.license_type : "Manual filing",
      actorLabel: ctx.user.fullName ?? ctx.user.email,
    });
  }

  revalidatePath("/dashboard/filings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function rejectFiling(filingId: string, reason: string): Promise<Result> {
  const ctx = await requireContext();
  const supabase = createClient();
  const { error } = await supabase
    .from("filings")
    .update({ stage: "rejected", status: "rejected", notes: reason })
    .eq("id", filingId)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "alert",
    title: `Filing ${filingId.slice(0, 8)} rejected`,
    detail: reason,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/filings");
  return { ok: true };
}

export async function manualFile(input: {
  licenseId: string;
  feeCents?: number;
  confirmationNumber?: string;
  mode?: "alert" | "prep" | "auto";
}): Promise<Result> {
  const ctx = await requireContext();
  const supabase = createClient();
  const { data: license } = await supabase
    .from("licenses")
    .select("id, location_id, agency_id, license_type, fee_cents, automation_mode, cycle_days, expires_at")
    .eq("id", input.licenseId)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();
  if (!license) return { ok: false, error: "License not found." };

  const { data: shortIdRow } = await supabase.rpc("next_filing_short_id", { wsid: ctx.workspace.id });
  const shortId = (shortIdRow as string) || `CB-${Date.now()}`;

  const { error } = await supabase.from("filings").insert({
    workspace_id: ctx.workspace.id,
    license_id: license.id,
    location_id: license.location_id,
    agency_id: license.agency_id,
    short_id: shortId,
    stage: "intake",
    mode: input.mode ?? license.automation_mode,
    fee_cents: input.feeCents ?? license.fee_cents,
    confirmation_number: input.confirmationNumber || null,
    owner_id: ctx.user.id,
    status: "in_flight",
  });
  if (error) return { ok: false, error: error.message };

  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "prepared",
    title: `${license.license_type} packet started`,
    detail: `Filing ${shortId}`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });

  revalidatePath("/dashboard/filings");
  revalidatePath("/dashboard");
  return { ok: true };
}
