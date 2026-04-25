"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canAdmin, requireContext, type WorkspaceRole } from "@/lib/workspace";
import { logActivity } from "@/lib/activity";

type Result<T = undefined> = ({ ok: true } & (T extends undefined ? object : T)) | { ok: false; error: string };

const VALID_ROLES: WorkspaceRole[] = ["admin", "finance", "manager", "ops", "legal"];

function newToken() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export async function inviteMember(input: {
  email: string;
  role: WorkspaceRole;
  scope?: string;
}): Promise<Result<{ token: string }>> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) {
    return { ok: false, error: "Only owners and admins can invite teammates." };
  }
  const email = input.email.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email." };
  }
  if (!VALID_ROLES.includes(input.role)) {
    return { ok: false, error: "Pick a valid role." };
  }

  const supabase = createClient();

  // If the email already exists as an active user, just create the membership.
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile?.id) {
    const { error } = await supabase
      .from("workspace_members")
      .upsert(
        {
          workspace_id: ctx.workspace.id,
          user_id: existingProfile.id,
          role: input.role,
          scope: input.scope ? { description: input.scope } : {},
          status: "active",
        },
        { onConflict: "workspace_id,user_id" }
      );
    if (error) return { ok: false, error: error.message };
    await logActivity({
      workspaceId: ctx.workspace.id,
      type: "team",
      title: `Added ${email}`,
      detail: `Role: ${input.role}`,
      actorLabel: ctx.user.fullName ?? ctx.user.email,
    });
    revalidatePath("/dashboard/team");
    return { ok: true, token: "linked-existing-user" };
  }

  const token = newToken();
  const { error } = await supabase.from("workspace_invites").insert({
    workspace_id: ctx.workspace.id,
    email,
    role: input.role,
    scope: input.scope ? { description: input.scope } : {},
    token,
    invited_by: ctx.user.id,
  });
  if (error) return { ok: false, error: error.message };

  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "team",
    title: `Invited ${email}`,
    detail: `Role: ${input.role}`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });

  revalidatePath("/dashboard/team");
  return { ok: true, token };
}

export async function changeMemberRole(memberId: string, role: WorkspaceRole): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) {
    return { ok: false, error: "Only owners and admins can change roles." };
  }
  if (!VALID_ROLES.includes(role) && role !== "owner") {
    return { ok: false, error: "Invalid role." };
  }
  const supabase = createClient();

  // Don't allow demoting the last owner.
  if (role !== "owner") {
    const { data: targetMember } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("id", memberId)
      .eq("workspace_id", ctx.workspace.id)
      .maybeSingle();
    if (targetMember?.role === "owner") {
      const { count } = await supabase
        .from("workspace_members")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", ctx.workspace.id)
        .eq("role", "owner");
      if ((count ?? 0) <= 1) {
        return { ok: false, error: "Promote another member to owner before demoting the last one." };
      }
    }
  }

  const { error } = await supabase
    .from("workspace_members")
    .update({ role })
    .eq("id", memberId)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };

  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "team",
    title: `Changed member role to ${role}`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });

  revalidatePath("/dashboard/team");
  return { ok: true };
}

export async function removeMember(memberId: string): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) {
    return { ok: false, error: "Only owners and admins can remove teammates." };
  }
  const supabase = createClient();
  const { data: target } = await supabase
    .from("workspace_members")
    .select("user_id, role")
    .eq("id", memberId)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();
  if (!target) return { ok: false, error: "Member not found." };
  if (target.role === "owner") {
    return { ok: false, error: "Transfer ownership before removing the owner." };
  }
  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("id", memberId)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "team",
    title: `Removed member`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/team");
  return { ok: true };
}

export async function revokeInvite(inviteId: string): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) {
    return { ok: false, error: "Only owners and admins can revoke invites." };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("workspace_invites")
    .delete()
    .eq("id", inviteId)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/team");
  return { ok: true };
}
