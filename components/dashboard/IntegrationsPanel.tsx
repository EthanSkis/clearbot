"use client";

import clsx from "clsx";

type Integration = {
  name: string;
  category: string;
  status: "connected" | "syncing" | "offered";
  detail: string;
};

const INTEGRATIONS: Integration[] = [
  {
    name: "Toast",
    category: "POS",
    status: "connected",
    detail: "Syncing 38 locations",
  },
  {
    name: "NetSuite",
    category: "ERP",
    status: "connected",
    detail: "AP routing · last sync 2m",
  },
  {
    name: "Okta",
    category: "Identity",
    status: "connected",
    detail: "SSO · SCIM · 5 users",
  },
  {
    name: "Slack",
    category: "Alerts",
    status: "connected",
    detail: "#ops-renewals",
  },
  {
    name: "QuickBooks",
    category: "Accounting",
    status: "syncing",
    detail: "Initial import · 62%",
  },
  {
    name: "Rippling",
    category: "HRIS",
    status: "offered",
    detail: "Connect to auto-update managers",
  },
];

const STATUS_META: Record<
  Integration["status"],
  { label: string; dot: string; text: string }
> = {
  connected: {
    label: "Connected",
    dot: "bg-ok",
    text: "text-ok",
  },
  syncing: {
    label: "Syncing",
    dot: "bg-warn",
    text: "text-warn",
  },
  offered: {
    label: "Available",
    dot: "bg-body",
    text: "text-body",
  },
};

export function IntegrationsPanel() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-hairline bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-body">
            Integrations
          </div>
          <div className="mt-0.5 font-display text-[18px] font-light text-ink">
            4 of 12 connected.
          </div>
        </div>
        <a
          href="#"
          className="font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
        >
          Browse →
        </a>
      </div>

      <ul className="flex-1 divide-y divide-hairline">
        {INTEGRATIONS.map((i) => {
          const s = STATUS_META[i.status];
          return (
            <li key={i.name} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bgalt font-mono text-[11px] font-semibold text-ink ring-1 ring-hairline">
                {i.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-medium text-ink">
                    {i.name}
                  </span>
                  <span className="shrink-0 rounded-sm bg-bgalt px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-body">
                    {i.category}
                  </span>
                </div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-body">
                  {i.detail}
                </div>
              </div>
              <div
                className={clsx(
                  "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider",
                  s.text
                )}
              >
                <span className={clsx("h-1.5 w-1.5 rounded-full", s.dot)} />
                {s.label}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-hairline bg-bgalt/60 px-5 py-3 font-mono text-[11px] text-body">
        API · REST + GraphQL · Zapier · Webhooks
      </div>
    </div>
  );
}
