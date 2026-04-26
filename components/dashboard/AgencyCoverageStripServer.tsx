import clsx from "clsx";

type Tone = "accent" | "ok" | "ink";

export type CoverageItem = {
  label: string;
  value: string;
  sub: string;
  tone: Tone;
};

export function AgencyCoverageStripServer({ items }: { items: CoverageItem[] }) {
  const cols =
    items.length >= 5
      ? "md:grid-cols-5"
      : items.length === 4
        ? "md:grid-cols-4"
        : items.length === 3
          ? "md:grid-cols-3"
          : "md:grid-cols-2";
  return (
    <section className="overflow-hidden rounded-2xl border border-hairline bg-ink text-white shadow-card">
      <div className={`grid grid-cols-2 divide-white/10 sm:grid-cols-3 ${cols} md:divide-x`}>
        {items.map((it, i) => (
          <div
            key={it.label}
            className={clsx(
              "px-5 py-5 md:py-6",
              i < items.length - 1 && "border-b border-white/10 md:border-b-0"
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
            <div className="mt-1 font-mono text-[10px] text-white/50">{it.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
