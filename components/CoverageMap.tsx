"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import {
  COVERED_COUNT,
  STATES,
  TOTAL_AGENCIES,
  TOTAL_LICENSES,
  type StateInfo,
} from "@/lib/states";
import { LiveDot } from "@/components/ui/LiveDot";

const TILE = 56;
const GAP = 4;
const COLS = 12;
const ROWS = 8;
const W = COLS * (TILE + GAP);
const H = ROWS * (TILE + GAP);

export function CoverageMap() {
  const [selected, setSelected] = useState<StateInfo | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const focused = selected ?? STATES.find((s) => s.code === hovered) ?? null;

  const sortedCovered = useMemo(
    () => STATES.filter((s) => s.covered).sort((a, b) => a.name.localeCompare(b.name)),
    []
  );
  const sortedUncovered = useMemo(
    () => STATES.filter((s) => !s.covered).sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  return (
    <div>
      {/* legend + stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-5">
        <div className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-wider text-body">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-accent" /> Covered
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm border border-hairline bg-bgalt" /> On the roadmap
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-body">
          <LiveDot size={6} />
          updated 6 minutes ago
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] lg:gap-12">
        {/* map */}
        <div className="rounded-2xl border border-hairline bg-white p-4 shadow-card sm:p-6">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            xmlns="http://www.w3.org/2000/svg"
            className="block w-full"
            role="img"
            aria-label={`US coverage map. ${COVERED_COUNT} of 50 states currently supported.`}
          >
            {STATES.map((s) => {
              const x = s.col * (TILE + GAP);
              const y = s.row * (TILE + GAP);
              const isSelected = selected?.code === s.code;
              const isHovered = hovered === s.code;
              return (
                <g
                  key={s.code}
                  className="cursor-pointer"
                  onMouseEnter={() => setHovered(s.code)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() =>
                    setSelected((cur) => (cur?.code === s.code ? null : s))
                  }
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected((cur) => (cur?.code === s.code ? null : s));
                    }
                  }}
                  role="button"
                  aria-label={`${s.name}, ${s.covered ? "covered" : "not covered"}`}
                  aria-pressed={isSelected}
                >
                  <rect
                    x={x}
                    y={y}
                    width={TILE}
                    height={TILE}
                    rx={8}
                    ry={8}
                    className={clsx(
                      "transition-all duration-150",
                      s.covered
                        ? isSelected
                          ? "fill-[#5d8f25] stroke-[#3f6418]"
                          : isHovered
                            ? "fill-[#88c63b] stroke-[#5d8f25]"
                            : "fill-[#7ab833] stroke-[#5d8f25]/40"
                        : isSelected
                          ? "fill-[#e8e8e6] stroke-[#cdcdcb]"
                          : isHovered
                            ? "fill-[#f0f0ee] stroke-hairline"
                            : "fill-[#f9f9f8] stroke-hairline"
                    )}
                    strokeWidth={1}
                  />
                  <text
                    x={x + TILE / 2}
                    y={y + TILE / 2 + 4}
                    textAnchor="middle"
                    className={clsx(
                      "select-none font-mono text-[13px] font-medium uppercase tracking-wider transition-colors duration-150",
                      s.covered
                        ? "fill-white"
                        : isHovered
                          ? "fill-ink"
                          : "fill-body"
                    )}
                    style={{ pointerEvents: "none" }}
                  >
                    {s.code}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* mobile hint */}
          <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-wider text-body lg:hidden">
            Tap a state for details
          </p>
        </div>

        {/* side panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AnimatePresence mode="wait">
            {focused ? (
              <motion.div
                key={focused.code}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="rounded-2xl border border-hairline bg-white p-6 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={clsx(
                      "flex h-10 w-10 items-center justify-center rounded-lg font-mono text-[13px] font-medium uppercase tracking-wider",
                      focused.covered
                        ? "bg-accent text-white"
                        : "border border-hairline bg-bgalt text-body"
                    )}
                  >
                    {focused.code}
                  </span>
                  <div>
                    <div className="text-[16px] font-medium text-ink">
                      {focused.name}
                    </div>
                    <div
                      className={clsx(
                        "font-mono text-[10px] uppercase tracking-wider",
                        focused.covered ? "text-accent-deep" : "text-body"
                      )}
                    >
                      {focused.covered ? "Active coverage" : "Roadmap"}
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {focused.covered ? (
                    <>
                      <Stat label="Agencies tracked" value={focused.agencies?.toString() ?? "—"} />
                      <Stat
                        label="Licenses managed"
                        value={focused.licenses?.toLocaleString() ?? "—"}
                      />
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-wider text-body">
                          Most common
                        </div>
                        <div className="mt-1 text-[13px] text-ink">
                          {focused.topLicense}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-[13px] leading-[1.55] text-body">
                      {focused.notes ??
                        "Not yet on the roadmap. Talk to us if you have a multi-state need that includes this jurisdiction."}
                    </p>
                  )}
                </div>

                {selected && (
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="mt-6 w-full rounded-md border border-hairline bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-body transition-colors hover:bg-bgalt hover:text-ink"
                  >
                    Clear selection
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="rounded-2xl border border-hairline bg-white p-6 shadow-card"
              >
                <div className="font-mono text-[10px] uppercase tracking-wider text-body">
                  Coverage at a glance
                </div>
                <div className="mt-4 space-y-4">
                  <Stat
                    label="States with active coverage"
                    value={`${COVERED_COUNT} of 50`}
                  />
                  <Stat
                    label="Agency portals monitored"
                    value={TOTAL_AGENCIES.toLocaleString()}
                  />
                  <Stat
                    label="Licenses currently managed"
                    value={TOTAL_LICENSES.toLocaleString()}
                  />
                </div>
                <p className="mt-6 text-[13px] leading-[1.55] text-body">
                  Click any state to see what we cover, which agencies we monitor,
                  and the most common license type.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>

      {/* full state lists */}
      <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between border-b border-hairline pb-3">
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-ink">
              Covered states
            </h3>
            <span className="font-mono text-[11px] text-body">
              {sortedCovered.length}
            </span>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {sortedCovered.map((s) => (
              <li
                key={s.code}
                className="flex items-center gap-2 text-[13px] text-ink"
              >
                <span className="font-mono text-[10px] uppercase tracking-wider text-accent-deep">
                  {s.code}
                </span>
                {s.name}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-baseline justify-between border-b border-hairline pb-3">
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-ink">
              On the roadmap
            </h3>
            <span className="font-mono text-[11px] text-body">
              {sortedUncovered.length}
            </span>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {sortedUncovered.map((s) => (
              <li
                key={s.code}
                className="flex items-center gap-2 text-[13px] text-body"
              >
                <span className="font-mono text-[10px] uppercase tracking-wider">
                  {s.code}
                </span>
                {s.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-hairline pt-4 first:border-t-0 first:pt-0">
      <div className="font-mono text-[10px] uppercase tracking-wider text-body">
        {label}
      </div>
      <div className="mt-1 font-display text-[26px] font-light leading-tight text-ink">
        {value}
      </div>
    </div>
  );
}
