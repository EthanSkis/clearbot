"use server";

import { revalidatePath } from "next/cache";
import { requireContext } from "@/lib/workspace";
import { logActivity } from "@/lib/activity";

export async function requestNewAgency(input: {
  agencyName: string;
  jurisdiction: string;
  notes?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await requireContext();
  const agencyName = input.agencyName.trim();
  const jurisdiction = input.jurisdiction.trim();
  if (!agencyName || !jurisdiction) {
    return { ok: false, error: "Agency name and jurisdiction are required." };
  }
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "agency",
    title: `Requested new agency · ${agencyName}`,
    detail: `${jurisdiction}${input.notes ? ` · ${input.notes}` : ""}`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
    metadata: { agency_name: agencyName, jurisdiction, notes: input.notes ?? null },
  });
  revalidatePath("/dashboard/agencies");
  return { ok: true };
}
