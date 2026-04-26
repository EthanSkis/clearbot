import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { SupabaseClient } from "@supabase/supabase-js";

// Generates a generic limited Power-of-Attorney granting ClearBot the
// authority to file licensing renewals on behalf of the workspace's
// authorized signer for a single agency.
//
// IMPORTANT: this is a *starting point*, not a legally vetted POA. Every
// agency rejects different language. Before you ship this to a real
// agency portal, get the customer's lawyer to redline the body for that
// specific jurisdiction — most state ABCs have their own POA form.

type PoaContext = {
  workspace: { id: string; name: string; legal_entity: string | null };
  agency: { id: string; code: string; name: string };
  signer: { name: string; title: string | null; email: string };
  effectiveDate: Date;
  expiresDate: Date;
};

export type GeneratePoaResult =
  | { ok: true; documentId: string; storagePath: string; bytes: number }
  | { ok: false; error: string };

export async function generatePoa(
  input: {
    workspaceId: string;
    agencyId: string;
    signerName: string;
    signerTitle?: string | null;
    signerEmail: string;
    durationDays?: number;
  },
  admin: SupabaseClient
): Promise<GeneratePoaResult> {
  const [{ data: workspace }, { data: agency }] = await Promise.all([
    admin
      .from("workspaces")
      .select("id, name, legal_entity")
      .eq("id", input.workspaceId)
      .maybeSingle(),
    admin
      .from("agencies")
      .select("id, code, name")
      .eq("id", input.agencyId)
      .maybeSingle(),
  ]);
  if (!workspace) return { ok: false, error: "workspace not found" };
  if (!agency) return { ok: false, error: "agency not found" };

  const effective = new Date();
  const expires = new Date(effective.getTime() + (input.durationDays ?? 365) * 86_400_000);

  const ctx: PoaContext = {
    workspace: workspace as PoaContext["workspace"],
    agency: agency as PoaContext["agency"],
    signer: {
      name: input.signerName.trim(),
      title: input.signerTitle?.trim() ?? null,
      email: input.signerEmail.trim(),
    },
    effectiveDate: effective,
    expiresDate: expires,
  };

  const pdfBytes = await renderPoaPdf(ctx);

  const safeAgency = ctx.agency.code.replace(/[^a-z0-9_-]+/gi, "_");
  const storagePath = `${ctx.workspace.id}/poa/${safeAgency}-${Date.now()}.pdf`;
  const upload = await admin.storage.from("documents").upload(storagePath, pdfBytes, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (upload.error) return { ok: false, error: `upload: ${upload.error.message}` };

  const { data: inserted, error: insErr } = await admin
    .from("documents")
    .insert({
      workspace_id: ctx.workspace.id,
      name: `Power of Attorney — ${ctx.agency.code}.pdf`,
      kind: "correspondence",
      mime_type: "application/pdf",
      size_bytes: pdfBytes.byteLength,
      storage_path: storagePath,
    })
    .select("id")
    .single();
  if (insErr || !inserted) {
    return { ok: false, error: `documents insert: ${insErr?.message ?? "unknown"}` };
  }

  await admin.from("activity_log").insert({
    workspace_id: ctx.workspace.id,
    actor_label: "ClearBot",
    type: "document",
    title: `Power of Attorney generated for ${ctx.agency.code}`,
    detail: `Effective ${effective.toISOString().slice(0, 10)} · expires ${expires.toISOString().slice(0, 10)}`,
    metadata: {
      document_id: inserted.id,
      agency_id: ctx.agency.id,
      signer_email: ctx.signer.email,
    },
  });

  return {
    ok: true,
    documentId: inserted.id as string,
    storagePath,
    bytes: pdfBytes.byteLength,
  };
}

// ─── PDF rendering ──────────────────────────────────────────────────

async function renderPoaPdf(ctx: PoaContext): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Power of Attorney — ${ctx.agency.code}`);
  pdf.setAuthor("ClearBot");
  pdf.setSubject(ctx.workspace.name);
  pdf.setProducer("ClearBot POA generator");
  pdf.setCreationDate(ctx.effectiveDate);

  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([612, 792]); // US Letter
  const M = 72;
  let y = 792 - M;

  page.drawText("LIMITED POWER OF ATTORNEY", {
    x: M,
    y,
    size: 16,
    font: helvBold,
    color: rgb(0.07, 0.09, 0.15),
  });
  y -= 6;
  page.drawLine({
    start: { x: M, y },
    end: { x: 612 - M, y },
    thickness: 0.7,
    color: rgb(0.85, 0.85, 0.88),
  });
  y -= 22;

  const principal = ctx.workspace.legal_entity?.trim() || ctx.workspace.name;
  const introParas: string[] = [
    `KNOW ALL PERSONS BY THESE PRESENTS, that ${principal} (the "Principal"), through its authorized signer, hereby designates ClearBot, Inc. (the "Agent") as its attorney-in-fact for the limited purposes set forth below.`,
    `1. Scope. The Agent is authorized to prepare, sign, and submit licensing renewals, applications, and supporting documentation to ${ctx.agency.name} (${ctx.agency.code}) (the "Agency") on behalf of the Principal, including (a) electronic submissions through the Agency's portal, (b) payment of statutory fees from accounts the Principal designates, and (c) receipt of confirmations, receipts, and correspondence from the Agency.`,
    `2. Limitations. This authority is strictly limited to licensing matters with the Agency. The Agent has no authority to (a) admit liability on the Principal's behalf, (b) enter into substantive litigation, (c) waive any statutory or constitutional rights, or (d) bind the Principal to obligations beyond the renewal fees and standard application terms.`,
    `3. Records. The Agent shall retain copies of every submitted application, every fee receipt, and every Agency confirmation, and shall make those records available to the Principal on request.`,
    `4. Effective Period. This Power of Attorney is effective on ${formatDate(ctx.effectiveDate)} and automatically expires on ${formatDate(ctx.expiresDate)}, unless terminated earlier by written notice from the Principal.`,
    `5. Revocation. The Principal may revoke this Power of Attorney at any time by written notice to the Agent at legal@clearbot.io. Revocation does not affect the validity of acts performed by the Agent in good faith before receipt of the notice.`,
    `6. Severability. If any provision of this instrument is held unenforceable, the remaining provisions shall continue in full force.`,
  ];

  page.drawText("PRINCIPAL", { x: M, y, size: 9, font: helvBold, color: rgb(0.45, 0.48, 0.55) });
  y -= 14;
  page.drawText(principal, { x: M, y, size: 11, font: helvBold, color: rgb(0.07, 0.09, 0.15) });
  y -= 14;
  page.drawText(`Workspace: ${ctx.workspace.name}`, {
    x: M,
    y,
    size: 10,
    font: helv,
    color: rgb(0.4, 0.43, 0.5),
  });
  y -= 22;

  for (const para of introParas) {
    for (const line of wrap(para, 88)) {
      page.drawText(line, { x: M, y, size: 10, font: helv, color: rgb(0.15, 0.18, 0.25) });
      y -= 13;
    }
    y -= 6;
  }

  if (y < 200) {
    // overflow guard — push signature block to a new page if needed.
    const page2 = pdf.addPage([612, 792]);
    drawSignatureBlock(page2, helv, helvBold, ctx, 792 - M);
  } else {
    drawSignatureBlock(page, helv, helvBold, ctx, y);
  }

  return await pdf.save();
}

