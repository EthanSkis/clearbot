"use server";

import { revalidatePath } from "next/cache";
import { createHmac, randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { canAdmin, requireContext } from "@/lib/workspace";
import { logActivity } from "@/lib/activity";
import { newApiKey } from "@/lib/crypto";

type Result<T = undefined> = ({ ok: true } & (T extends undefined ? object : T)) | { ok: false; error: string };

export async function connectIntegration(input: {
  provider: string;
  category: string;
  config?: Record<string, unknown>;
}): Promise<Result> {
  const ctx = await requireContext();
  const supabase = createClient();
  const { error } = await supabase
    .from("integrations")
    .upsert(
      {
        workspace_id: ctx.workspace.id,
        provider: input.provider,
        category: input.category,
        status: "connected",
        config: input.config ?? {},
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,provider" }
    );
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "integration",
    title: `Connected ${input.provider}`,
    detail: input.category,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/integrations");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function disconnectIntegration(integrationId: string): Promise<Result> {
  const ctx = await requireContext();
  const supabase = createClient();
  const { data: row } = await supabase
    .from("integrations")
    .select("provider")
    .eq("id", integrationId)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();
  const { error } = await supabase
    .from("integrations")
    .update({ status: "disconnected", last_synced_at: null })
    .eq("id", integrationId)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "integration",
    title: `Disconnected ${row?.provider ?? "integration"}`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/integrations");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function syncIntegration(integrationId: string): Promise<Result> {
  const ctx = await requireContext();
  const supabase = createClient();
  const { error } = await supabase
    .from("integrations")
    .update({ status: "syncing", last_synced_at: new Date().toISOString() })
    .eq("id", integrationId)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  // After a brief moment, mark connected. (No background queue in this slice — write the final state straight away.)
  await supabase
    .from("integrations")
    .update({ status: "connected", last_synced_at: new Date().toISOString() })
    .eq("id", integrationId);
  revalidatePath("/dashboard/integrations");
  return { ok: true };
}

export async function createWebhook(input: { url: string; event: string }): Promise<Result> {
  const ctx = await requireContext();
  const supabase = createClient();
  const url = input.url.trim();
  if (!/^https?:\/\//.test(url)) return { ok: false, error: "Webhook URL must start with http(s)://" };
  const signingSecret = `whsec_${randomBytes(16).toString("hex")}`;
  const { error } = await supabase.from("webhooks").insert({
    workspace_id: ctx.workspace.id,
    url,
    event: input.event || "license.state_changed",
    signing_secret: signingSecret,
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "integration",
    title: "Added webhook endpoint",
    detail: `${input.event} → ${url}`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/integrations");
  return { ok: true };
}

export async function deleteWebhook(webhookId: string): Promise<Result> {
  const ctx = await requireContext();
  const supabase = createClient();
  const { error } = await supabase
    .from("webhooks")
    .delete()
    .eq("id", webhookId)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/integrations");
  return { ok: true };
}

export async function fireTestWebhook(webhookId: string): Promise<Result> {
  const ctx = await requireContext();
  const supabase = createClient();
  const { data: hook } = await supabase
    .from("webhooks")
    .select("id, url, signing_secret, event")
    .eq("id", webhookId)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();
  if (!hook) return { ok: false, error: "Webhook not found." };
  const payload = {
    event: hook.event,
    workspace_id: ctx.workspace.id,
    delivered_at: new Date().toISOString(),
    sample: true,
  };
  const body = JSON.stringify(payload);
  const signature = createHmac("sha256", hook.signing_secret as string).update(body).digest("hex");
  let status = "200 OK";
  try {
    const res = await fetch(hook.url as string, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-clearbot-event": hook.event as string,
        "x-clearbot-signature": `sha256=${signature}`,
      },
      body,
      cache: "no-store",
    });
    status = `${res.status} ${res.statusText || ""}`.trim();
  } catch {
    status = "delivery failed";
  }
  await supabase
    .from("webhooks")
    .update({ last_fired_at: new Date().toISOString(), last_status: status })
    .eq("id", webhookId);
  revalidatePath("/dashboard/integrations");
  return { ok: true };
}

export async function generateApiKey(input: { name: string; scope: "read" | "read_write" }): Promise<
  { ok: true; secret: string } | { ok: false; error: string }
> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Only owners and admins can mint keys." };
  const supabase = createClient();
  const name = input.name.trim() || "API key";
  let made;
  try {
    made = newApiKey();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "key gen failed" };
  }
  const { error } = await supabase.from("api_keys").insert({
    workspace_id: ctx.workspace.id,
    name,
    key_prefix: made.prefix,
    key_hash: made.hash,
    scope: input.scope,
    created_by: ctx.user.id,
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "integration",
    title: `Generated API key · ${name}`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/integrations");
  return { ok: true, secret: made.plaintext };
}

export async function rotateApiKey(keyId: string): Promise<{ ok: true; secret: string } | { ok: false; error: string }> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Only owners and admins can rotate keys." };
  const supabase = createClient();
  let made;
  try {
    made = newApiKey();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "key gen failed" };
  }
  const { error } = await supabase
    .from("api_keys")
    .update({ key_prefix: made.prefix, key_hash: made.hash, last_used_at: null })
    .eq("id", keyId)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/integrations");
  return { ok: true, secret: made.plaintext };
}

export async function revokeApiKey(keyId: string): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Only owners and admins can revoke keys." };
  const supabase = createClient();
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/integrations");
  return { ok: true };
}
