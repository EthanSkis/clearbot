"use client";

import clsx from "clsx";

type Row = {
  state: string;
  code: string;
  locations: number;
  licenses: number;
  due: number;
  filed: number;
};

const ROWS: Row[] = [
  { state: "Texas", code: "TX", locations: 9, licenses: 41, due: 2, filed: 12 },
  { state: "California", code: "CA", locations: 7, licenses: 33, due: 1, filed: 9 },
  { state: "Illinois", code: "IL", locations: 5, licenses: 22, due: 1, filed: 6 },
  { state: "New York", code: "NY", locations: 4, licenses: 19, due: 1, filed: 5 },
  { state: "Florida", code: "FL", locations: 4, licenses: 14, due: 1, filed: 4 },
  { state: "Colorado", code: "CO", locations: 3, licenses: 8, due: 0, filed: 3 },
  { state: "Georgia", code: "GA", locations: 3, licenses: 5, due: 0, filed: 2 },
  { state: "Washington", code: "WA", locations: 2, licenses: 4, due: 0, filed: 1 },
];

const MAX_LIC = Math.max(...ROWS.map((r) => r.licenses));

export function JurisdictionBreakdown() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-hairline bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-body">
          By jurisdiction
        </div>
        <span className="font-mono text-[11px] text-body">38 locations · 11 states</span>
      </div>
      <ul className="flex-1 divide-y divide-hairline">
        {ROWS.map((r) => {
          const pct = (r.licenses / MAX_LIC) * 100;
          return (
            <li key={r.code} className="px-5 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-8 items-center justify-center rounded bg-bgalt font-mono text-[10px] font-semibold tracking-wider text-ink">
                    {r.code}
                  </span>
                  <span className="text-[13px] font-medium text-ink">
                    {r.state}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums text-body">
                  <span>{r.locations} loc</span>
                  <span className="text-hairline">·</span>
                  <span className="text-ink">{r.licenses} lic</span>
                  {r.due > 0 && (
                    <span className="rounded-sm bg-warn/10 px-1.5 py-0.5 text-warn">
                      {r.due} due
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2 flex gap-1">
                <div
                  className="h-1 rounded-full bg-accent"
                  style={{ width: `${(r.filed / r.licenses) * pct}%` }}
                />
                <div
                  className={clsx(
                    "h-1 rounded-full",
                    r.due > 0 ? "bg-warn" : "bg-hairline"
                  )}
                  style={{
                    width: `${((r.due / r.licenses) * pct) || 0}%`,
                  }}
                />
                <div
                  className="h-1 rounded-full bg-bgalt"
                  style={{
                    width: `${((r.licenses - r.filed - r.due) / r.licenses) * pct}%`,
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
          <span className="h-1.5 w-1.5 rounded-full bg-bgalt ring-1 ring-hairline" />
          Not yet
        </span>
      </div>
    </div>
  );
}
