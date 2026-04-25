import clsx from "clsx";

export type JurisdictionRow = {
  state: string;
  code: string;
  locations: number;
  licenses: number;
  due: number;
  filed: number;
};

export function JurisdictionBreakdownServer({ rows }: { rows: JurisdictionRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline bg-bgalt/30 p-6 text-center font-mono text-[12px] text-body">
        Add a few locations and licenses across multiple states to see the jurisdictional breakdown.
      </div>
    );
  }

  const maxLic = Math.max(...rows.map((r) => r.licenses), 1);
  const totalLocs = rows.reduce((s, r) => s + r.locations, 0);
  const totalStates = rows.length;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-hairline bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-body">By jurisdiction</div>
        <span className="font-mono text-[11px] text-body">
          {totalLocs} loc · {totalStates} states
        </span>
      </div>
      <ul className="flex-1 divide-y divide-hairline">
        {rows.map((r) => {
          const pct = (r.licenses / maxLic) * 100;
          return (
            <li key={r.code} className="px-5 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-8 items-center justify-center rounded bg-bgalt font-mono text-[10px] font-semibold tracking-wider text-ink">
                    {r.code}
                  </span>
                  <span className="text-[13px] font-medium text-ink">{r.state}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums text-body">
                  <span>{r.locations} loc</span>
                  <span className="text-hairline">·</span>
                  <span className="text-ink">{r.licenses} lic</span>
                  {r.due > 0 && (
                    <span className="rounded-sm bg-warn/10 px-1.5 py-0.5 text-warn">{r.due} due</span>
                  )}
                </div>
              </div>
              <div className="mt-2 flex gap-1">
                <div
                  className="h-1 rounded-full bg-accent"
                  style={{ width: `${(r.filed / Math.max(r.licenses, 1)) * pct}%` }}
                />
                <div
                  className={clsx(
                    "h-1 rounded-full",
                    r.due > 0 ? "bg-warn" : "bg-hairline"
                  )}
                  style={{
                    width: `${((r.due / Math.max(r.licenses, 1)) * pct) || 0}%`,
                  }}
                />
                <div
                  className="h-1 rounded-full bg-bgalt"
                  style={{
                    width: `${
                      ((Math.max(r.licenses - r.filed - r.due, 0)) / Math.max(r.licenses, 1)) * pct
                    }%`,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-hairline px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-body">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Filed
        </span>
        <span className="ml-3 inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-warn" /> Due
        </span>
        <span className="ml-3 inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-bgalt ring-1 ring-hairline" /> Not yet
        </span>
      </div>
    </div>
  );
}
