"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const QUERY_LINES = [
  "SELECT jurisdiction, COUNT(*) AS lapses",
  "FROM   licenses",
  "WHERE  status     = 'lapsed'",
  "  AND  expires_at > now() - interval '30 days'",
  "GROUP  BY jurisdiction",
  "ORDER  BY lapses DESC",
  "LIMIT  6;",
];

const RESULTS = [
  { jurisdiction: "TX · Harris County", lapses: 412 },
  { jurisdiction: "CA · Los Angeles", lapses: 287 },
  { jurisdiction: "IL · Cook County", lapses: 219 },
  { jurisdiction: "NY · Kings County", lapses: 198 },
  { jurisdiction: "FL · Miami-Dade", lapses: 174 },
  { jurisdiction: "GA · Fulton County", lapses: 138 },
];

export function QueryConsole() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % (QUERY_LINES.length + RESULTS.length + 4));
    }, 600);
    return () => window.clearInterval(id);
  }, []);

  const queryShown = Math.min(step, QUERY_LINES.length);
  const resultsShown = Math.max(0, step - QUERY_LINES.length - 1);

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card-lg">
      <div className="flex items-center justify-between border-b border-hairline bg-bgalt/60 px-5 py-3">
        <span className="font-mono text-[11px] uppercase tracking-wider text-body">
          query · production replica
        </span>
        <span className="font-mono text-[11px] text-body">read-only</span>
      </div>

      <pre className="overflow-x-auto bg-white px-5 py-4 font-mono text-[12px] leading-[1.7] text-ink no-scrollbar">
        {QUERY_LINES.map((line, i) => {
          const visible = i < queryShown;
          const isActive = i === queryShown - 1 && queryShown < QUERY_LINES.length;
          return (
            <div
              key={i}
              className="transition-opacity duration-200"
              style={{ opacity: visible ? 1 : 0 }}
            >
              <span className="mr-3 select-none text-body">
                {String(i + 1).padStart(2, "0")}
              </span>
              <SQLLine line={line} />
              {isActive && (
                <span className="ml-1 inline-block h-3 w-1.5 -translate-y-0.5 animate-pulse bg-ink align-middle" />
              )}
            </div>
          );
        })}
      </pre>

      <div className="border-t border-hairline bg-bgalt/40 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body">
        {resultsShown >= RESULTS.length
          ? `Returned ${RESULTS.length} rows · 41ms`
          : resultsShown > 0
            ? "Streaming results…"
            : queryShown === QUERY_LINES.length
              ? "Executing…"
              : "Ready"}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-hairline bg-white px-5 py-2 font-mono text-[10px] uppercase tracking-wider text-body">
        <span>jurisdiction</span>
        <span>lapses</span>
      </div>

      <ul className="divide-y divide-hairline">
        {RESULTS.map((r, i) => (
          <motion.li
            key={r.jurisdiction}
            animate={{
              opacity: i < resultsShown ? 1 : 0.18,
              x: i < resultsShown ? 0 : -4,
            }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-2.5"
          >
            <span className="truncate font-mono text-[12px] text-ink">
              {r.jurisdiction}
            </span>
            <span className="font-mono text-[12px] tabular-nums text-accent-deep">
              {r.lapses.toLocaleString()}
            </span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function SQLLine({ line }: { line: string }) {
  const KEYWORDS =
    /(SELECT|FROM|WHERE|AND|OR|GROUP\s+BY|ORDER\s+BY|LIMIT|AS|interval|now)/g;
  const STRINGS = /'[^']*'/g;
  const NUMBERS = /\b\d+\b/g;

  let html = line
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html.replace(
    KEYWORDS,
    (m) => `<span class="text-accent-deep">${m}</span>`
  );
  html = html.replace(
    STRINGS,
    (m) => `<span class="text-warn">${m}</span>`
  );
  html = html.replace(
    NUMBERS,
    (m) => `<span class="text-body">${m}</span>`
  );

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
