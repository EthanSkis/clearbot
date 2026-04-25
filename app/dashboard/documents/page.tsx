import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireContext } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";
import { DocumentsClient, type DocumentRow } from "./DocumentsClient";

export const metadata: Metadata = { title: "Documents · ClearBot" };
export const dynamic = "force-dynamic";

const STORAGE_QUOTA_GB: Record<string, number> = {
  essential: 25,
  standard: 50,
  professional: 100,
};

export default async function DocumentsPage() {
  const ctx = await requireContext();
  const supabase = createClient();

  const { data, count } = await supabase
    .from("documents")
    .select(
      "id, name, kind, size_bytes, storage_path, created_at, location:location_id(name, city, state), license:license_id(license_type)",
      { count: "exact" }
    )
    .eq("workspace_id", ctx.workspace.id)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as DocumentRow[];
  const totalBytes = rows.reduce((s, r) => s + r.size_bytes, 0);
  const usedGb = totalBytes / 1024 / 1024 / 1024;
  const quota = STORAGE_QUOTA_GB[ctx.workspace.plan] ?? 25;

  return (
    <>
      <PageHeader
        eyebrow={`${count ?? 0} document${count === 1 ? "" : "s"} · ${usedGb.toFixed(2)} GB`}
        title={
          <>
            Every filing, <span className="italic">forever.</span>
          </>
        }
        subtitle="AES-256 at rest. Per-tenant isolation. Signed URLs for retrieval."
      />

      <DocumentsClient rows={rows} workspaceId={ctx.workspace.id} storageQuotaGb={quota} />
    </>
  );
}
