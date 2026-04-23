"use client";

import clsx from "clsx";
import { Pill } from "@/components/ui/Pill";

type Stage = "intake" | "prep" | "review" | "submit" | "confirm";

type Filing = {
  id: string;
  license: string;
  location: string;
  agency: string;
  fee: string;
  stage: Stage;
  mode: "Auto" | "Prep" | "Alert";
  owner: string;
};

const STAGES: { key: Stage; label: string }[] = [
  { key: "intake", label: "Intake" },
  { key: "prep", label: "Pre-fill" },
  { key: "review", label: "Review" },
  { key: "submit", label: "Submit" },
  { key: "confirm", label: "Confirm" },
];

const FILINGS: Filing[] = [
  {
    id: "f1",
    license: "Liquor License",
    location: "Chicago, IL",
    agency: "IL LCC",
    fee: "$1,540",
    stage: "submit",
    mode: "Auto",
    owner: "ClearBot",
  },
  {
    id: "f2",
    license: "Health Permit",
    location: "Austin, TX",
    agency: "TX DSHS",
    fee: "$425",
    stage: "confirm",
    mode: "Auto",
    owner: "ClearBot",
  },
  {
    id: "f3",
    license: "Tobacco Retailer",
    location: "Miami, FL",
    agency: "FL DBPR",
    fee: "$290",
    stage: "review",
    mode: "Prep",
    owner: "Diana R.",
  },
  {
    id: "f4",
    license: "Sales Tax Permit",
    location: "Brooklyn, NY",
    agency: "NY DTF",
    fee: "$0",
    stage: "prep",
    mode: "Auto",
    owner: "ClearBot",
  },
  {
    id: "f5",
    license: "Building Occupancy",
    location: "Denver, CO",
    agency: "Denver BLDG",
    fee: "$1,210",
    stage: "intake",
    mode: "Alert",
    owner: "Priya A.",
  },
];

function stageIndex(s: Stage) {
  return STAGES.findIndex((x) => x.key === s);
}

export function FilingsInFlight() {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
      {/* desktop header */}
      <div className="hidden grid-cols-[1.3fr_1fr_2fr_0.6fr_0.6fr_0.6fr] items-center gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
        <div>License · Location</div>
        <div>Agency</div>
        <div>Progress</div>
        <div>Fee</div>
        <div>Mode</div>
        <div className="text-right">Owner</div>
      </div>

      <ul className="divide-y divide-hairline">
        {FILINGS.map((f) => {
          const idx = stageIndex(f.stage);
          return (
            <li
              key={f.id}
              className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-4 md:grid-cols-[1.3fr_1fr_2fr_0.6fr_0.6fr_0.6fr]"
            >
              <div className="min-w-0">
                <div className="truncate text-[14px] font-medium text-ink">
                  {f.license}
                </div>
                <div className="truncate font-mono text-[11px] text-body">
                  {f.location}
                </div>
              </div>
              <div className="hidden font-mono text-[12px] text-body md:block">
                {f.agency}
              </div>
              <div className="col-span-2 md:col-span-1">
                <StageBar stage={f.stage} />
                <div className="mt-1.5 hidden items-center justify-between font-mono text-[10px] uppercase tracking-wider text-body md:flex">
                  {STAGES.map((s, i) => (
                    <span
                      key={s.key}
                      className={clsx(
                        i <= idx ? "text-ink" : "text-body/60",
                        i === idx && "font-semibold"
                      )}
                    >
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="hidden font-mono text-[12px] tabular-nums text-ink md:block">
                {f.fee}
              </div>
              <div className="hidden md:block">
                <Pill
                  tone={
                    f.mode === "Auto"
                      ? "accent"
                      : f.mode === "Prep"
                        ? "warn"
                        : "neutral"
                  }
                  withDot
                >
                  {f.mode}
                </Pill>
              </div>
              <div className="text-right font-mono text-[11px] text-body">
                {f.owner}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between border-t border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[11px] text-body">
        <span>11 filings in flight · avg cycle 3.2 days</span>
        <a href="#" className="hover:text-ink">
          Open filings queue →
        </a>
      </div>
    </div>
  );
}

function StageBar({ stage }: { stage: Stage }) {
  const idx = stageIndex(stage);
  const pct = ((idx + 1) / STAGES.length) * 100;
  return (
    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bgalt">
      <div
        className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
      {STAGES.map((_, i) => (
        <span
          key={i}
          className={clsx(
            "absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border",
            i <= idx
              ? "border-accent bg-accent"
              : "border-hairline bg-white"
          )}
          style={{ left: `${((i + 0.5) / STAGES.length) * 100}%` }}
        />
      ))}
    </div>
  );
}
