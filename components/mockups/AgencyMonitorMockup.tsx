"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AGENCIES } from "@/lib/data";
import { LiveDot } from "@/components/ui/LiveDot";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";

type RowState = {
  lastSync: number; // seconds since check
  flash: boolean;
};

const SEED: RowState[] = AGENCIES.map((_, i) => ({
  lastSync: 5 + i * 7,
  flash: false,
}));

export function AgencyMonitorMockup() {
  const [rows, setRows] = useState<RowState[]>(SEED);
  const [updateBanner, setUpdateBanner] = useState<{
    code: string;
    name: string;
  } | null>(null);
  const [tick, setTick] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useVisibleInterval(
    () => {
      setTick((t) => t + 1);
      setRows((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        return prev.map((r, i) =>
          i === idx
            ? { lastSync: 0, flash: true }
            : { ...r, lastSync: r.lastSync + 1, flash: false }
        );
      });
    },
    1500,
    containerRef
  );

  useEffect(() => {
    if (tick > 0 && tick % 5 === 0) {
      const a = AGENCIES[Math.floor(Math.random() * AGENCIES.length)];
      setUpdateBanner({ code: a.code, name: a.name });
      const t = window.setTimeout(() => setUpdateBanner(null), 2400);
      return () => window.clearTimeout(t);
    }
  }, [tick]);

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-2xl border border-hairline bg-white shadow-card-lg">
      {/* header */}
      <div className="flex items-center justify-between gap-3 border-b border-hairline bg-bgalt/60 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <LiveDot size={7} />
          <span className="truncate font-mono text-[11px] uppercase tracking-wider text-body">
            <span className="hidden sm:inline">Agency Monitor · 528 sources</span>
            <span className="sm:hidden">528 sources</span>
          </span>
        </div>
        <span className="shrink-0 font-mono text-[11px] text-body">
          live
        </span>
      </div>

      {/* update banner */}
      <AnimatePresence>
        {updateBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="border-b border-accent/30 bg-accent-soft px-4 py-2.5 sm:px-5"
          >
            <div className="flex items-center justify-between gap-3 font-mono text-[11px] text-accent-deep">
              <span className="min-w-0 truncate">
                <span className="font-semibold">Form updated</span> ·{" "}
                {updateBanner.code} · {updateBanner.name}
              </span>
              <span className="shrink-0">just now</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ul className="divide-y divide-hairline">
        {AGENCIES.map((a, i) => {
          const r = rows[i];
          return (
            <li
              key={a.code}
              className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={clsx(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                    r.flash
                      ? "bg-accent text-white"
                      : "bg-accent-soft text-accent-deep"
                  )}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <div className="truncate font-mono text-[12px] uppercase tracking-wider text-ink">
                    {a.code}
                  </div>
                  <div className="truncate text-[12px] text-body">
                    {a.name}
                  </div>
                </div>
              </div>
              <div className="shrink-0 font-mono text-[11px] text-body">
                {formatAgo(r.lastSync)}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-hairline bg-bgalt/60 px-4 py-2.5 text-center font-mono text-[10px] uppercase tracking-wider text-body sm:px-5">
        <span className="hidden sm:inline">Polling every 90s · 7 changes detected today</span>
        <span className="sm:hidden">Polling 90s · 7 changes today</span>
      </div>
    </div>
  );
}

function formatAgo(s: number) {
  if (s < 1) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return `${m}m ago`;
}
