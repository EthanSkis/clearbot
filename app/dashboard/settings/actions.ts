"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canAdmin, requireContext } from "@/lib/workspace";
import { logActivity } from "@/lib/activity";

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
