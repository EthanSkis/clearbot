import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export type JobType =
  | "generate_packet"
  | "form_hash_check"
  | "submit_filing"
  | "deliver_webhook";

export type JobRow = {
  id: string;
  type: JobType;
  workspace_id: string | null;
  payload: Record<string, unknown>;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
  attempts: number;
  max_attempts: number;
  run_after: string;
  locked_at: string | null;
  locked_by: string | null;
  started_at: string | null;
  finished_at: string | null;
  result: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
};

export type EnqueueInput = {
  type: JobType;
  workspaceId?: string | null;
  payload?: Record<string, unknown>;
  runAfter?: Date;
  maxAttempts?: number;
};

export async function enqueueJob(input: EnqueueInput, client?: SupabaseClient): Promise<JobRow | null> {
  const admin = client ?? createAdminClient();
  const { data, error } = await admin
    .from("jobs")
    .insert({
      type: input.type,
      workspace_id: input.workspaceId ?? null,
      payload: input.payload ?? {},
      run_after: (input.runAfter ?? new Date()).toISOString(),
      max_attempts: input.maxAttempts ?? 5,
    })
    .select("*")
    .single();
  if (error) {
    console.error("[jobs] enqueue failed:", error);
    return null;
  }
  return data as JobRow;
}

export async function dequeueJob(workerId: string, client?: SupabaseClient): Promise<JobRow | null> {
  const admin = client ?? createAdminClient();
  const { data, error } = await admin.rpc("dequeue_job", { worker_id: workerId });
  if (error) {
    console.error("[jobs] dequeue failed:", error);
    return null;
  }
  const row: JobRow | null = Array.isArray(data) ? (data[0] ?? null) : (data as JobRow | null);
  if (!row || !row.id) return null;
  return row;
}

export async function markJobDone(
  jobId: string,
  result: Record<string, unknown> | null,
  client?: SupabaseClient
): Promise<void> {
  const admin = client ?? createAdminClient();
  await admin
    .from("jobs")
    .update({
      status: "done",
      finished_at: new Date().toISOString(),
      result: result ?? {},
      error: null,
    })
    .eq("id", jobId);
}

export async function markJobFailed(
  job: Pick<JobRow, "id" | "attempts" | "max_attempts">,
  error: string,
  retryAfterMs = 60_000,
  client?: SupabaseClient
): Promise<void> {
  const admin = client ?? createAdminClient();
  const exhausted = job.attempts >= job.max_attempts;
  await admin
    .from("jobs")
    .update({
      status: exhausted ? "failed" : "queued",
      finished_at: exhausted ? new Date().toISOString() : null,
      locked_at: null,
      locked_by: null,
      run_after: exhausted ? new Date().toISOString() : new Date(Date.now() + retryAfterMs).toISOString(),
      error,
    })
    .eq("id", job.id);
}

export async function requeueStaleJobs(staleAfterSeconds = 600, client?: SupabaseClient): Promise<number> {
  const admin = client ?? createAdminClient();
  const { data, error } = await admin.rpc("requeue_stale_jobs", { stale_after_seconds: staleAfterSeconds });
  if (error) {
    console.error("[jobs] requeue_stale failed:", error);
    return 0;
  }
  return (data as number) ?? 0;
}
