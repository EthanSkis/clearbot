import type { Metadata } from "next";
import clsx from "clsx";
import { PageHeader, SectionHeader } from "@/components/dashboard/PageHeader";
import { Pill } from "@/components/ui/Pill";

export const metadata: Metadata = {
  title: "Locations · ClearBot",
};

type Loc = {
  id: string;
  name: string;
  city: string;
  state: string;
  licenses: number;
  overdue: number;
  due: number;
  manager: string;
  opened: string;
  tag: string;
};

const LOCS: Loc[] = [
  { id: "L-001", name: "Wrigleyville Tap", city: "Chicago", state: "IL", licenses: 7, overdue: 0, due: 1, manager: "Priya A.", opened: "2019", tag: "Flagship" },
  { id: "L-002", name: "SoCo Burger Co.", city: "Austin", state: "TX", licenses: 6, overdue: 0, due: 1, manager: "Priya A.", opened: "2021", tag: "Franchise" },
  { id: "L-003", name: "Williamsburg Deli", city: "Brooklyn", state: "NY", licenses: 5, overdue: 0, due: 0, manager: "Diana R.", opened: "2018", tag: "Flagship" },
  { id: "L-004", name: "Silver Lake Smokehouse", city: "Los Angeles", state: "CA", licenses: 6, overdue: 0, due: 0, manager: "Erica W.", opened: "2020", tag: "Flagship" },
  { id: "L-005", name: "Wynwood Cigar Lounge", city: "Miami", state: "FL", licenses: 4, overdue: 0, due: 1, manager: "Diana R.", opened: "2022", tag: "Concept" },
  { id: "L-006", name: "LoDo Rooftop", city: "Denver", state: "CO", licenses: 5, overdue: 1, due: 0, manager: "Erica W.", opened: "2023", tag: "New build" },
  { id: "L-007", name: "Uptown Taqueria", city: "Dallas", state: "TX", licenses: 5, overdue: 0, due: 0, manager: "Priya A.", opened: "2022", tag: "Franchise" },
  { id: "L-008", name: "Midtown Oyster Bar", city: "Atlanta", state: "GA", licenses: 6, overdue: 0, due: 0, manager: "Diana R.", opened: "2017", tag: "Flagship" },
  { id: "L-009", name: "Mission Coffee House", city: "San Francisco", state: "CA", licenses: 3, overdue: 0, due: 0, manager: "Erica W.", opened: "2021", tag: "Concept" },
  { id: "L-010", name: "Capitol Hill Grill", city: "Seattle", state: "WA", licenses: 4, overdue: 0, due: 0, manager: "Priya A.", opened: "2020", tag: "Franchise" },
];