function drawSignatureBlock(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  helv: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  helvBold: any,
  ctx: PoaContext,
  startY: number
) {
  const M = 72;
  let y = startY;
  page.drawText("AUTHORIZED SIGNER", {
    x: M,
    y,
    size: 9,
    font: helvBold,
    color: rgb(0.45, 0.48, 0.55),
  });
  y -= 26;
  page.drawLine({
    start: { x: M, y },
    end: { x: M + 260, y },
    thickness: 0.7,
    color: rgb(0.4, 0.43, 0.5),
  });
  page.drawLine({
    start: { x: M + 300, y },
    end: { x: M + 460, y },
    thickness: 0.7,
    color: rgb(0.4, 0.43, 0.5),
  });
  y -= 12;
  page.drawText("Signature", { x: M, y, size: 8, font: helv, color: rgb(0.5, 0.53, 0.6) });
  page.drawText("Date", { x: M + 300, y, size: 8, font: helv, color: rgb(0.5, 0.53, 0.6) });
  y -= 22;
  page.drawText(ctx.signer.name, {
    x: M,
    y,
    size: 11,
    font: helvBold,
    color: rgb(0.07, 0.09, 0.15),
  });
  y -= 13;
  if (ctx.signer.title) {
    page.drawText(ctx.signer.title, { x: M, y, size: 10, font: helv, color: rgb(0.4, 0.43, 0.5) });
    y -= 13;
  }
  page.drawText(ctx.signer.email, { x: M, y, size: 10, font: helv, color: rgb(0.4, 0.43, 0.5) });
  y -= 30;
  page.drawText(`For: ${ctx.agency.name} (${ctx.agency.code})`, {
    x: M,
    y,
    size: 10,
    font: helvBold,
    color: rgb(0.07, 0.09, 0.15),
  });
  y -= 13;
  page.drawText(
    `Effective ${formatDate(ctx.effectiveDate)} · expires ${formatDate(ctx.expiresDate)}`,
    {
      x: M,
      y,
      size: 9,
      font: helv,
      color: rgb(0.5, 0.53, 0.6),
    }
  );
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
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
