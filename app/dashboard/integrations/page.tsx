import type { Metadata } from "next";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { canAdmin, requireContext } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/server";
import {
  ApiKeysManager,
  IntegrationsGrid,
  WebhooksManager,
  type ApiKeyRow,
  type IntegrationCardData,
  type IntegrationStatus,
  type WebhookRow,
} from "./IntegrationsClient";

export const metadata: Metadata = { title: "Integrations · ClearBot" };
export const dynamic = "force-dynamic";

const CATALOG: { provider: string; category: string; detail: string }[] = [
  { provider: "Toast", category: "POS", detail: "Sync your locations and ownership records." },
  { provider: "Square", category: "POS", detail: "Pull locations and operating status." },
  { provider: "NetSuite", category: "ERP", detail: "Route AP and reconcile fees." },
  { provider: "QuickBooks", category: "Accounting", detail: "Mirror invoices and payments." },
  { provider: "Sage Intacct", category: "Accounting", detail: "Route fee payments through AP." },
  { provider: "Workday", category: "HRIS", detail: "Sync org changes to workspace roles." },
  { provider: "Rippling", category: "HRIS", detail: "Auto-update location managers." },
  { provider: "Okta", category: "Identity", detail: "SSO + SCIM for enterprise control." },
  { provider: "Google Workspace", category: "Identity", detail: "Calendar invites + email alerts." },
  { provider: "Slack", category: "Alerts", detail: "Channel-routed deadline alerts." },
  { provider: "Microsoft Teams", category: "Alerts", detail: "Same alerts, on Teams." },
  { provider: "Zapier", category: "Other", detail: "Trigger from any license state change." },
];

export default async function IntegrationsPage() {
  const ctx = await requireContext();
  const supabase = createClient();

  const [
    { data: integrationRows },
    { data: webhookRows },
    { data: apiKeyRows },
  ] = await Promise.all([
    supabase
      .from("integrations")
      .select("id, provider, category, status, config, last_synced_at")
      .eq("workspace_id", ctx.workspace.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("webhooks")
      .select("id, url, event, last_fired_at, last_status")
      .eq("workspace_id", ctx.workspace.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("api_keys")
      .select("id, name, key_prefix, scope, created_at, last_used_at, revoked_at")
      .eq("workspace_id", ctx.workspace.id)
      .order("created_at", { ascending: false }),
  ]);

  const byProvider = new Map(
    (integrationRows ?? []).map((row) => [row.provider as string, row])
  );

  const cards: IntegrationCardData[] = CATALOG.map((c) => {
    const live = byProvider.get(c.provider);
    if (!live || live.status === "disconnected") {
      return {
        id: live?.id ?? null,
        provider: c.provider,
        category: c.category,
        status: "available",
        detail: c.detail,
      };
    }
    return {
      id: live.id,
      provider: c.provider,
      category: c.category,
      status: live.status as IntegrationStatus,
      detail: c.detail,
      last_synced_at: live.last_synced_at,
    };
  });

  const connected = cards.filter((c) => c.status === "connected" || c.status === "syncing" || c.status === "error");
  const available = cards.filter((c) => c.status === "available" || c.status === "disconnected");

  const eventsLastDay = (webhookRows ?? []).filter((w) => {
    if (!w.last_fired_at) return false;
    return Date.now() - new Date(w.last_fired_at as string).getTime() < 86_400_000;
  }).length;

  return (
    <>
      <PageHeader
        eyebrow={`${connected.length} connected · ${available.length} available`}
        title={
          <>
            Plugs into the systems <span className="italic">you already run.</span>
          </>
        }
        subtitle="Locations from your POS or ERP. Fees routed through your AP. Alerts in the channels your team already uses."
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Connected" value={String(connected.length)} sub={`across ${new Set(connected.map((c) => c.category)).size} categories`} />
        <Stat label="Webhook deliveries (24h)" value={String(eventsLastDay)} sub="includes test events" />
        <Stat label="Webhook endpoints" value={String((webhookRows ?? []).length)} sub="signed with HMAC SHA-256" />
        <Stat label="API keys" value={String((apiKeyRows ?? []).filter((k) => !k.revoked_at).length)} sub={`${(apiKeyRows ?? []).filter((k) => k.scope === "read").length} read-only`} />
      </section>

      <section>
        <SectionHeader title="Connected" subtitle="Click Disconnect to stop syncing or Sync to refresh now." />
        <div className="mt-4">
          <IntegrationsGrid connected={connected} available={[]} />
        </div>
      </section>

      <section>
        <SectionHeader title="Catalog" subtitle="One-click setup for every provider in the catalog." />
        <div className="mt-4">
          <IntegrationsGrid connected={[]} available={available} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <SectionHeader title="Webhooks" subtitle="Subscribe to license state changes." />
          <div className="mt-4">
            <WebhooksManager rows={(webhookRows ?? []) as unknown as WebhookRow[]} />
          </div>
        </div>
        <div>
          <SectionHeader title="API keys" subtitle="REST + GraphQL · OAuth-protected." />
          <div className="mt-4">
            <ApiKeysManager
              rows={(apiKeyRows ?? []) as unknown as ApiKeyRow[]}
              canManage={canAdmin(ctx.membership.role)}
            />
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-white p-4 shadow-card">
      <div className="font-mono text-[10px] uppercase tracking-wider text-body">{label}</div>
      <div className="mt-2 font-display text-[28px] font-light leading-none tracking-[-0.01em] text-ink">
        {value}
      </div>
      <div className="mt-2 font-mono text-[11px] text-body">{sub}</div>
    </div>
  );
}