export default function LocationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="38 locations · 11 states"
        title={<>Every place you operate, <span className="italic">on one page.</span></>}
        subtitle="Opening a new location? We auto-derive licensing requirements the moment you add an address."
        actions={
          <>
            <button className="rounded-md border border-hairline bg-white px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink">
              Import CSV
            </button>
            <button className="rounded-full border border-accent bg-accent px-4 py-2 font-sans text-[13px] font-medium text-white hover:bg-accent-deep">
              + New location
            </button>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Locations" value="38" sub="+2 QoQ" />
        <Stat label="States" value="11" sub="38-state coverage" />
        <Stat label="Licenses / loc (avg)" value="3.8" sub="range 2–9" />
        <Stat label="New this quarter" value="2" sub="LoDo · Capitol Hill" />
      </section>

      <section>
        <SectionHeader
          title="Coverage map"
          subtitle="Every dot is a location. Color reflects current license health."
        />
        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white p-6 shadow-card">
          <USMap />
        </div>
      </section>

      <section>
        <SectionHeader
          title="All locations"
          subtitle="Search, filter by state, or group by manager. Click any row to drill into that location's licenses."
          right={
            <div className="flex items-center gap-2">
              <button className="rounded-md border border-ink bg-ink px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-white">
                All 38
              </button>
              <button className="rounded-md border border-hairline bg-white px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink">
                Needs attention · 3
              </button>
              <button className="rounded-md border border-hairline bg-white px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-body hover:text-ink">
                Concepts · 4
              </button>
            </div>
          }
        />
        <div className="mt-4 overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
          <div className="hidden grid-cols-[0.6fr_1.8fr_1fr_0.7fr_0.7fr_0.8fr_0.6fr_0.6fr] items-center gap-4 border-b border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-body md:grid">
            <div>ID</div>
            <div>Location</div>
            <div>City · State</div>
            <div className="text-right">Licenses</div>
            <div>Status</div>
            <div>Manager</div>
            <div>Opened</div>
            <div>Tag</div>
          </div>
          <ul className="divide-y divide-hairline">
            {LOCS.map((l) => {
              const health: "ok" | "warn" | "bad" =
                l.overdue > 0 ? "bad" : l.due > 0 ? "warn" : "ok";
              const label = l.overdue > 0 ? `${l.overdue} overdue` : l.due > 0 ? `${l.due} due` : "All current";
              return (
                <li key={l.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 md:grid-cols-[0.6fr_1.8fr_1fr_0.7fr_0.7fr_0.8fr_0.6fr_0.6fr]">
                  <div className="hidden font-mono text-[11px] text-body md:block">{l.id}</div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-ink">{l.name}</div>
                    <div className="truncate font-mono text-[11px] text-body md:hidden">
                      {l.city}, {l.state}
                    </div>
                  </div>
                  <div className="hidden font-mono text-[12px] text-body md:block">
                    {l.city}, {l.state}
                  </div>
                  <div className="hidden text-right font-mono text-[12px] tabular-nums text-ink md:block">
                    {l.licenses}
                  </div>
                  <div className="flex items-center justify-end md:justify-start">
                    <Pill tone={health} withDot>
                      {label}
                    </Pill>
                  </div>
                  <div className="hidden font-mono text-[11px] text-body md:block">{l.manager}</div>
                  <div className="hidden font-mono text-[11px] text-body md:block">{l.opened}</div>
                  <div className="hidden md:block">
                    <span className="rounded-sm bg-bgalt px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-body">
                      {l.tag}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between border-t border-hairline bg-bgalt/60 px-5 py-2.5 font-mono text-[11px] text-body">
            <span>Showing 10 of 38</span>
            <div className="flex items-center gap-2">
              <button className="rounded border border-hairline bg-white px-2 py-1 hover:text-ink">← Prev</button>
              <button className="rounded border border-hairline bg-white px-2 py-1 hover:text-ink">Next →</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-white p-4 shadow-card">
      <div className="font-mono text-[10px] uppercase tracking-wider text-body">{label}</div>
      <div className="mt-2 font-display text-[28px] font-light leading-none tracking-[-0.01em] text-ink">
        {value}
      </div>
      <div className="mt-2 font-mono text-[11px] text-body">{sub}</div>
    </div>
  );
}

type Tone = "ok" | "warn" | "bad";

const MAP_LOCS: { city: string; state: string; tone: Tone }[] = [
  { city: "Seattle", state: "WA", tone: "ok" },
  { city: "San Francisco", state: "CA", tone: "ok" },
  { city: "Los Angeles", state: "CA", tone: "ok" },
  { city: "Denver", state: "CO", tone: "bad" },
  { city: "Austin", state: "TX", tone: "warn" },
  { city: "Dallas", state: "TX", tone: "ok" },
  { city: "Chicago", state: "IL", tone: "warn" },
  { city: "Brooklyn", state: "NY", tone: "ok" },
  { city: "Atlanta", state: "GA", tone: "ok" },
  { city: "Miami", state: "FL", tone: "warn" },
];

const STATE_GRID: { abbr: string; row: number; col: number }[] = [
  { abbr: "WA", row: 0, col: 1 }, { abbr: "MT", row: 0, col: 3 }, { abbr: "ND", row: 0, col: 4 },
  { abbr: "MN", row: 0, col: 5 }, { abbr: "WI", row: 0, col: 6 }, { abbr: "MI", row: 0, col: 8 },
  { abbr: "ME", row: 0, col: 12 },
  { abbr: "OR", row: 1, col: 1 }, { abbr: "ID", row: 1, col: 2 }, { abbr: "WY", row: 1, col: 3 },
  { abbr: "SD", row: 1, col: 4 }, { abbr: "IA", row: 1, col: 5 }, { abbr: "IL", row: 1, col: 6 },
  { abbr: "IN", row: 1, col: 7 }, { abbr: "OH", row: 1, col: 8 }, { abbr: "PA", row: 1, col: 9 },
  { abbr: "NY", row: 1, col: 10 }, { abbr: "VT", row: 1, col: 11 }, { abbr: "NH", row: 1, col: 12 },
  { abbr: "CA", row: 2, col: 1 }, { abbr: "NV", row: 2, col: 2 }, { abbr: "UT", row: 2, col: 3 },
  { abbr: "CO", row: 2, col: 4 }, { abbr: "NE", row: 2, col: 5 }, { abbr: "MO", row: 2, col: 6 },
  { abbr: "KY", row: 2, col: 7 }, { abbr: "WV", row: 2, col: 8 }, { abbr: "VA", row: 2, col: 9 },
  { abbr: "NJ", row: 2, col: 10 }, { abbr: "CT", row: 2, col: 11 }, { abbr: "MA", row: 2, col: 12 },
  { abbr: "RI", row: 2, col: 13 },
  { abbr: "AZ", row: 3, col: 2 }, { abbr: "NM", row: 3, col: 3 }, { abbr: "KS", row: 3, col: 4 },
  { abbr: "AR", row: 3, col: 5 }, { abbr: "TN", row: 3, col: 6 }, { abbr: "NC", row: 3, col: 7 },
  { abbr: "MD", row: 3, col: 9 }, { abbr: "DE", row: 3, col: 10 },
  { abbr: "OK", row: 4, col: 4 }, { abbr: "LA", row: 4, col: 5 }, { abbr: "MS", row: 4, col: 6 },
  { abbr: "AL", row: 4, col: 7 }, { abbr: "SC", row: 4, col: 8 },
  { abbr: "TX", row: 5, col: 4 }, { abbr: "GA", row: 5, col: 8 },
  { abbr: "FL", row: 6, col: 8 },
  { abbr: "AK", row: 6, col: 0 }, { abbr: "HI", row: 7, col: 0 },
];

const TONE_HEX: Record<Tone, string> = {
  ok: "#16a34a",
  warn: "#d97706",
  bad: "#dc2626",
};

function USMap() {
  const byState = MAP_LOCS.reduce<Record<string, typeof MAP_LOCS>>((acc, l) => {
    (acc[l.state] ||= []).push(l);
    return acc;
  }, {});

  const CELL = 44;
  const GAP = 5;
  const COLS = 14;
  const ROWS = 8;
  const W = COLS * (CELL + GAP) - GAP;
  const H = ROWS * (CELL + GAP) - GAP;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto h-auto w-full max-w-[560px]"
        role="img"
        aria-label="United States coverage map"
      >
        {STATE_GRID.map(({ abbr, row, col }) => {
          const x = col * (CELL + GAP);
          const y = row * (CELL + GAP);
          const locs = byState[abbr] ?? [];
          const active = locs.length > 0;
          const worst: Tone = locs.some((l) => l.tone === "bad")
            ? "bad"
            : locs.some((l) => l.tone === "warn")
              ? "warn"
              : "ok";
          return (
            <g key={abbr}>
              <rect
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx={7}
                ry={7}
                fill={active ? "#e8f3d7" : "#f9f9f8"}
                stroke={active ? "#7ab833" : "rgba(0,0,0,0.08)"}
                strokeWidth={active ? 1.25 : 1}
              />
              <text
                x={x + CELL / 2}
                y={active ? y + CELL / 2 - 4 : y + CELL / 2 + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="ui-monospace, monospace"
                fontSize="10"
                fontWeight={active ? 600 : 400}
                fill={active ? "#111110" : "#6b6b6b"}
              >
                {abbr}
              </text>
              {active &&
                locs.map((l, i) => {
                  const n = locs.length;
                  const spread = 8;
                  const offset = n === 1 ? 0 : (i - (n - 1) / 2) * spread;
                  return (
                    <circle
                      key={l.city}
                      cx={x + CELL / 2 + offset}
                      cy={y + CELL - 11}
                      r={3}
                      fill={TONE_HEX[l.tone]}
                    />
                  );
                })}
              {active && locs.length > 1 && (
                <text
                  x={x + CELL - 5}
                  y={y + 9}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontFamily="ui-monospace, monospace"
                  fontSize="8"
                  fill="#6b6b6b"
                >
                  ×{locs.length}
                </text>
              )}
              {active && (
                <title>
                  {abbr}: {locs.map((l) => `${l.city} (${l.tone})`).join(", ")}
                </title>
              )}
            </g>
          );
        })}
      </svg>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-hairline pt-3 font-mono text-[10px] uppercase tracking-wider text-body">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border border-accent bg-accent-soft" />
          Operating
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-ok" />
          All current
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-warn" />
          Due soon
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-bad" />
          Needs attention
        </span>
      </div>
    </div>
  );
}
