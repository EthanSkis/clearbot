import clsx from "clsx";
import type { ReactNode } from "react";

export function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="group mt-16 scroll-mt-[96px] border-t border-hairline pt-10 font-display text-[30px] font-light leading-tight tracking-[-0.005em] text-ink first:mt-0 first:border-t-0 first:pt-0"
    >
      <a href={`#${id}`} className="inline-flex items-center gap-2">
        {children}
        <span className="font-mono text-[14px] text-body opacity-0 transition-opacity group-hover:opacity-100">
          #
        </span>
      </a>
    </h2>
  );
}

export function H3({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3
      id={id}
      className="mt-10 scroll-mt-[96px] font-display text-[20px] font-light leading-tight text-ink"
    >
      {children}
    </h3>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 text-[15px] leading-[1.7] text-body">{children}</p>
  );
}

export function UL({ children }: { children: ReactNode }) {
  return (
    <ul className="mt-4 space-y-2 text-[15px] leading-[1.6] text-body">
      {children}
    </ul>
  );
}

export function LI({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-[11px] inline-block h-[3px] w-[3px] shrink-0 rounded-full bg-body/60" />
      <span>{children}</span>
    </li>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded border border-hairline bg-bgalt px-1.5 py-0.5 font-mono text-[13px] text-ink">
      {children}
    </code>
  );
}

export function Pre({
  language,
  children,
}: {
  language?: string;
  children: string;
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-hairline bg-ink">
      {language && (
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-white/60">
          <span>{language}</span>
        </div>
      )}
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[12.5px] leading-[1.6] text-white">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function Callout({
  kind = "note",
  title,
  children,
}: {
  kind?: "note" | "warn" | "tip";
  title?: string;
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    note: "border-ink/15 bg-bgalt",
    warn: "border-warn/30 bg-warn/5",
    tip: "border-accent/30 bg-accent-soft",
  };
  const labels: Record<string, string> = {
    note: "Note",
    warn: "Warning",
    tip: "Tip",
  };
  return (
    <div className={clsx("mt-6 rounded-xl border p-4 sm:p-5", tones[kind])}>
      <div className="font-mono text-[10px] uppercase tracking-wider text-body">
        {title ?? labels[kind]}
      </div>
      <div className="mt-1.5 text-[14px] leading-[1.6] text-ink/90">
        {children}
      </div>
    </div>
  );
}

export function Steps({ children }: { children: ReactNode }) {
  return (
    <ol className="mt-6 space-y-4 border-l border-hairline pl-6">{children}</ol>
  );
}

export function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="relative">
      <span className="absolute -left-[34px] top-0 inline-flex h-6 w-6 items-center justify-center rounded-full border border-hairline bg-white font-mono text-[11px] text-ink">
        {n}
      </span>
      <div className="text-[15px] font-medium text-ink">{title}</div>
      <div className="mt-2 text-[14px] leading-[1.6] text-body">{children}</div>
    </li>
  );
}

export function Table({
  cols,
  rows,
}: {
  cols: string[];
  rows: string[][];
}) {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-hairline">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-bgalt">
            {cols.map((c) => (
              <th
                key={c}
                className="border-b border-hairline px-4 py-2.5 text-left font-mono text-[10px] uppercase tracking-wider text-body"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="odd:bg-white even:bg-bgalt/40">
              {r.map((cell, j) => (
                <td
                  key={j}
                  className="border-t border-hairline px-4 py-2.5 font-mono text-[12.5px] text-ink"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
