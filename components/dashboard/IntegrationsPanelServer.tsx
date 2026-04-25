import Link from "next/link";
import clsx from "clsx";

export type IntegrationPanelRow = {
  name: string;
  category: string;
  status: "connected" | "syncing" | "available" | "error";
  detail: string;
};

const META: Record<IntegrationPanelRow["status"], { label: string; dot: string; text: string }> = {
  connected: { label: "Connected", dot: "bg-ok", text: "text-ok" },
  syncing: { label: "Syncing", dot: "bg-warn", text: "text-warn" },
  available: { label: "Available", dot: "bg-body", text: "text-body" },
  error: { label: "Error", dot: "bg-bad", text: "text-bad" },
};

export function IntegrationsPanelServer({
  rows,
  totalCatalog,
}: {
  rows: IntegrationPanelRow[];
  totalCatalog: number;
}) {
  const connectedCount = rows.filter((r) => r.status === "connected" || r.status === "syncing").length;
  return (
    <div className="flex h-full flex-col rounded-2xl border border-hairline bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-body">Integrations</div>
          <div className="mt-0.5 font-display text-[18px] font-light text-ink">
            {connectedCount} of {totalCatalog} connected.
          </div>
        </div>
        <Link
          href="/dashboard/integrations"
          className="font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink"
        >
          Browse →
        </Link>
      </div>

      <ul className="flex-1 divide-y divide-hairline">
        {rows.length === 0 && (
          <li className="px-5 py-8 text-center font-mono text-[12px] text-body">
            Connect your POS, ERP, identity provider, or alerting tool.
          </li>
        )}
        {rows.map((i) => {
          const s = META[i.status];
          return (
            <li key={i.name} className="flex items-center gap-3 px-5 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bgalt font-mono text-[11px] font-semibold text-ink ring-1 ring-hairline">
                {i.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-medium text-ink">{i.name}</span>
                  <span className="shrink-0 rounded-sm bg-bgalt px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-body">
                    {i.category}
                  </span>
                </div>
                <div className="mt-0.5 truncate font-mono text-[11px] text-body">{i.detail}</div>
              </div>
              <div className={clsx("inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider", s.text)}>
                <span className={clsx("h-1.5 w-1.5 rounded-full", s.dot)} />
                {s.label}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-hairline bg-bgalt/60 px-5 py-3 font-mono text-[11px] text-body">
        REST + GraphQL · Zapier · Webhooks
      </div>
    </div>
  );
}
