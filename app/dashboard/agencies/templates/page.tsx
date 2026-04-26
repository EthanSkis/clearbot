import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { canAdmin, requireContext } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";
import { TemplatesClient, type AgencyOption, type TemplateRow } from "./TemplatesClient";

export const metadata: Metadata = { title: "Form templates · ClearBot" };
export const dynamic = "force-dynamic";

export default async function FormTemplatesPage() {
  const ctx = await requireContext();
  if (!canAdmin(ctx.membership.role)) {
    return (
      <>
        <PageHeader
          eyebrow="Form templates"
          title="Admins only"
          subtitle="Templates back the packet generator. Ask a workspace admin to manage them."
        />
        <Link
          href="/dashboard/agencies"
          className="inline-block rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
        >
          ← Back to agencies
        </Link>
      </>
    );
  }
  const supabase = createClient();
  const [{ data: agencies }, { data: templates }] = await Promise.all([
    supabase.from("agencies").select("id, code, name").order("code", { ascending: true }),
    supabase
      .from("form_templates")
      .select(
        "id, agency_id, license_type, name, version, pdf_storage_path, field_mappings, notes, updated_at, agency:agency_id(code, name)"
      )
      .order("updated_at", { ascending: false }),
  ]);

  const agencyOptions: AgencyOption[] = (agencies ?? []).map((a) => ({
    id: a.id as string,
    code: a.code as string,
    name: a.name as string,
  }));
  const rows: TemplateRow[] = (templates ?? []).map((t) => ({
    id: t.id as string,
    agency_id: t.agency_id as string,
    license_type: t.license_type as string,
    name: t.name as string,
    version: t.version as string,
    has_pdf: Boolean(t.pdf_storage_path),
    field_mappings: (t.field_mappings as Record<string, string>) ?? {},
    notes: (t.notes as string | null) ?? null,
    updated_at: t.updated_at as string,
    agency_label: (() => {
      const a = t.agency as unknown as { code: string; name: string } | null;
      return a ? `${a.code} — ${a.name}` : "—";
    })(),
  }));

  return (
    <>
      <PageHeader
        eyebrow={`Form templates · ${rows.length}`}
        title={
          <>
            Per-agency PDFs, <span className="italic">field-mapped.</span>
          </>
        }
        subtitle="Upload the agency's PDF, declare which fields map to which workspace data, and the worker fills it on every renewal."
        actions={
          <Link
            href="/dashboard/agencies"
            className="rounded-md border border-hairline bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
          >
            ← Agencies
          </Link>
        }
      />
      <TemplatesClient agencies={agencyOptions} rows={rows} />
    </>
  );
}
