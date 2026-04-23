"use client";

import clsx from "clsx";

type Kpi = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
  tone: "ok" | "warn" | "bad" | "neutral";
  spark: number[];
  sub: string;
};

const KPIS: Kpi[] = [
  {
    label: "Locations tracked",
    value: "38",
    delta: "+2",
    trend: "up",
    tone: "neutral",
    spark: [32, 33, 33, 34, 35, 36, 38],
    sub: "across 11 states",
  },
  {
    label: "Licenses on file",
    value: "146",
    delta: "+7",
    trend: "up",
    tone: "neutral",
    spark: [128, 131, 134, 137, 139, 142, 146],
    sub: "1,200+ canonical types covered",
  },
  {
    label: "Needs attention",
    value: "6",
    delta: "−2",
    trend: "down",
    tone: "warn",
    spark: [9, 10, 8, 7, 8, 7, 6],
    sub: "1 overdue · 5 due within 30 days",
  },
  {
    label: "Filed this quarter",
    value: "42",
    delta: "+11",
    trend: "up",
    tone: "ok",
    spark: [22, 26, 29, 33, 36, 39, 42],
    sub: "100% on-time · 0 missed",
  },
  {
    label: "Fees routed YTD",
    value: "$184,210",
    delta: "+$38k",
    trend: "up",
    tone: "neutral",
    spark: [80, 95, 112, 128, 151, 168, 184],
    sub: "across 12 agency payment systems",
  },
  {
    label: "Penalty savings YTD",
    value: "$212,500",
    delta: "est.",
    trend: "flat",
    tone: "ok",
    spark: [30, 58, 92, 134, 168, 192, 212],
    sub: "vs. 2024 industry lapse rate",
  },
];

export function KpiCards() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {KPIS.map((k) => (
        <KpiCard key={k.label} k={k} />
      ))}
    </div>
  );
}

function KpiCard({ k }: { k: Kpi }) {
  const deltaTone =
    k.tone === "ok"
      ? "text-ok"
      : k.tone === "warn"
        ? "text-warn"
        : k.tone === "bad"
          ? "text-bad"
          : "text-body";

  return (
    <div className="rounded-xl border border-hairline bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="font-mono text-[10px] uppercase tracking-wider text-body">
          {k.label}
        </div>
        <span
          className={clsx(
            "flex items-center gap-0.5 font-mono text-[10px] font-medium tabular-nums",
            deltaTone
          )}
        >
          {k.trend === "up" && <ArrowUp />}
          {k.trend === "down" && <ArrowDown />}
          {k.delta}
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="font-display text-[30px] font-light leading-none tracking-[-0.01em] text-ink">
          {k.value}
        </div>
        <Sparkline data={k.spark} tone={k.tone} />
      </div>
      <div className="mt-2 truncate font-mono text-[10px] text-body">
        {k.sub}
      </div>
    </div>
  );
}

function Sparkline({ data, tone }: { data: number[]; tone: Kpi["tone"] }) {
  const w = 64;
  const h = 22;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data
    .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
    .join(" ");
  const color =
    tone === "ok"
      ? "#16a34a"
      : tone === "warn"
        ? "#d97706"
        : tone === "bad"
          ? "#dc2626"
          : "#7ab833";
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowUp() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
