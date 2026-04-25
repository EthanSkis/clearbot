"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireContext } from "@/lib/workspace";
import { logActivity } from "@/lib/activity";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function createLocation(input: {
  name: string;
  city: string;
  state: string;
  addressLine1?: string;
  zip?: string;
  managerId?: string | null;
  openedYear?: number | null;
  tag?: string;
}): Promise<ActionResult> {
  const ctx = await requireContext();
  const supabase = createClient();
  const name = input.name.trim();
  const city = input.city.trim();
  const state = input.state.trim().toUpperCase();
  if (!name || !city || !state) {
    return { ok: false, error: "Name, city, and state are required." };
  }
  const { error } = await supabase.from("locations").insert({
    workspace_id: ctx.workspace.id,
    name,
    city,
    state,
    address_line1: input.addressLine1?.trim() || null,
    zip: input.zip?.trim() || null,
    manager_id: input.managerId || null,
    opened_year: input.openedYear || null,
    tag: input.tag?.trim() || "Flagship",
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "team",
    title: `Added location · ${name}`,
    detail: `${city}, ${state}`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/locations");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateLocation(
  id: string,
  input: Partial<{
    name: string;
    city: string;
    state: string;
    addressLine1: string;
    zip: string;
    managerId: string | null;
    openedYear: number | null;
    tag: string;
    status: "active" | "closed" | "archived";
  }>
): Promise<ActionResult> {
  const ctx = await requireContext();
  const supabase = createClient();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.city !== undefined) patch.city = input.city.trim();
  if (input.state !== undefined) patch.state = input.state.trim().toUpperCase();
  if (input.addressLine1 !== undefined) patch.address_line1 = input.addressLine1.trim() || null;
  if (input.zip !== undefined) patch.zip = input.zip.trim() || null;
  if (input.managerId !== undefined) patch.manager_id = input.managerId;
  if (input.openedYear !== undefined) patch.opened_year = input.openedYear;
  if (input.tag !== undefined) patch.tag = input.tag.trim();
  if (input.status !== undefined) patch.status = input.status;

  const { error } = await supabase
    .from("locations")
    .update(patch)
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/locations");
  return { ok: true };
}

export async function deleteLocation(id: string): Promise<ActionResult> {
  const ctx = await requireContext();
  const supabase = createClient();
  const { data: row } = await supabase
    .from("locations")
    .select("name")
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();
  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "team",
    title: `Removed location · ${row?.name ?? id}`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/locations");
  return { ok: true };
}

export async function importLocationsCsv(rows: Array<Record<string, string>>): Promise<
  { ok: true; inserted: number } | { ok: false; error: string }
> {
  const ctx = await requireContext();
  if (!rows.length) return { ok: false, error: "No rows in CSV." };
  const cleaned = rows
    .map((r) => ({
      workspace_id: ctx.workspace.id,
      name: (r.name || r.location || "").trim(),
      city: (r.city || "").trim(),
      state: (r.state || "").trim().toUpperCase(),
      address_line1: (r.address || r.address_line1 || "").trim() || null,
      zip: (r.zip || "").trim() || null,
      tag: (r.tag || "Flagship").trim(),
      opened_year: r.opened_year ? Number(r.opened_year) : null,
    }))
    .filter((r) => r.name && r.city && r.state);
  if (!cleaned.length) {
    return { ok: false, error: "CSV is missing the required name/city/state columns." };
  }
  const supabase = createClient();
  const { error } = await supabase.from("locations").insert(cleaned);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/locations");
  return { ok: true, inserted: cleaned.length };
}
