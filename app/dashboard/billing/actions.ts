"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canAdmin, requireContext } from "@/lib/workspace";
import { logActivity } from "@/lib/activity";

type Result = { ok: true } | { ok: false; error: string };

// Annual contract price per location, in cents. Marketing pricing page
// is the source of truth: $500 / $800 / $1,200 per loc/yr.
const ANNUAL_CENTS_PER_LOC: Record<string, number> = {
  essential: 50000,
  standard: 80000,
  professional: 120000,
};

export async function changePlan(plan: "essential" | "standard" | "professional"): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) {
    return { ok: false, error: "Only owners and admins can change the plan." };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("workspaces")
    .update({ plan })
    .eq("id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "payment",
    title: `Switched plan to ${plan}`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function generateMonthlyInvoice(): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role) && ctx.membership.role !== "finance") {
    return { ok: false, error: "Finance, admins, or owners only." };
  }
  const supabase = createClient();
  const { count: locations } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", ctx.workspace.id)
    .eq("status", "active");

  // Monthly invoice = 1/12 of the annual contract for that month's
  // active location count. (Annual cents come from ANNUAL_CENTS_PER_LOC.)
  const annualPerLoc = ANNUAL_CENTS_PER_LOC[ctx.workspace.plan] ?? 50000;
  const annualTotal = (locations ?? 0) * annualPerLoc;
  const amount = Math.round(annualTotal / 12);

  const today = new Date();
  const periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const periodIso = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, "0")}`;
  const shortId = `INV-${periodStart.getFullYear()}${String(periodStart.getMonth() + 1).padStart(2, "0")}`;

  const { error } = await supabase.from("invoices").insert({
    workspace_id: ctx.workspace.id,
    short_id: shortId,
    period_label: periodIso,
    period_start: periodStart.toISOString().slice(0, 10),
    period_end: periodEnd.toISOString().slice(0, 10),
    amount_cents: amount,
    status: "pending",
    method: "wire",
  });
  if (error && error.code !== "23505") return { ok: false, error: error.message };
  revalidatePath("/dashboard/billing");
  return { ok: true };
}

export async function markInvoicePaid(invoiceId: string): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role) && ctx.membership.role !== "finance") {
    return { ok: false, error: "Finance, admins, or owners only." };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "payment",
    title: `Invoice ${invoiceId.slice(0, 8)} marked paid`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/billing");
  return { ok: true };
}

export async function addPaymentMethod(input: {
  kind: "wire" | "ach" | "card";
  label: string;
  last4?: string;
  primary?: boolean;
}): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role) && ctx.membership.role !== "finance") {
    return { ok: false, error: "Finance, admins, or owners only." };
  }
  const supabase = createClient();
  if (input.primary) {
    await supabase
      .from("payment_methods")
      .update({ is_primary: false })
      .eq("workspace_id", ctx.workspace.id);
  }
  const { error } = await supabase.from("payment_methods").insert({
    workspace_id: ctx.workspace.id,
    kind: input.kind,
    label: input.label,
    last4: input.last4 ?? null,
    is_primary: input.primary ?? false,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/billing");
  return { ok: true };
}

export async function deletePaymentMethod(id: string): Promise<Result> {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role) && ctx.membership.role !== "finance") {
    return { ok: false, error: "Finance, admins, or owners only." };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("payment_methods")
    .delete()
    .eq("id", id)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/billing");
  return { ok: true };
}
