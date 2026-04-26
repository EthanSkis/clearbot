"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAdmin, requireContext } from "@/lib/workspace";
import { logActivity } from "@/lib/activity";
import { newApiKey } from "@/lib/crypto";
import { randomBytes } from "crypto";

type Result = { ok: true } | { ok: false; error: string };

export async function updateGeneralSettings(input: {
  name: string;
  legalEntity: string;
  timezone: string;
}): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const supabase = createClient();
  const { error } = await supabase
    .from("workspaces")
    .update({
      name: input.name.trim(),
      legal_entity: input.legalEntity.trim(),
      timezone: input.timezone,
    })
    .eq("id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "setting",
    title: "Updated workspace identity",
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateSecuritySettings(input: {
  ssoEnforced: boolean;
  scimActive: boolean;
  sessionLifetime: string;
  ipAllowlistEnabled: boolean;
  auditRetention: string;
  baaOnFile: boolean;
}): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const supabase = createClient();
  const { data: row } = await supabase
    .from("workspaces")
    .select("settings")
    .eq("id", ctx.workspace.id)
    .maybeSingle();
  const settings = (row?.settings ?? {}) as Record<string, unknown>;
  settings.security = {
    sso_enforced: input.ssoEnforced,
    scim_active: input.scimActive,
    session_lifetime: input.sessionLifetime,
    ip_allowlist: input.ipAllowlistEnabled,
    audit_retention: input.auditRetention,
    baa_on_file: input.baaOnFile,
  };
  const { error } = await supabase
    .from("workspaces")
    .update({ settings })
    .eq("id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function updateNotificationSettings(input: {
  ownerEmail: boolean;
  ownerSms: boolean;
  ownerSlack: boolean;
  managerEmail: boolean;
  managerSms: boolean;
  managerSlack: boolean;
  financeEmail: boolean;
  financeSlack: boolean;
  leadDays: number;
  escalationHours: number;
}): Promise<Result> {
  const ctx = await requireContext();
  const supabase = createClient();
  const { data: row } = await supabase
    .from("workspaces")
    .select("settings")
    .eq("id", ctx.workspace.id)
    .maybeSingle();
  const settings = (row?.settings ?? {}) as Record<string, unknown>;
  settings.notifications = {
    owner: { email: input.ownerEmail, sms: input.ownerSms, slack: input.ownerSlack },
    manager: { email: input.managerEmail, sms: input.managerSms, slack: input.managerSlack },
    finance: { email: input.financeEmail, slack: input.financeSlack },
    lead_days: input.leadDays,
    escalation_hours: input.escalationHours,
  };
  settings.deadline_lead_days = input.leadDays;
  settings.escalation_hours = input.escalationHours;
  const { error } = await supabase.from("workspaces").update({ settings }).eq("id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };

  // Mirror the current user's choice into the per-member notification_prefs
  // table that the daily cron actually reads from.
  const role = ctx.membership.role;
  const channelEmail =
    role === "owner"
      ? input.ownerEmail
      : role === "finance"
        ? input.financeEmail
        : input.managerEmail;
  const channelSms = role === "owner" ? input.ownerSms : role === "finance" ? false : input.managerSms;
  const channelSlack =
    role === "owner" ? input.ownerSlack : role === "finance" ? input.financeSlack : input.managerSlack;
  const { data: existingPref } = await supabase
    .from("notification_prefs")
    .select("id")
    .eq("workspace_id", ctx.workspace.id)
    .eq("member_id", ctx.membership.id)
    .maybeSingle();
  if (existingPref) {
    await supabase
      .from("notification_prefs")
      .update({
        channel_email: channelEmail,
        channel_sms: channelSms,
        channel_slack: channelSlack,
        lead_days: input.leadDays,
        escalation_hours: input.escalationHours,
      })
      .eq("id", existingPref.id);
  } else {
    await supabase.from("notification_prefs").insert({
      workspace_id: ctx.workspace.id,
      member_id: ctx.membership.id,
      channel_email: channelEmail,
      channel_sms: channelSms,
      channel_slack: channelSlack,
      lead_days: input.leadDays,
      escalation_hours: input.escalationHours,
    });
  }

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function updateAutomationSettings(input: {
  defaultMode: "alert" | "prep" | "auto";
  approvalThresholdUsd: number;
  autoFileWindowDays: number;
}): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const supabase = createClient();
  const { data: row } = await supabase
    .from("workspaces")
    .select("settings")
    .eq("id", ctx.workspace.id)
    .maybeSingle();
  const settings = (row?.settings ?? {}) as Record<string, unknown>;
  settings.default_mode = input.defaultMode;
  settings.approval_threshold_cents = Math.max(0, Math.round(input.approvalThresholdUsd * 100));
  settings.auto_file_window_days = Math.max(1, Math.round(input.autoFileWindowDays));
  const { error } = await supabase.from("workspaces").update({ settings }).eq("id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function exportWorkspace(): Promise<{ ok: true; csv: string } | { ok: false; error: string }> {
  const ctx = await requireContext();
  const supabase = createClient();
  const [{ data: locations }, { data: licenses }, { data: filings }] = await Promise.all([
    supabase.from("locations").select("*").eq("workspace_id", ctx.workspace.id),
    supabase.from("licenses").select("*").eq("workspace_id", ctx.workspace.id),
    supabase.from("filings").select("*").eq("workspace_id", ctx.workspace.id),
  ]);
  const rows: string[] = [];
  function dump(name: string, items: Record<string, unknown>[]) {
    if (!items.length) return;
    rows.push(`# ${name}`);
    const headers = Object.keys(items[0]);
    rows.push(headers.join(","));
    for (const row of items) {
      rows.push(
        headers
          .map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      );
    }
    rows.push("");
  }
  dump("locations", (locations ?? []) as Record<string, unknown>[]);
  dump("licenses", (licenses ?? []) as Record<string, unknown>[]);
  dump("filings", (filings ?? []) as Record<string, unknown>[]);
  return { ok: true, csv: rows.join("\n") };
}

export async function transferOwnership(newOwnerUserId: string): Promise<Result> {
  const ctx = await requireContext();
  if (ctx.membership.role !== "owner") {
    return { ok: false, error: "Only the current owner can transfer ownership." };
  }
  const supabase = createClient();
  const { data: target } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", ctx.workspace.id)
    .eq("user_id", newOwnerUserId)
    .maybeSingle();
  if (!target) return { ok: false, error: "That user is not a member of the workspace." };

  const { error: e1 } = await supabase
    .from("workspace_members")
    .update({ role: "admin" })
    .eq("workspace_id", ctx.workspace.id)
    .eq("user_id", ctx.user.id);
  if (e1) return { ok: false, error: e1.message };

  const { error: e2 } = await supabase
    .from("workspace_members")
    .update({ role: "owner" })
    .eq("id", target.id);
  if (e2) return { ok: false, error: e2.message };

  const { error: e3 } = await supabase
    .from("workspaces")
    .update({ owner_id: newOwnerUserId })
    .eq("id", ctx.workspace.id);
  if (e3) return { ok: false, error: e3.message };

  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "team",
    title: "Transferred workspace ownership",
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });

  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function cancelSubscription(): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const supabase = createClient();
  const { error } = await supabase
    .from("workspaces")
    .update({ status: "cancelled" })
    .eq("id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "payment",
    title: "Subscription cancelled",
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/settings");
  return { ok: true };
}

export async function listApiKeys() {
  const ctx = await requireContext();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, scope, created_at, last_used_at, revoked_at")
    .eq("workspace_id", ctx.workspace.id)
    .order("created_at", { ascending: false });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, items: data ?? [] };
}

