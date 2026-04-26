import { PDFDocument, StandardFonts, rgb, PDFTextField, PDFCheckBox } from "pdf-lib";
import type { SupabaseClient } from "@supabase/supabase-js";

type FilingContext = {
  filing: {
    id: string;
    short_id: string;
    workspace_id: string;
    license_id: string;
    location_id: string;
    agency_id: string | null;
    fee_cents: number;
    stage: string;
  };
  workspace: { id: string; name: string; legal_entity: string | null; timezone: string };
  license: {
    id: string;
    license_type: string;
    license_number: string | null;
    issued_at: string | null;
    expires_at: string | null;
    fee_cents: number;
  };
  location: {
    id: string;
    name: string;
    address_line1: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
  agency: { id: string; code: string; name: string; portal_url: string | null } | null;
  template: {
    id: string;
    name: string;
    version: string;
    pdf_storage_path: string | null;
    field_mappings: Record<string, string>;
  } | null;
};

export type GeneratePacketResult =
  | { ok: true; documentId: string; storagePath: string; bytes: number; usedTemplate: boolean }
  | { ok: false; error: string };

export async function generatePacket(
  filingId: string,
  admin: SupabaseClient
): Promise<GeneratePacketResult> {

  const ctx = await loadContext(admin, filingId);
  if (!ctx.ok) return ctx;
  const c = ctx.context;

  let pdfBytes: Uint8Array;
  let usedTemplate = false;
  if (c.template?.pdf_storage_path) {
    try {
      pdfBytes = await fillTemplate(admin, c);
      usedTemplate = true;
    } catch (e) {
      console.error("[packet] template fill failed, falling back to synthetic:", e);
      pdfBytes = await synthesizePacket(c);
    }
  } else {
    pdfBytes = await synthesizePacket(c);
  }

  const storagePath = `${c.workspace.id}/packets/${c.filing.short_id}.pdf`;
  const upload = await admin.storage.from("documents").upload(storagePath, pdfBytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (upload.error) {
    return { ok: false, error: `upload: ${upload.error.message}` };
  }

  // Create a documents row for the packet (or update an existing one for re-runs).
  const docName = `${c.license.license_type} packet — ${c.filing.short_id}.pdf`;
  const { data: existing } = await admin
    .from("documents")
    .select("id")
    .eq("workspace_id", c.workspace.id)
    .eq("filing_id", c.filing.id)
    .eq("kind", "application")
    .maybeSingle();

  let documentId: string;
  if (existing) {
    const { error: upErr } = await admin
      .from("documents")
      .update({
        name: docName,
        mime_type: "application/pdf",
        size_bytes: pdfBytes.byteLength,
        storage_path: storagePath,
      })
      .eq("id", existing.id);
    if (upErr) return { ok: false, error: `documents update: ${upErr.message}` };
    documentId = existing.id as string;
  } else {
    const { data: inserted, error: insErr } = await admin
      .from("documents")
      .insert({
        workspace_id: c.workspace.id,
        location_id: c.location.id,
        license_id: c.license.id,
        filing_id: c.filing.id,
        name: docName,
        kind: "application",
        mime_type: "application/pdf",
        size_bytes: pdfBytes.byteLength,
        storage_path: storagePath,
      })
      .select("id")
      .single();
    if (insErr || !inserted) return { ok: false, error: `documents insert: ${insErr?.message ?? "unknown"}` };
    documentId = inserted.id as string;
  }

  // Advance filing stage intake → prep (no-op if already past prep).
  if (c.filing.stage === "intake") {
    const { error: fErr } = await admin
      .from("filings")
      .update({ stage: "prep" })
      .eq("id", c.filing.id);
    if (fErr) console.error("[packet] advance to prep failed:", fErr);
  }

  await admin.from("activity_log").insert({
    workspace_id: c.workspace.id,
    actor_label: "ClearBot",
    type: "prepared",
    title: `Packet generated for ${c.license.license_type}`,
    detail: `Filing ${c.filing.short_id} · ${(pdfBytes.byteLength / 1024).toFixed(0)} KB${usedTemplate ? " · from template" : " · synthetic"}`,
    metadata: { filing_short_id: c.filing.short_id, document_id: documentId, used_template: usedTemplate },
  });

  return { ok: true, documentId, storagePath, bytes: pdfBytes.byteLength, usedTemplate };
}

// ─── Internals ─────────────────────────────────────────────────────────────

async function loadContext(
  admin: SupabaseClient,
  filingId: string
): Promise<{ ok: true; context: FilingContext } | { ok: false; error: string }> {
  const { data: filing, error: fErr } = await admin
    .from("filings")
    .select("id, short_id, workspace_id, license_id, location_id, agency_id, fee_cents, stage")
    .eq("id", filingId)
    .maybeSingle();
  if (fErr || !filing) return { ok: false, error: `filing: ${fErr?.message ?? "not found"}` };

  const [{ data: workspace }, { data: license }, { data: location }, agency] = await Promise.all([
    admin
      .from("workspaces")
      .select("id, name, legal_entity, timezone")
      .eq("id", filing.workspace_id)
      .single(),
    admin
      .from("licenses")
      .select("id, license_type, license_number, issued_at, expires_at, fee_cents")
      .eq("id", filing.license_id)
      .single(),
    admin
      .from("locations")
      .select("id, name, address_line1, city, state, zip")
      .eq("id", filing.location_id)
      .single(),
    filing.agency_id
      ? admin
          .from("agencies")
          .select("id, code, name, portal_url")
          .eq("id", filing.agency_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!workspace || !license || !location) {
    return { ok: false, error: "missing workspace/license/location row" };
  }

  let template: FilingContext["template"] = null;
  if (filing.agency_id) {
    const { data: tpl } = await admin
      .from("form_templates")
      .select("id, name, version, pdf_storage_path, field_mappings")
      .eq("agency_id", filing.agency_id)
      .eq("license_type", license.license_type)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (tpl) {
      template = {
        id: tpl.id as string,
        name: tpl.name as string,
        version: tpl.version as string,
        pdf_storage_path: (tpl.pdf_storage_path as string | null) ?? null,
        field_mappings: (tpl.field_mappings as Record<string, string>) ?? {},
      };
    }
  }

  return {
    ok: true,
    context: {
      filing: filing as FilingContext["filing"],
      workspace: workspace as FilingContext["workspace"],
      license: license as FilingContext["license"],
      location: location as FilingContext["location"],
      agency: (agency.data as FilingContext["agency"]) ?? null,
      template,
    },
  };
}

function lookup(path: string, ctx: FilingContext): string {
  // "license.license_number", "location.name", "workspace.legal_entity",
  // "agency.code", "filing.short_id", or a literal string starting with "='".
  if (path.startsWith("='")) return path.slice(2, -1);
  const parts = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cursor: any = ctx;
  for (const p of parts) {
    if (cursor == null) return "";
    cursor = cursor[p];
  }
  if (cursor == null) return "";
  if (cursor instanceof Date) return cursor.toISOString().slice(0, 10);
  return String(cursor);
}

async function fillTemplate(admin: SupabaseClient, c: FilingContext): Promise<Uint8Array> {
  if (!c.template?.pdf_storage_path) throw new Error("no template storage path");
  const { data: blob, error } = await admin.storage
    .from("form-templates")
    .download(c.template.pdf_storage_path);
  if (error || !blob) throw new Error(`template download: ${error?.message ?? "no blob"}`);
  const arrayBuffer = await blob.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer);
  const form = pdf.getForm();

  for (const [fieldName, sourcePath] of Object.entries(c.template.field_mappings)) {
    let field;
    try {
      field = form.getField(fieldName);
    } catch {
      continue; // mapping references a field that doesn't exist — skip.
    }
    const value = lookup(sourcePath, c);
    if (field instanceof PDFTextField) {
      field.setText(value);
    } else if (field instanceof PDFCheckBox) {
      const truthy = value && value !== "false" && value !== "0";
      if (truthy) field.check();
      else field.uncheck();
    }
  }

  // Flatten so reviewers see the values as static text.
  try {
    form.flatten();
  } catch (e) {
    console.error("[packet] form flatten failed (non-fatal):", e);
  }

  return await pdf.save();
}

async function synthesizePacket(c: FilingContext): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${c.license.license_type} renewal — ${c.filing.short_id}`);
  pdf.setAuthor("ClearBot");
  pdf.setSubject(c.workspace.name);
  pdf.setProducer("ClearBot packet generator");
  pdf.setCreationDate(new Date());

  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const page = pdf.addPage([612, 792]); // US Letter
  const M = 54;
  let y = 792 - M;

  page.drawText("ClearBot — Filing Packet", { x: M, y, size: 18, font: helvBold, color: rgb(0.07, 0.09, 0.15) });
  y -= 8;
  page.drawLine({
    start: { x: M, y },
    end: { x: 612 - M, y },
    thickness: 0.7,
    color: rgb(0.85, 0.85, 0.88),
  });
  y -= 24;

  page.drawText(`Filing ${c.filing.short_id}`, { x: M, y, size: 12, font: helv, color: rgb(0.4, 0.43, 0.5) });
  y -= 16;
  page.drawText(`Generated ${new Date().toISOString().slice(0, 10)}`, {
    x: M,
    y,
    size: 10,
    font: helv,
    color: rgb(0.5, 0.53, 0.6),
  });
  y -= 30;

  const sections: Array<[string, Array<[string, string]>]> = [
    [
      "Workspace",
      [
        ["Operator", c.workspace.name],
        ["Legal entity", c.workspace.legal_entity ?? "—"],
      ],
    ],
    [
      "Location",
      [
        ["Name", c.location.name],
        [
          "Address",
          [c.location.address_line1, [c.location.city, c.location.state].filter(Boolean).join(", "), c.location.zip]
            .filter(Boolean)
            .join(" · ") || "—",
        ],
      ],
    ],
    [
      "License",
      [
        ["Type", c.license.license_type],
        ["Number", c.license.license_number ?? "—"],
        ["Issued", c.license.issued_at ?? "—"],
        ["Expires", c.license.expires_at ?? "—"],
        ["Renewal fee", `$${(c.filing.fee_cents / 100).toLocaleString()}`],
      ],
    ],
    [
      "Agency",
      [
        ["Code", c.agency?.code ?? "—"],
        ["Name", c.agency?.name ?? "—"],
        ["Portal", c.agency?.portal_url ?? "—"],
      ],
    ],
  ];

  for (const [title, rows] of sections) {
    page.drawText(title.toUpperCase(), { x: M, y, size: 9, font: helvBold, color: rgb(0.45, 0.48, 0.55) });
    y -= 14;
    for (const [k, v] of rows) {
      page.drawText(k, { x: M, y, size: 10, font: helv, color: rgb(0.5, 0.53, 0.6) });
      page.drawText(truncate(v, 70), {
        x: M + 110,
        y,
        size: 10,
        font: helvBold,
        color: rgb(0.07, 0.09, 0.15),
      });
      y -= 14;
    }
    y -= 8;
  }

  y -= 16;
  page.drawText("Authorization", { x: M, y, size: 9, font: helvBold, color: rgb(0.45, 0.48, 0.55) });
  y -= 16;
  const authText =
    "I certify that the information above is accurate and authorize ClearBot to submit this filing on my behalf.";
  for (const line of wrap(authText, 80)) {
    page.drawText(line, { x: M, y, size: 10, font: helv, color: rgb(0.07, 0.09, 0.15) });
    y -= 14;
  }
  y -= 28;
  page.drawLine({ start: { x: M, y }, end: { x: M + 220, y }, thickness: 0.7, color: rgb(0.4, 0.43, 0.5) });
  page.drawLine({ start: { x: M + 260, y }, end: { x: 612 - M, y }, thickness: 0.7, color: rgb(0.4, 0.43, 0.5) });
  y -= 12;
  page.drawText("Authorized signer", { x: M, y, size: 8, font: helv, color: rgb(0.5, 0.53, 0.6) });
  page.drawText("Date", { x: M + 260, y, size: 8, font: helv, color: rgb(0.5, 0.53, 0.6) });

  page.drawText("ClearBot · clearbot.io", {
    x: M,
    y: 36,
    size: 8,
    font: helv,
    color: rgb(0.6, 0.62, 0.68),
  });

  return await pdf.save();
}

function truncate(s: string, max: number) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

function wrap(s: string, max: number): string[] {
  const words = s.split(/\s+/);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > max) {
      if (cur) out.push(cur);
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) out.push(cur);
  return out;
}
