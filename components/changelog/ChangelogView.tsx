"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  CHANGELOG,
  type ChangelogEntry,
  type EntryTag,
} from "./data";


const TAG_META: Record<EntryTag, { label: string; classes: string }> = {
  feature: {
    label: "Feature",
    classes: "bg-accent-soft text-accent-deep border-accent/30",
  },
  improvement: {
    label: "Improvement",
    classes: "bg-ink/5 text-ink border-hairline",
  },
  fix: {
    label: "Fix",
    classes: "bg-warn/10 text-warn border-warn/30",
  },
  agency: {
    label: "Agency",
    classes: "bg-ink text-white border-ink",
  },
  security: {
    label: "Security",
    classes: "bg-bad/10 text-bad border-bad/30",
  },
};

const ALL_TAGS: EntryTag[] = [
  "feature",
  "improvement",
  "fix",
  "agency",
  "security",
];

function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ChangelogView() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Set<EntryTag>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CHANGELOG.filter((e) => {
      if (active.size > 0 && !e.tags.some((t) => active.has(t))) return false;
      if (q.length === 0) return true;
      const hay = [e.title, e.summary, ...e.bullets].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [query, active]);

  const grouped = useMemo(() => {
    const map = new Map<string, ChangelogEntry[]>();
    for (const e of filtered) {
      const key = monthLabel(e.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function toggleTag(t: EntryTag) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  return (
    <div className="space-y-8">
      <div className="sticky top-[72px] z-10 -mx-6 flex flex-col gap-3 border-b border-hairline bg-bg/90 px-6 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-[360px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-body"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search releases…"
            className="w-full rounded-md border border-hairline bg-white py-2 pl-9 pr-3 text-[14px] text-ink placeholder:text-body focus:border-ink focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ALL_TAGS.map((t) => {
            const on = active.has(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                aria-pressed={on}
                className={clsx(
                  "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
                  on
                    ? TAG_META[t].classes
                    : "border-hairline bg-white text-body hover:text-ink"
                )}
              >
                {TAG_META[t].label}
              </button>
            );
          })}
          <a
            href="/changelog.rss"
            className="rounded-full border border-hairline bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-body hover:text-ink"
          >
            RSS
          </a>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-hairline bg-bgalt/60 p-8 text-center font-mono text-[12px] text-body">
          No releases match your filters.
          {(query || active.size > 0) && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActive(new Set());
              }}
              className="ml-2 text-ink underline underline-offset-2"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {grouped.map(([month, entries]) => (
        <section key={month}>
          <h2 className="mb-4 font-mono text-[11px] uppercase tracking-wider text-body">
            {month}
          </h2>
          <ol className="space-y-6">
            {entries.map((e) => (
              <li
                key={e.id}
                className="rounded-2xl border border-hairline bg-white p-6 shadow-card sm:p-7"
                id={e.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {e.tags.map((t) => (
                        <span
                          key={t}
                          className={clsx(
                            "rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                            TAG_META[t].classes
                          )}
                        >
                          {TAG_META[t].label}
                        </span>
                      ))}
                      <a
                        href={`#${e.id}`}
                        className="font-mono text-[11px] text-body hover:text-ink"
                      >
                        {dayLabel(e.date)}
                      </a>
                    </div>
                    <h3 className="mt-3 font-display text-[22px] font-light leading-tight text-ink">
                      {e.title}
                    </h3>
                  </div>
                </div>
                <p className="mt-3 text-[14px] leading-[1.6] text-body">
                  {e.summary}
                </p>
                <ul className="mt-4 space-y-1.5">
                  {e.bullets.map((b, i) => (
                    <li
                      key={i}
                      className="flex gap-2.5 text-[14px] leading-[1.55] text-body"
                    >
                      <span className="mt-[10px] inline-block h-[3px] w-[3px] shrink-0 rounded-full bg-body/60" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