export async function createApiKey(input: {
  name: string;
  scope: "read" | "read_write";
}): Promise<{ ok: true; key: string; prefix: string } | { ok: false; error: string }> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const supabase = createClient();
  let made;
  try {
    made = newApiKey();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "key gen failed" };
  }
  const { error } = await supabase.from("api_keys").insert({
    workspace_id: ctx.workspace.id,
    name: input.name.trim() || "Untitled key",
    key_prefix: made.prefix,
    key_hash: made.hash,
    scope: input.scope,
    created_by: ctx.user.id,
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "setting",
    title: `API key issued · ${input.name}`,
    detail: `${input.scope} scope`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  return { ok: true, key: made.plaintext, prefix: made.prefix };
}

export async function revokeApiKey(id: string): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const supabase = createClient();
  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "setting",
    title: "API key revoked",
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  return { ok: true };
}

export async function listWebhooks() {
  await requireContext();
  const ctx = await requireContext();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("webhooks")
    .select("id, url, event, signing_secret, active, last_fired_at, last_status, created_at")
    .eq("workspace_id", ctx.workspace.id)
    .order("created_at", { ascending: false });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, items: data ?? [] };
}

export async function createWebhook(input: { url: string; event: string }): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  let target: URL;
  try {
    target = new URL(input.url);
  } catch {
    return { ok: false, error: "URL must be absolute (https://…)" };
  }
  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return { ok: false, error: "URL must be http or https" };
  }
  const signingSecret = `whsec_${randomBytes(24).toString("base64url")}`;
  const supabase = createClient();
  const { error } = await supabase.from("webhooks").insert({
    workspace_id: ctx.workspace.id,
    url: input.url.trim(),
    event: input.event.trim() || "filing.confirmed",
    signing_secret: signingSecret,
    active: true,
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "setting",
    title: `Webhook added · ${input.event}`,
    detail: input.url,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  return { ok: true };
}

export async function toggleWebhook(id: string, active: boolean): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const supabase = createClient();
  const { error } = await supabase
    .from("webhooks")
    .update({ active })
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteWebhook(id: string): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const supabase = createClient();
  const { error } = await supabase
    .from("webhooks")
    .delete()
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteWorkspace(confirm: string): Promise<Result> {
  const ctx = await requireContext();
  if (ctx.membership.role !== "owner") {
    return { ok: false, error: "Only the owner can delete the workspace." };
  }
  if (confirm !== ctx.workspace.name) {
    return { ok: false, error: "Confirmation phrase did not match the workspace name." };
  }
  const supabase = createClient();
  const { error } = await supabase.from("workspaces").delete().eq("id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  redirect("/onboarding");
}
