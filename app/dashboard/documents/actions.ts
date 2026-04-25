"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireContext } from "@/lib/workspace";
import { logActivity } from "@/lib/activity";

type Result<T = undefined> = ({ ok: true } & (T extends undefined ? object : T)) | { ok: false; error: string };

export async function registerDocument(input: {
  storagePath: string;
  name: string;
  kind: "certificate" | "receipt" | "application" | "correspondence";
  mimeType: string;
  sizeBytes: number;
  locationId?: string | null;
  licenseId?: string | null;
  filingId?: string | null;
}): Promise<Result> {
  const ctx = await requireContext();
  const supabase = createClient();
  const { error } = await supabase.from("documents").insert({
    workspace_id: ctx.workspace.id,
    name: input.name,
    kind: input.kind,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    storage_path: input.storagePath,
    location_id: input.locationId ?? null,
    license_id: input.licenseId ?? null,
    filing_id: input.filingId ?? null,
    uploaded_by: ctx.user.id,
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "document",
    title: `Uploaded ${input.name}`,
    detail: `${(input.sizeBytes / 1024).toFixed(0)} KB · ${input.kind}`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/documents");
  return { ok: true };
}

export async function deleteDocument(id: string): Promise<Result> {
  const ctx = await requireContext();
  const supabase = createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path,name")
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();
  if (!doc) return { ok: false, error: "Document not found." };
  if (doc.storage_path) {
    await supabase.storage.from("documents").remove([doc.storage_path as string]);
  }
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "document",
    title: `Deleted ${doc.name}`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/documents");
  return { ok: true };
}

export async function getSignedUrl(storagePath: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireContext();
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(storagePath, 60 * 5);
  if (error || !data) return { ok: false, error: error?.message ?? "Could not sign URL." };
  return { ok: true, url: data.signedUrl };
}

export async function getAuditPackUrls(): Promise<{ ok: true; urls: { name: string; url: string }[] } | { ok: false; error: string }> {
  const ctx = await requireContext();
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("name, storage_path")
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };

  const out: { name: string; url: string }[] = [];
  for (const row of data ?? []) {
    if (!row.storage_path) continue;
    const { data: signed } = await supabase.storage
      .from("documents")
      .createSignedUrl(row.storage_path as string, 60 * 30);
    if (signed?.signedUrl) {
      out.push({ name: row.name, url: signed.signedUrl });
    }
  }
  return { ok: true, urls: out };
}
