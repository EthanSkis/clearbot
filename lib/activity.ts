"use server";

import { createClient } from "@/lib/supabase/server";

export type ActivityType =
  | "filed"
  | "prepared"
  | "alert"
  | "agency"
  | "payment"
  | "team"
  | "integration"
  | "setting"
  | "document";

export async function logActivity(input: {
  workspaceId: string;
  type: ActivityType;
  title: string;
  detail?: string;
  actorLabel?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("activity_log").insert({
    workspace_id: input.workspaceId,
    actor_id: user?.id ?? null,
    actor_label: input.actorLabel ?? null,
    type: input.type,
    title: input.title,
    detail: input.detail ?? null,
    metadata: input.metadata ?? null,
  });
}
