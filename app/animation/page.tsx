"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const AGENCIES = [
  "TX TABC", "CA ABC", "IL IDPH", "NYC DOH", "FL DBPR",
  "CO DOR", "GA DOR", "WA LCB", "NY SLA", "MA ABC",
  "PA LCB", "OH DOC", "AZ DLLC", "NC ABC", "VA ABC",
  "OR OLCC", "MI LARA", "TN ABC", "MO ATC", "IN ATC",
  "NJ ABC", "MD COMP", "WI DOR", "MN AGED", "LA ATC",
  "KS ABC", "OK ABLE", "AL ABC", "KY ABC", "UT DABC",
  "CT DCP", "SC DOR", "NV DTAX", "AR ABC", "IA ABD",
  "ND ABC", "NE LCC", "ME BABLO", "NM RLD", "RI DBR",
];

const SUB_NOTES = [
  "form v3.2",
  "fee $185",
  "due Mar 4",
  "late +$500/d",
  "renewed 2026",
  "rev 2024",
  "new form",
  "pending",
  "needs notary",
];

type Dims = { w: number; h: number };
type Pos = {
  x: number;
  y: number;
  rotate: number;
  driftX: number;
  driftY: number;
  note?: string;
  highlight?: "warn" | "bad";
};

function seededPositions(count: number, w: number, h: number, seed = 7): Pos[] {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const padX = 40;
  const padY = 80;
  return Array.from({ length: count }, (_, i) => {
    return {
      x: padX + rand() * (w - padX * 2),
      y: padY + rand() * (h - padY * 2),
      rotate: (rand() - 0.5) * 26,
      driftX: (rand() - 0.5) * 10,
      driftY: (rand() - 0.5) * 10,
      note: rand() < 0.45 ? SUB_NOTES[Math.floor(rand() * SUB_NOTES.length)] : undefined,
      highlight:
        rand() < 0.08 ? "bad" : rand() < 0.18 ? "warn" : undefined,
    };
  });
}

export default function AnimationPage() {
  const [dims, setDims] = useState<Dims | null>(null);

  useEffect(() => {
    const measure = () => {
      const w = Math.max(1, window.innerWidth);
      setDims({ w: w / 2, h: window.innerHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const positions = useMemo(
    () => (dims ? seededPositions(AGENCIES.length, dims.w, dims.h) : null),
    [dims]
  );

  return (
    <div className="relative min-h-screen bg-bg">
      {/* top nav overlays */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between p-6">
        <Link
          href="/"
          className="pointer-events-auto font-mono text-[11px] uppercase tracking-wider text-body transition-colors hover:text-ink"
        >
          ← Back to site
        </Link>
        <div className="font-mono text-[11px] uppercase tracking-wider text-body">
          Concept · Before vs. After
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* LEFT — chaos */}
        <section className="relative w-1/2 overflow-hidden border-r border-hairline bg-bgalt">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />

          <div className="pointer-events-none absolute left-1/2 top-[72px] z-20 w-full -translate-x-1/2 px-6 text-center">
            <div className="font-mono text-[11px] uppercase tracking-wider text-body">
              Without ClearBot
            </div>
            <div className="mt-2 font-display text-[clamp(22px,2.6vw,32px)] font-light leading-tight text-ink">
              Every agency. Every form. <span className="italic">On you.</span>
            </div>
          </div>

          {dims && positions && (
            <>
              {/* tangled web of lines */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox={`0 0 ${dims.w} ${dims.h}`}
                preserveAspectRatio="none"
              >
                {positions.map((_, i) => {
                  const a = positions[i];
                  const b = positions[(i * 7 + 3) % positions.length];
                  const c = positions[(i * 11 + 5) % positions.length];
                  return (
                    <g key={`web-${i}`}>
                      <line
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke="rgba(0,0,0,0.12)"
                        strokeWidth="1"
                        strokeDasharray="3 4"
                      />
                      {i % 3 === 0 && (
                        <line
                          x1={a.x}
                          y1={a.y}
                          x2={c.x}
                          y2={c.y}
                          stroke="rgba(220,38,38,0.18)"
                          strokeWidth="1"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* agency chips */}
              {AGENCIES.map((a, i) => {
                const p = positions[i];
                const tone =
                  p.highlight === "bad"
                    ? "border-bad/40 bg-bad/5 text-bad"
                    : p.highlight === "warn"
                      ? "border-warn/40 bg-warn/5 text-warn"
                      : "border-hairline bg-white text-body";
                return (
                  <motion.div
                    key={a}
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: 1,
                      x: [p.x, p.x + p.driftX, p.x],
                      y: [p.y, p.y + p.driftY, p.y],
                    }}
                    transition={{
                      opacity: { duration: 0.4, delay: (i % 10) * 0.03 },
                      x: {
                        duration: 4 + (i % 5) * 0.6,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                      },
                      y: {
                        duration: 5 + (i % 4) * 0.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                      },
                    }}
                    className={`pointer-events-none absolute left-0 top-0 select-none whitespace-nowrap rounded-md border px-2.5 py-1.5 font-mono text-[11px] tracking-tight shadow-card ${tone}`}
                    style={{
                      transform: `translate(-50%, -50%) rotate(${p.rotate}deg)`,
                      transformOrigin: "center",
                    }}
                  >
                    <div className="leading-tight">{a}</div>
                    {p.note && (
                      <div className="mt-0.5 text-[9px] uppercase tracking-wider opacity-70">
                        {p.note}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </>
          )}

          {/* bottom stats */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-6">
            <div className="mx-auto flex max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-xl border border-hairline bg-white/85 px-4 py-2.5 text-center font-mono text-[11px] uppercase tracking-wider text-body backdrop-blur-sm">
              <span>528 portals</span>
              <span className="text-hairline">·</span>
              <span>2,140 forms</span>
              <span className="text-hairline">·</span>
              <span>38 states</span>
              <span className="text-hairline">·</span>
              <span className="text-bad">3 overdue</span>
            </div>
          </div>
        </section>

        {/* RIGHT — simplicity */}
        <section className="relative flex w-1/2 items-center justify-center overflow-hidden bg-white">
          <div className="pointer-events-none absolute left-1/2 top-[72px] z-20 w-full -translate-x-1/2 px-6 text-center">
            <div className="font-mono text-[11px] uppercase tracking-wider text-accent-deep">
              With ClearBot
            </div>
            <div className="mt-2 font-display text-[clamp(22px,2.6vw,32px)] font-light leading-tight text-ink">
              One screen. <span className="italic">Everything.</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 0.8, 0.3, 1] }}
            className="relative flex flex-col items-center"
          >
            <Logo size={160} />
            <div className="mt-6 font-sans text-[28px] font-semibold tracking-tight text-ink">
              ClearBot
            </div>
            <div className="mt-1.5 font-mono text-[11px] uppercase tracking-wider text-body">
              One dashboard · every renewal
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 text-center">
              <Stat value="1" label="Dashboard" />
              <Stat value="0" label="Missed renewals" />
              <Stat value="∞" label="Agencies handled" />
            </div>
          </motion.div>

        </section>
      </div>

      {/* center "vs" badge */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        <div className="rounded-full border border-hairline bg-white px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-body shadow-card">
          vs
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-[32px] font-light leading-none text-ink">
        {value}
      </div>
      <div className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-body">
        {label}
      </div>
    </div>
  );
}
