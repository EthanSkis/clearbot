import type { Metadata } from "next";
import clsx from "clsx";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { INTEGRATIONS } from "@/lib/data";

export const metadata: Metadata = { title: "Integrations · ClearBot" };

type Status = "connected" | "syncing" | "available" | "error";

type Int = {
  name: string;
  category: string;
  status: Status;
  detail: string;
  last?: string;
};

const CONNECTED: Int[] = [
  { name: "Toast", category: "POS", status: "connected", detail: "Locations & ownership", last: "2m ago" },
  { name: "NetSuite", category: "ERP", status: "connected", detail: "AP routing · invoices", last: "6m ago" },
  { name: "Okta", category: "Identity", status: "connected", detail: "SSO · SCIM · 7 users", last: "live" },
  { name: "Slack", category: "Alerts", status: "connected", detail: "#ops-renewals · #finance-fees", last: "live" },
  { name: "QuickBooks", category: "Accounting", status: "syncing", detail: "Initial import · 62%", last: "3s ago" },
  { name: "Google Workspace", category: "Identity", status: "connected", detail: "Calendar · email alerts", last: "18m ago" },
];

const AVAILABLE: Int[] = [
  { name: "Rippling", category: "HRIS", status: "available", detail: "Auto-update location managers." },
  { name: "Square", category: "POS", status: "available", detail: "Pull locations & operating status." },
  { name: "Sage Intacct", category: "Accounting", status: "available", detail: "Route fee payments through AP." },
  { name: "Workday", category: "HRIS", status: "available", detail: "Sync org changes to workspace roles." },
  { name: "Microsoft Teams", category: "Alerts", status: "available", detail: "Channel-routed deadline alerts." },
  { name: "Zapier", category: "Other", status: "available", detail: "Trigger from any license state change." },
];

const STATUS_META: Record<Status, { label: string; dot: string; text: string }> = {
  connected: { label: "Connected", dot: "bg-ok", text: "text-ok" },
  syncing: { label: "Syncing", dot: "bg-warn", text: "text-warn" },
  available: { label: "Available", dot: "bg-body", text: "text-body" },
  error: { label: "Error", dot: "bg-bad", text: "text-bad" },
};

const WEBHOOKS = [
  { url: "https://meridiang.slack.com/hooks/…42a1", event: "renewal.due", fired: "14m ago", status: "200 OK" },
  { url: "https://hooks.netsuite.com/ap/route", event: "filing.fee_scheduled", fired: "1h ago", status: "200 OK" },
  { url: "https://legal.meridiang.com/audit", event: "filing.submitted", fired: "today", status: "200 OK" },
];

const KEYS = [
  { name: "Production · read/write", prefix: "cb_live_7a2…f91", created: "Jan 12, 2026", last: "2m ago" },
  { name: "CI · read-only", prefix: "cb_live_4e9…c02", created: "Mar 03, 2026", last: "yesterday" },
  { name: "Staging", prefix: "cb_test_11b…8a4", created: "Apr 01, 2026", last: "4d ago" },
];

export default function IntegrationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="6 connected · 6 available"
        title={<>Plugs into the systems <span className="italic">you already run.</span></>}
        subtitle="Locations from your POS or ERP. Fees routed through your AP. Alerts in the channels your team already uses."
        actions={
          <>
            <button className="rounded-md border border-hairline bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink">
              API reference
            </button>
            <button className="rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep">
              Browse catalog
            </button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Connected" value="6" sub="across 5 categories" />
        <Stat label="Events last 24h" value="4,218" sub="all 200 OK" />
        <Stat label="Webhook endpoints" value="3" sub="average fire < 200ms" />
        <Stat label="API keys" value="3" sub="1 read-only" />
      </section>

      <section>
        <SectionHeader title="Connected" subtitle="Status, last sync, and scope for each integration." />
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {CONNECTED.map((i) => (
            <IntCard key={i.name} i={i} connected />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Catalog" subtitle={`${INTEGRATIONS.length}+ integrations · SOC-2 reviewed, one-click setup.`} />
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {AVAILABLE.map((i) => (
            <IntCard key={i.name} i={i} />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <SectionHeader title="Webhooks" subtitle="Subscribe to license-state changes by jurisdiction, agency, or holder." />
          <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
            <div className="grid grid-cols-[2fr_1fr_0.7fr_0.6fr] gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body">
              <div>Endpoint</div>
              <div>Event</div>
              <div>Last fired</div>
              <div>Result</div>
            </div>
            <ul className="divide-y divide-hairline">
              {WEBHOOKS.map((w, i) => (
                <li key={i} className="grid grid-cols-[2fr_1fr_0.7fr_0.6fr] gap-4 px-5 py-3">
                  <div className="truncate font-mono text-[12px] text-ink">{w.url}</div>
                  <div className="truncate font-mono text-[11px] text-body">{w.event}</div>
                  <div className="font-mono text-[11px] text-body">{w.fired}</div>
                  <div className="font-mono text-[11px] text-ok">{w.status}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <SectionHeader title="API keys" subtitle="REST + GraphQL · OAuth-protected · cursor-paginated." />
          <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
            <ul className="divide-y divide-hairline">
              {KEYS.map((k) => (
                <li key={k.prefix} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-ink">{k.name}</div>
                      <div className="truncate font-mono text-[11px] text-body">{k.prefix}</div>
                    </div>
                    <button className="rounded-md border border-hairline bg-white px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink">Rotate</button>
                  </div>
                  <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-body">
                    <span>Created {k.created}</span>
                    <span>Used {k.last}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-hairline bg-bgalt/60 px-5 py-3">
              <button className="w-full rounded-md border border-hairline bg-white py-2 font-mono text-[11px] uppercase tracking-wider text-ink hover:bg-bgalt">
                + Generate new key
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function IntCard({ i, connected }: { i: Int; connected?: boolean }) {
  const s = STATUS_META[i.status];
  return (
    <div className="rounded-xl border border-hairline bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-bgalt font-mono text-[12px] font-semibold text-ink ring-1 ring-hairline">
            {i.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-medium text-ink">{i.name}</div>
            <div className="truncate font-mono text-[10px] uppercase tracking-wider text-body">{i.category}</div>
          </div>
        </div>
        <div className={clsx("inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider", s.text)}>
          <span className={clsx("h-1.5 w-1.5 rounded-full", s.dot)} />
          {s.label}
        </div>
      </div>
      <p className="mt-3 text-[12px] leading-[1.55] text-body">{i.detail}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[10px] text-body">
          {i.last ? `Last ${i.last}` : "Ready to connect"}
        </span>
        <button
          className={clsx(
            "rounded-md border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
            connected
              ? "border-hairline bg-white text-body hover:text-ink"
              : "border-accent bg-accent text-white hover:bg-accent-deep"
          )}
        >
          {connected ? "Configure" : "Connect"}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-white p-4 shadow-card">
      <div className="font-mono text-[10px] uppercase tracking-wider text-body">{label}</div>
      <div className="mt-2 font-display text-[28px] font-light leading-none tracking-[-0.01em] text-ink">{value}</div>
      <div className="mt-2 font-mono text-[11px] text-body">{sub}</div>
    </div>
  );
}
