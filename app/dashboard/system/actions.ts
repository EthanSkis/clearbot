"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAdmin, requireContext } from "@/lib/workspace";
import { logActivity } from "@/lib/activity";

type Result = { ok: true } | { ok: false; error: string };

export async function requeueStale(): Promise<{ ok: true; n: number } | { ok: false; error: string }> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("requeue_stale_jobs", { stale_after_seconds: 300 });
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "setting",
    title: `Requeued ${data ?? 0} stale job(s)`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/system");
  return { ok: true, n: (data as number) ?? 0 };
}

export async function purgeOldJobs(): Promise<{ ok: true; n: number } | { ok: false; error: string }> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("janitor_purge_jobs", { retain_days: 7 });
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "setting",
    title: `Purged ${data ?? 0} job row(s) older than 7 days`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/system");
  return { ok: true, n: (data as number) ?? 0 };
}

export async function cancelJob(jobId: string): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const admin = createAdminClient();
  const { error } = await admin
    .from("jobs")
    .update({
      status: "cancelled",
      finished_at: new Date().toISOString(),
      error: "cancelled by admin",
    })
    .eq("id", jobId)
    .eq("workspace_id", ctx.workspace.id)
    .in("status", ["queued", "running"]);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/system");
  return { ok: true };
}

export async function retryFailedJob(jobId: string): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const admin = createAdminClient();
  const { data: job, error: jErr } = await admin
    .from("jobs")
    .select("status, attempts, max_attempts")
    .eq("id", jobId)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();
  if (jErr) return { ok: false, error: jErr.message };
  if (!job) return { ok: false, error: "Job not found." };
  if (job.status !== "failed" && job.status !== "cancelled") {
    return { ok: false, error: "Only failed or cancelled jobs can be retried." };
  }
  const { error } = await admin
    .from("jobs")
    .update({
      status: "queued",
      run_after: new Date().toISOString(),
      locked_at: null,
      locked_by: null,
      attempts: 0,
      finished_at: null,
      error: null,
    })
    .eq("id", jobId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/system");
  return { ok: true };
}
