"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

export async function createWorkspaceForCurrentUser(input: {
  company: string;
  legalEntity?: string;
  timezone?: string;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const company = input.company.trim();
  if (!company) {
    return { ok: false as const, error: "Company name is required." };
  }

  const baseSlug = slugify(company) || `workspace-${user.id.slice(0, 8)}`;
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from("workspaces").insert({
      owner_id: user.id,
      name: company,
      slug,
      legal_entity: input.legalEntity?.trim() || company,
      timezone: input.timezone || "America/Chicago",
      plan: "essential",
      settings: {
        approval_threshold_cents: 100000,
        auto_file_window_days: 14,
        deadline_lead_days: 45,
        escalation_hours: 48,
        default_mode: "auto",
      },
    });
    if (!error) {
      redirect("/dashboard");
    }
    if (error.code !== "23505") {
      return { ok: false as const, error: error.message };
    }
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return { ok: false as const, error: "Could not allocate a workspace slug." };
}
