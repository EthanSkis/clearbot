"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAdmin, requireContext } from "@/lib/workspace";
import { logActivity } from "@/lib/activity";
import { sealJson } from "@/lib/crypto";
import { enqueueJob } from "@/lib/jobs";

type Result<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : T))
  | { ok: false; error: string };

export type CredentialListRow = {
  id: string;
  agency_id: string;
  agency_code: string;
  agency_name: string;
  label: string;
  master_key_id: string;
  last_used_at: string | null;
  rotated_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function listCredentials(): Promise<
  { ok: true; items: CredentialListRow[] } | { ok: false; error: string }
> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("portal_credentials")
    .select(
      "id, agency_id, label, master_key_id, last_used_at, rotated_at, created_at, updated_at," +
        " agency:agency_id(code, name)"
    )
    .eq("workspace_id", ctx.workspace.id)
    .order("updated_at", { ascending: false });
  if (error) return { ok: false, error: error.message };

  type Row = {
    id: string;
    agency_id: string;
    label: string;
    master_key_id: string;
    last_used_at: string | null;
    rotated_at: string | null;
    created_at: string;
    updated_at: string;
    agency: { code: string; name: string } | null;
  };
  const items: CredentialListRow[] = ((data ?? []) as unknown as Row[]).map((row) => ({
    id: row.id,
    agency_id: row.agency_id,
    agency_code: row.agency?.code ?? "—",
    agency_name: row.agency?.name ?? "—",
    label: row.label,
    master_key_id: row.master_key_id,
    last_used_at: row.last_used_at,
    rotated_at: row.rotated_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
  return { ok: true, items };
}

export async function listAgencyOptions(): Promise<
  { ok: true; items: { id: string; code: string; name: string }[] } | { ok: false; error: string }
> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("agencies")
    .select("id, code, name")
    .order("code", { ascending: true });
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    items: (data ?? []).map((a) => ({
      id: a.id as string,
      code: a.code as string,
      name: a.name as string,
    })),
  };
}

export async function upsertCredential(input: {
  id?: string | null;
  agencyId: string;
  label: string;
  username: string;
  password: string;
  mfaSeed?: string;
  notes?: string;
}): Promise<Result<{ id: string }>> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };

  const username = input.username.trim();
  const password = input.password.trim();
  if (!username || !password) {
    return { ok: false, error: "Username and password are required." };
  }

  const sealed = sealJson({
    username,
    password,
    mfa_seed: input.mfaSeed?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
  });

  const admin = createAdminClient();
  const payload = {
    workspace_id: ctx.workspace.id,
    agency_id: input.agencyId,
    label: input.label.trim() || "default",
    encrypted_dek: sealed.encrypted_dek,
    encrypted_data: sealed.encrypted_data,
    iv: sealed.iv,
    auth_tag: sealed.auth_tag,
    master_key_id: sealed.master_key_id,
    created_by: ctx.user.id,
    rotated_at: input.id ? new Date().toISOString() : null,
  };

  if (input.id) {
    const { error } = await admin
      .from("portal_credentials")
      .update(payload)
      .eq("id", input.id)
      .eq("workspace_id", ctx.workspace.id);
    if (error) return { ok: false, error: error.message };
    await logActivity({
      workspaceId: ctx.workspace.id,
      type: "integration",
      title: "Rotated portal credentials",
      detail: `${payload.label}`,
      actorLabel: ctx.user.fullName ?? ctx.user.email,
    });
    revalidatePath("/dashboard/agencies/credentials");
    return { ok: true, id: input.id };
  }

  const { data, error } = await admin
    .from("portal_credentials")
    .upsert(payload, { onConflict: "workspace_id,agency_id,label" })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "insert failed" };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "integration",
    title: "Stored portal credentials",
    detail: `${payload.label}`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/agencies/credentials");
  return { ok: true, id: data.id as string };
}

export async function enqueuePoaGeneration(input: {
  agencyId: string;
  signerName: string;
  signerTitle?: string | null;
  signerEmail: string;
  durationDays?: number;
}): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  if (!input.signerName.trim() || !input.signerEmail.trim()) {
    return { ok: false, error: "Signer name and email are required." };
  }
  const admin = createAdminClient();
  const enq = await enqueueJob(
    {
      type: "generate_poa",
      workspaceId: ctx.workspace.id,
      payload: {
        workspace_id: ctx.workspace.id,
        agency_id: input.agencyId,
        signer_name: input.signerName.trim(),
        signer_title: input.signerTitle?.trim() ?? null,
        signer_email: input.signerEmail.trim(),
        duration_days: input.durationDays ?? 365,
      },
    },
    admin
  );
  if (!enq) return { ok: false, error: "Could not enqueue POA job." };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "document",
    title: "Power-of-Attorney generation queued",
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/agencies/credentials");
  revalidatePath("/dashboard/documents");
  return { ok: true };
}

export async function deleteCredential(id: string): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const admin = createAdminClient();
  const { error } = await admin
    .from("portal_credentials")
    .delete()
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "integration",
    title: "Deleted portal credentials",
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/agencies/credentials");
  return { ok: true };
}
