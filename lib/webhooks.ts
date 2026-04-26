import "server-only";
import { enqueueJob } from "@/lib/jobs";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export type WebhookEvent =
  | "filing.opened"
  | "filing.packet_ready"
  | "filing.approved"
  | "filing.submitted"
  | "filing.confirmed"
  | "filing.rejected"
  | "license.state_changed";

export async function fanoutWebhook(input: {
  workspaceId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  client?: SupabaseClient;
}): Promise<number> {
  const admin = input.client ?? createAdminClient();
  const { data: hooks, error } = await admin
    .from("webhooks")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .eq("active", true);
  if (error) {
    console.error("[webhooks] subscriber lookup failed:", error);
    return 0;
  }
  let n = 0;
  for (const h of hooks ?? []) {
    const { data: delivery, error: dErr } = await admin
      .from("webhook_deliveries")
      .insert({
        workspace_id: input.workspaceId,
        webhook_id: h.id,
        event: input.event,
        payload: input.payload,
      })
      .select("id")
      .single();
    if (dErr || !delivery) {
      console.error("[webhooks] delivery insert failed:", dErr);
      continue;
    }
    const enq = await enqueueJob(
      {
        type: "deliver_webhook",
        workspaceId: input.workspaceId,
        payload: { delivery_id: delivery.id },
      },
      admin
    );
    if (enq) n += 1;
  }
  return n;
}
