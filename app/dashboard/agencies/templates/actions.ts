"use server";

import { revalidatePath } from "next/cache";
import { canAdmin, requireContext } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase/admin";

type Result<T = undefined> = ({ ok: true } & (T extends undefined ? object : T)) | { ok: false; error: string };

export async function listTemplates() {
  await requireContext();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("form_templates")
    .select(
      "id, agency_id, license_type, name, version, pdf_storage_path, field_mappings, notes, updated_at, agency:agency_id(code, name)"
    )
    .order("updated_at", { ascending: false });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, items: data ?? [] };
}

export async function upsertTemplate(input: {
  id?: string | null;
  agencyId: string;
  licenseType: string;
  name: string;
  version: string;
  fieldMappingsJson: string;
  notes: string | null;
}): Promise<Result<{ id: string }>> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };

  let fieldMappings: Record<string, string>;
  try {
    fieldMappings = JSON.parse(input.fieldMappingsJson || "{}");
    if (typeof fieldMappings !== "object" || Array.isArray(fieldMappings)) {
      throw new Error("must be a JSON object");
    }
  } catch (e) {
    return { ok: false, error: `field_mappings: ${e instanceof Error ? e.message : "invalid JSON"}` };
  }

  const admin = createAdminClient();
  const payload = {
    agency_id: input.agencyId,
    license_type: input.licenseType.trim(),
    name: input.name.trim(),
    version: input.version.trim() || "v1",
    field_mappings: fieldMappings,
    notes: input.notes?.trim() || null,
  };
  if (input.id) {
    const { error } = await admin.from("form_templates").update(payload).eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/dashboard/agencies/templates");
    return { ok: true, id: input.id };
  }
  const { data, error } = await admin
    .from("form_templates")
    .insert(payload)
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "insert failed" };
  revalidatePath("/dashboard/agencies/templates");
  return { ok: true, id: data.id as string };
}

export async function createTemplateUploadUrl(input: {
  templateId: string;
  fileName: string;
}): Promise<
  | { ok: true; storagePath: string; token: string }
  | { ok: false; error: string }
> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };

  const admin = createAdminClient();
  const { data: tpl } = await admin
    .from("form_templates")
    .select("id, agency_id, license_type, version")
    .eq("id", input.templateId)
    .maybeSingle();
  if (!tpl) return { ok: false, error: "Template not found." };

  const safeName = input.fileName.replace(/[^a-z0-9_.-]+/gi, "_");
  const storagePath = `${tpl.agency_id}/${tpl.license_type.replace(/\s+/g, "_")}-${tpl.version}-${Date.now()}-${safeName}`;
  const { data, error } = await admin.storage
    .from("form-templates")
    .createSignedUploadUrl(storagePath);
  if (error || !data) return { ok: false, error: error?.message ?? "could not sign upload URL" };
  return { ok: true, storagePath, token: data.token };
}

export async function commitTemplatePdf(input: {
  templateId: string;
  storagePath: string;
}): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };

  const admin = createAdminClient();
  const { data: head } = await admin.storage
    .from("form-templates")
    .createSignedUrl(input.storagePath, 5);
  if (!head?.signedUrl) return { ok: false, error: "Upload not visible in storage yet." };

  const { error } = await admin
    .from("form_templates")
    .update({ pdf_storage_path: input.storagePath })
    .eq("id", input.templateId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/agencies/templates");
  return { ok: true };
}

export async function deleteTemplate(id: string): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) return { ok: false, error: "Admins only." };
  const admin = createAdminClient();
  const { data: tpl } = await admin
    .from("form_templates")
    .select("pdf_storage_path")
    .eq("id", id)
    .maybeSingle();
  if (tpl?.pdf_storage_path) {
    await admin.storage.from("form-templates").remove([tpl.pdf_storage_path as string]);
  }
  const { error } = await admin.from("form_templates").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/agencies/templates");
  return { ok: true };
}

export async function getTemplatePdfUrl(id: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireContext();
  const admin = createAdminClient();
  const { data: tpl } = await admin
    .from("form_templates")
    .select("pdf_storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!tpl?.pdf_storage_path) return { ok: false, error: "No PDF attached." };
  const { data, error } = await admin.storage
    .from("form-templates")
    .createSignedUrl(tpl.pdf_storage_path as string, 60 * 5);
  if (error || !data) return { ok: false, error: error?.message ?? "could not sign URL" };
  return { ok: true, url: data.signedUrl };
}
