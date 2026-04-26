"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useDialog } from "@/components/ui/Dialog";
import { commitTemplatePdf, createTemplateUploadUrl, deleteTemplate, getTemplatePdfUrl, upsertTemplate } from "./actions";
import { createClient } from "@/lib/supabase/client";

export type AgencyOption = { id: string; code: string; name: string };
export type TemplateRow = {
  id: string;
  agency_id: string;
  license_type: string;
  name: string;
  version: string;
  has_pdf: boolean;
  field_mappings: Record<string, string>;
  notes: string | null;
  updated_at: string;
  agency_label: string;
};

const PLACEHOLDER_MAPPINGS = JSON.stringify(
  {
    Licensee_Name: "workspace.legal_entity",
    DBA: "workspace.name",
    License_Number: "license.license_number",
    Premise_Address: "location.address_line1",
    Premise_City: "location.city",
    Premise_State: "location.state",
    Premise_Zip: "location.zip",
    Renewal_Period_End: "license.expires_at",
  },
  null,
  2
);

export function TemplatesClient({ agencies, rows }: { agencies: AgencyOption[]; rows: TemplateRow[] }) {
  const router = useRouter();
  const dialog = useDialog();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<TemplateRow | null>(null);
  const [creating, setCreating] = useState(false);
  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <>
      <section className="flex justify-end">
        <button
          onClick={() => {
            setCreating(true);
            setEditing(null);
          }}
          className="rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep"
        >
          New template
        </button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
        <div className="hidden grid-cols-[1.4fr_1.4fr_0.6fr_0.6fr_0.7fr_1.4fr] items-center gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
          <div>Agency</div>
          <div>License type</div>
          <div>Version</div>
          <div>PDF</div>
          <div>Fields</div>
          <div className="text-right">Actions</div>
        </div>
        <ul className="divide-y divide-hairline">
          {rows.length === 0 && (
            <li className="px-5 py-12 text-center font-mono text-[12px] text-body">
              No templates yet — the packet generator falls back to synthetic PDFs.
            </li>
          )}
          {rows.map((t) => (
            <li
              key={t.id}
              className="grid grid-cols-1 gap-3 px-5 py-3 md:grid-cols-[1.4fr_1.4fr_0.6fr_0.6fr_0.7fr_1.4fr] md:items-center"
            >
              <div className="text-[13px] text-ink">{t.agency_label}</div>
              <div>
                <div className="text-[13px] font-medium text-ink">{t.license_type}</div>
                <div className="font-mono text-[10px] text-body">{t.name}</div>
              </div>
              <div className="font-mono text-[12px] text-body">{t.version}</div>
              <div className="font-mono text-[12px]">
                {t.has_pdf ? <span className="text-ok">attached</span> : <span className="text-warn">missing</span>}
              </div>
              <div className="font-mono text-[12px] tabular-nums text-body">{Object.keys(t.field_mappings).length}</div>
              <div className="flex items-center justify-end gap-2">
                {t.has_pdf && (
                  <button
                    onClick={async () => {
                      const r = await getTemplatePdfUrl(t.id);
                      if (!r.ok) {
                        await dialog.alert({ title: "Could not open PDF", body: r.error, tone: "danger" });
                      } else {
                        window.open(r.url, "_blank", "noopener,noreferrer");
                      }
                    }}
                    className="rounded-md border border-hairline bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink"
                  >
                    View PDF
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditing(t);
                    setCreating(false);
                  }}
                  className="rounded-md border border-hairline bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    const ok = await dialog.confirm({
                      title: "Delete template?",
                      body: `${t.agency_label} · ${t.license_type} ${t.version}. Existing filings keep their generated packets.`,
                      tone: "danger",
                      confirmLabel: "Delete",
                    });
                    if (!ok) return;
                    const r = await deleteTemplate(t.id);
                    if (!r.ok) {
                      await dialog.alert({ title: "Delete failed", body: r.error, tone: "danger" });
                    } else {
                      dialog.toast({ body: "Template deleted." });
                      refresh();
                    }
                  }}
                  className="rounded-md border border-hairline bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-body hover:text-bad"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {(editing || creating) && (
        <TemplateEditor
          agencies={agencies}
          template={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            refresh();
          }}
        />
      )}
    </>
  );
}

