"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAdmin, requireContext } from "@/lib/workspace";
import { enqueueJob } from "@/lib/jobs";

type Result = { ok: true } | { ok: false; error: string };

export async function replayDelivery(deliveryId: string): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const admin = createAdminClient();

  const { data: delivery } = await admin
    .from("webhook_deliveries")
    .select("id, workspace_id, status")
    .eq("id", deliveryId)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();
  if (!delivery) return { ok: false, error: "Delivery not found." };

  // Reset for a fresh attempt and enqueue immediately.
  await admin
    .from("webhook_deliveries")
    .update({
      status: "pending",
      attempts: 0,
      last_error: null,
      last_response_status: null,
      last_response_body: null,
      next_retry_at: new Date().toISOString(),
    })
    .eq("id", deliveryId);

  const enq = await enqueueJob(
    {
      type: "deliver_webhook",
      workspaceId: ctx.workspace.id,
      payload: { delivery_id: deliveryId },
      maxAttempts: 3,
    },
    admin
  );
  if (!enq) return { ok: false, error: "Could not enqueue replay job." };

  revalidatePath("/dashboard/settings/deliveries");
  return { ok: true };
}

export async function dropDelivery(deliveryId: string): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const admin = createAdminClient();
  const { error } = await admin
    .from("webhook_deliveries")
    .update({ status: "dropped", last_error: "manually dropped" })
    .eq("id", deliveryId)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/settings/deliveries");
  return { ok: true };
}
