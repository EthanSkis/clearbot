"use client";

import clsx from "clsx";

type Item = {
  label: string;
  value: string;
  sub: string;
  tone: "accent" | "ok" | "ink";
};

const ITEMS: Item[] = [
  {
    label: "Coverage",
    value: "38 states",
    sub: "+2 this quarter",
    tone: "accent",
  },
  {
    label: "Agency portals",
    value: "528",
    sub: "polled every 90s",
    tone: "ink",
  },
  {
    label: "Form versions",
    value: "2,140",
    sub: "tracked live",
    tone: "ink",
  },
  {
    label: "Missed renewals",
    value: "0",
    sub: "all time",
    tone: "ok",
  },
  {
    label: "Audit events",
    value: "18,204",
    sub: "exportable, immutable",
    tone: "ink",
  },
];

export function AgencyCoverageStrip() {
  return (
    <section className="overflow-hidden rounded-2xl border border-hairline bg-ink text-white shadow-card">
      <div className="grid grid-cols-2 divide-white/10 sm:grid-cols-3 md:grid-cols-5 md:divide-x">
        {ITEMS.map((it, i) => (
          <div
            key={it.label}
            className={clsx(
              "px-5 py-5 md:py-6",
              i < ITEMS.length - 1 && "border-b border-white/10 md:border-b-0"
            )}
          >
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/60">
              {it.label}
            </div>
            <div
              className={clsx(
                "mt-2 font-display text-[26px] font-light leading-tight",
                it.tone === "accent" && "text-accent",
                it.tone === "ok" && "text-ok",
                it.tone === "ink" && "text-white"
              )}
            >
              {it.value}
            </div>
            <div className="mt-1 font-mono text-[10px] text-white/50">
              {it.sub}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
