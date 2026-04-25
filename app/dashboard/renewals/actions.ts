"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireContext } from "@/lib/workspace";
import { logActivity } from "@/lib/activity";

type Result<T = undefined> = ({ ok: true } & (T extends undefined ? object : T)) | { ok: false; error: string };

export async function createLicense(input: {
  locationId: string;
  agencyId?: string | null;
  licenseType: string;
  licenseNumber?: string;
  expiresAt: string;
  issuedAt?: string;
  cycleDays?: number;
  feeCents?: number;
  automationMode?: "alert" | "prep" | "auto";
  notes?: string;
}): Promise<Result> {
  const ctx = await requireContext();
  const supabase = createClient();
  const licenseType = input.licenseType.trim();
  if (!licenseType || !input.locationId || !input.expiresAt) {
    return { ok: false, error: "License type, location, and expiry are required." };
  }
  const { error } = await supabase.from("licenses").insert({
    workspace_id: ctx.workspace.id,
    location_id: input.locationId,
    agency_id: input.agencyId || null,
    license_type: licenseType,
    license_number: input.licenseNumber?.trim() || null,
    issued_at: input.issuedAt || null,
    expires_at: input.expiresAt,
    cycle_days: input.cycleDays ?? 365,
    fee_cents: input.feeCents ?? 0,
    automation_mode: input.automationMode ?? "auto",
    notes: input.notes?.trim() || null,
    status: "active",
  });
  if (error) return { ok: false, error: error.message };
  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "agency",
    title: `Added license · ${licenseType}`,
    detail: `Renewal scheduled ${input.expiresAt}`,
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/renewals");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setAutomationMode(licenseId: string, mode: "alert" | "prep" | "auto"): Promise<Result> {
  const ctx = await requireContext();
  const supabase = createClient();
  const { error } = await supabase
    .from("licenses")
    .update({ automation_mode: mode })
    .eq("id", licenseId)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/renewals");
  return { ok: true };
}

export async function markRenewalFiled(licenseId: string, options: {
  feeCents?: number;
  confirmationNumber?: string;
}): Promise<Result> {
  const ctx = await requireContext();
  const supabase = createClient();

  const { data: license } = await supabase
    .from("licenses")
    .select("id,location_id,agency_id,license_type,cycle_days,fee_cents,expires_at,automation_mode")
    .eq("id", licenseId)
    .eq("workspace_id", ctx.workspace.id)
    .maybeSingle();
  if (!license) return { ok: false, error: "License not found." };

  const cycleDays = license.cycle_days ?? 365;
  const newExpiry = license.expires_at
    ? new Date(new Date(license.expires_at as string).getTime() + cycleDays * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + cycleDays * 24 * 60 * 60 * 1000);

  const { data: idRow } = await supabase.rpc("next_filing_short_id", { wsid: ctx.workspace.id });
  const shortId = (idRow as string) || `CB-${Date.now()}`;

  const { error: filingErr } = await supabase.from("filings").insert({
    workspace_id: ctx.workspace.id,
    license_id: license.id,
    location_id: license.location_id,
    agency_id: license.agency_id,
    short_id: shortId,
    stage: "confirm",
    mode: license.automation_mode,
    fee_cents: options.feeCents ?? license.fee_cents,
    filed_at: new Date().toISOString(),
    cycle_days_taken: 1,
    confirmation_number: options.confirmationNumber || null,
    owner_id: ctx.user.id,
    status: "confirmed",
  });
  if (filingErr) return { ok: false, error: filingErr.message };

  const { error: updErr } = await supabase
    .from("licenses")
    .update({ expires_at: newExpiry.toISOString().slice(0, 10), status: "active" })
    .eq("id", license.id);
  if (updErr) return { ok: false, error: updErr.message };

  await logActivity({
    workspaceId: ctx.workspace.id,
    type: "filed",
    title: `${license.license_type} filed`,
    detail: options.confirmationNumber ? `Confirmation ${options.confirmationNumber}` : "Manual file",
    actorLabel: ctx.user.fullName ?? ctx.user.email,
  });
  revalidatePath("/dashboard/renewals");
  revalidatePath("/dashboard/filings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteLicense(licenseId: string): Promise<Result> {
  const ctx = await requireContext();
  const supabase = createClient();
  const { error } = await supabase
    .from("licenses")
    .delete()
    .eq("id", licenseId)
    .eq("workspace_id", ctx.workspace.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/renewals");
  return { ok: true };
}

export async function exportIcs(): Promise<{ ok: true; ics: string }> {
  const ctx = await requireContext();
  const supabase = createClient();
  const { data } = await supabase
    .from("licenses")
    .select("id, license_type, expires_at, locations:location_id(name,city,state)")
    .eq("workspace_id", ctx.workspace.id)
    .order("expires_at", { ascending: true });

  const events =
    data?.map((row) => {
      const exp = row.expires_at ? new Date(row.expires_at as string) : null;
      if (!exp) return "";
      const yyyymmdd = exp.toISOString().slice(0, 10).replace(/-/g, "");
      const loc = row.locations as unknown as { name: string; city: string; state: string } | null;
      const summary = `Renewal · ${row.license_type}`;
      const description = loc ? `${loc.name} — ${loc.city}, ${loc.state}` : "";
      return [
        "BEGIN:VEVENT",
        `UID:${row.id}@clearbot`,
        `DTSTAMP:${yyyymmdd}T000000Z`,
        `DTSTART;VALUE=DATE:${yyyymmdd}`,
        `DTEND;VALUE=DATE:${yyyymmdd}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        "END:VEVENT",
      ].join("\r\n");
    }).filter(Boolean) ?? [];

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ClearBot//Renewals//EN",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
  return { ok: true, ics };
}
