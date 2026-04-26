import type { SupabaseClient } from "@supabase/supabase-js";

export type JobType = "generate_packet" | "form_hash_check";

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

export type Handler = (
  job: JobRow,
  admin: SupabaseClient
) => Promise<Record<string, unknown> | null>;