function TemplateEditor({
  agencies,
  template,
  onClose,
  onSaved,
}: {
  agencies: AgencyOption[];
  template: TemplateRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialog = useDialog();
  const fileRef = useRef<HTMLInputElement>(null);
  const [agencyId, setAgencyId] = useState(template?.agency_id ?? agencies[0]?.id ?? "");
  const [licenseType, setLicenseType] = useState(template?.license_type ?? "");
  const [name, setName] = useState(template?.name ?? "");
  const [version, setVersion] = useState(template?.version ?? "v1");
  const [notes, setNotes] = useState(template?.notes ?? "");
  const [mappings, setMappings] = useState(
    template ? JSON.stringify(template.field_mappings, null, 2) : PLACEHOLDER_MAPPINGS
  );
  const [savedId, setSavedId] = useState<string | null>(template?.id ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <div className="w-full max-w-[640px] rounded-2xl border border-hairline bg-white p-5 shadow-2xl">
        <div className="font-display text-[20px] font-light text-ink">
          {template ? "Edit template" : "New template"}
        </div>
        <p className="mt-1 text-[13px] text-body">
          The PDF goes to the private form-templates bucket. Field mappings tell the packet generator how to fill it.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            setError(null);
            const r = await upsertTemplate({
              id: savedId,
              agencyId,
              licenseType,
              name: name || licenseType,
              version,
              fieldMappingsJson: mappings,
              notes,
            });
            setSaving(false);
            if (!r.ok) {
              setError(r.error);
              return;
            }
            setSavedId(r.id);
            dialog.toast({ body: "Template saved. Attach a PDF or close." });
          }}
          className="mt-4 grid gap-3"
        >
          <Field label="Agency">
            <select
              required
              value={agencyId}
              onChange={(e) => setAgencyId(e.target.value)}
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
            >
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} — {a.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="License type">
              <input
                required
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                placeholder="Liquor License"
                className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
              />
            </Field>
            <Field label="Version">
              <input
                required
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
              />
            </Field>
          </div>
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Defaults to the license type."
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
            />
          </Field>
          <Field label="Field mappings (JSON)" help='Keys = AcroForm field names in the PDF. Values = "license.license_number", "location.name", "workspace.legal_entity", "agency.code", "filing.short_id", or a literal "=&apos;text&apos;".'>
            <textarea
              value={mappings}
              onChange={(e) => setMappings(e.target.value)}
              rows={10}
              spellCheck={false}
              className="w-full rounded-md border border-hairline bg-bgalt/30 px-3 py-2 font-mono text-[12px] outline-none focus:border-accent"
            />
          </Field>
          <Field label="Notes">
            <input
              value={notes ?? ""}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-[13px] outline-none focus:border-accent"
            />
          </Field>
          {error && (
            <div className="rounded-md border border-bad/30 bg-bad/5 px-3 py-2 text-[12px] text-bad">{error}</div>
          )}

          {savedId && (
            <Field label="PDF" help="Pick a PDF; we'll upload and attach it to this template.">
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept="application/pdf" className="text-[12px]" />
                <button
                  type="button"
                  onClick={async () => {
                    const f = fileRef.current?.files?.[0];
                    if (!f) {
                      await dialog.alert({ title: "Pick a file first" });
                      return;
                    }
                    // 1. Ask the server for a signed upload URL.
                    const signed = await createTemplateUploadUrl({
                      templateId: savedId,
                      fileName: f.name,
                    });
                    if (!signed.ok) {
                      await dialog.alert({ title: "Could not start upload", body: signed.error, tone: "danger" });
                      return;
                    }
                    // 2. Upload the file directly to Supabase Storage with the
                    //    one-time token. Avoids the 1MB Server Action limit.
                    const supabase = createClient();
                    const up = await supabase.storage
                      .from("form-templates")
                      .uploadToSignedUrl(signed.storagePath, signed.token, f, {
                        contentType: f.type || "application/pdf",
                        upsert: true,
                      });
                    if (up.error) {
                      await dialog.alert({ title: "Upload failed", body: up.error.message, tone: "danger" });
                      return;
                    }
                    // 3. Commit the storage path to the template row.
                    const commit = await commitTemplatePdf({
                      templateId: savedId,
                      storagePath: signed.storagePath,
                    });
                    if (!commit.ok) {
                      await dialog.alert({ title: "Could not attach PDF", body: commit.error, tone: "danger" });
                    } else {
                      dialog.toast({ body: "PDF attached." });
                    }
                  }}
                  className="rounded-md border border-accent bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white hover:bg-accent-deep"
                >
                  Upload PDF
                </button>
              </div>
            </Field>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md border border-accent bg-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white hover:bg-accent-deep disabled:opacity-70"
            >
              {saving ? "Saving…" : savedId ? "Save changes" : "Save"}
            </button>
            {savedId && (
              <button
                type="button"
                onClick={onSaved}
                className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
              >
                Done
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-body">{label}</span>
      {children}
      {help && <span className="mt-1 block text-[11px] text-body">{help}</span>}
    </label>
  );
}
