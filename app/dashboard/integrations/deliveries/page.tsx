import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { requireContext } from "@/lib/workspace";
import { createAdminClient } from "@/lib/supabase/admin";
import { DeliveriesClient, type DeliveryRow } from "./DeliveriesClient";

export const metadata: Metadata = { title: "Webhook deliveries · ClearBot" };
export const dynamic = "force-dynamic";

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams?: { status?: string; webhook?: string };
}) {
  const ctx = await requireContext();
  const admin = createAdminClient();

  const statusFilter = searchParams?.status ?? null;
  const webhookFilter = searchParams?.webhook ?? null;

  let q = admin
    .from("webhook_deliveries")
    .select(
      "id, webhook_id, event, status, attempts, max_attempts, next_retry_at, last_response_status, last_error, delivered_at, created_at," +
        " webhook:webhook_id(url, description)"
    )
    .eq("workspace_id", ctx.workspace.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (statusFilter) q = q.eq("status", statusFilter);
  if (webhookFilter) q = q.eq("webhook_id", webhookFilter);
  const { data, error } = await q;

  type Row = {
    id: string;
    webhook_id: string;
    event: string;
    status: DeliveryRow["status"];
    attempts: number;
    max_attempts: number;
    next_retry_at: string;
    last_response_status: number | null;
    last_error: string | null;
    delivered_at: string | null;
    created_at: string;
    webhook: { url: string; description: string | null } | null;
  };
  const rows: DeliveryRow[] = ((data ?? []) as unknown as Row[]).map((d) => ({
    id: d.id,
    webhook_id: d.webhook_id,
    webhook_url: d.webhook?.url ?? "—",
    webhook_description: d.webhook?.description ?? null,
    event: d.event,
    status: d.status,
    attempts: d.attempts,
    max_attempts: d.max_attempts,
    next_retry_at: d.next_retry_at,
    last_response_status: d.last_response_status,
    last_error: d.last_error,
    delivered_at: d.delivered_at,
    created_at: d.created_at,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Outbound · HMAC-signed · Auto-retried"
        title={
          <>
            Webhook <span className="italic">deliveries.</span>
          </>
        }
        subtitle="Per-delivery audit trail. Replay anything pending or failed; drop a delivery to stop retries."
        actions={
          <Link
            href="/dashboard/integrations"
            className="rounded-full border border-hairline bg-white px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
          >
            Back to integrations
          </Link>
        }
      />
      <DeliveriesClient
        rows={rows}
        error={error?.message ?? null}
        statusFilter={statusFilter}
      />
    </>
  );
}
