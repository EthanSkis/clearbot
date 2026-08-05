"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import clsx from "clsx";
import { useVisibleInterval } from "@/hooks/useVisibleInterval";

type Stage = 0 | 1 | 2;

const EXTRACTED = [
  { type: "Liquor License", loc: "Chicago, IL", date: "Mar 14, 2027" },
  { type: "Health Permit", loc: "Austin, TX", date: "Apr 02, 2027" },
  { type: "Sales Tax Permit", loc: "Brooklyn, NY", date: "Jun 30, 2027" },
  { type: "Food Service Cert", loc: "Los Angeles, CA", date: "Aug 19, 2027" },
];

const CAL_DAYS = Array.from({ length: 35 }, (_, i) => i);
const HIGHLIGHTED = [3, 9, 14, 18, 23, 27];

export function OnboardingMockup() {
  const [stage, setStage] = useState<Stage>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useVisibleInterval(
    () => {
      setStage((s) => ((s + 1) % 3) as Stage);
    },
    4200,
    containerRef
  );

  return (
    <div ref={containerRef} className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-hairline bg-white shadow-card-lg sm:h-[460px]">
      {/* header */}
      <div className="flex items-center justify-between border-b border-hairline bg-bgalt/60 px-5 py-3">
        <span className="font-mono text-[11px] uppercase tracking-wider text-body">
          {["Step 1 · Upload", "Step 2 · Extract", "Step 3 · Schedule"][stage]}
        </span>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={clsx(
                "h-1.5 w-6 rounded-full transition-colors",
                i === stage ? "bg-accent" : "bg-hairline"
              )}
            />
          ))}
        </div>
      </div>

      <div className="relative h-[calc(100%-49px)] p-6">
        <AnimatePresence mode="wait">
          {stage === 0 && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="flex h-full flex-col items-center justify-center"
            >
              <div className="w-full max-w-[320px] rounded-xl border border-dashed border-hairline bg-bgalt/40 p-6 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-white">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-body"
                  >
                    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                    <polyline points="14 3 14 9 20 9" />
                  </svg>
                </div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-body">
                  licenses_2026.csv
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white">
                  <motion.div
                    className="h-full bg-accent"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                  />
                </div>
                <div className="mt-2 font-mono text-[10px] text-body">
                  parsing 1,284 records…
                </div>
              </div>
            </motion.div>
          )}

          {stage === 1 && (
            <motion.div
              key="extract"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="h-full"
            >
              <div className="font-mono text-[10px] uppercase tracking-wider text-body">
                Extracted licenses
              </div>
              <ul className="mt-3 divide-y divide-hairline rounded-lg border border-hairline">
                {EXTRACTED.map((row, i) => (
                  <motion.li
                    key={row.type}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.25 }}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-ink">
                        {row.type}
                      </div>
                      <div className="truncate font-mono text-[10px] text-body">
                        {row.loc}
                      </div>
                    </div>
                    <div className="font-mono text-[11px] text-body">
                      {row.date}
                    </div>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-accent-deep"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {stage === 2 && (
            <motion.div
              key="cal"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="h-full"
            >
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-wider text-body">
                  Renewal calendar · April 2027
                </div>
                <div className="font-mono text-[10px] text-body">
                  6 renewals scheduled
                </div>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1.5">
                {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                  <div
                    key={d}
                    className="text-center font-mono text-[10px] text-body"
                  >
                    {d}
                  </div>
                ))}
                {CAL_DAYS.map((i) => {
                  const highlighted = HIGHLIGHTED.includes(i);
                  return (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        duration: 0.25,
                        delay: highlighted ? 0.4 + HIGHLIGHTED.indexOf(i) * 0.15 : i * 0.01,
                      }}
                      className={clsx(
                        "relative aspect-square rounded-md border text-center",
                        highlighted
                          ? "border-accent bg-accent-soft"
                          : "border-hairline bg-white"
                      )}
                    >
                      <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-body">
                        {i + 1}
                      </span>
                      {highlighted && (
                        <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
