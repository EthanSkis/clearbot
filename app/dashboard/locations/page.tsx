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

function USMap() {
  // Rough-scatter map: decorative SVG with labeled dots
  const dots = [
    { x: 210, y: 150, tone: "ok", label: "Seattle" },
    { x: 250, y: 180, tone: "ok", label: "SF" },
    { x: 270, y: 220, tone: "ok", label: "LA" },
    { x: 370, y: 215, tone: "bad", label: "Denver" },
    { x: 420, y: 270, tone: "ok", label: "Austin" },
    { x: 470, y: 275, tone: "ok", label: "Dallas" },
    { x: 490, y: 200, tone: "ok", label: "Chicago" },
    { x: 570, y: 200, tone: "ok", label: "Brooklyn" },
    { x: 555, y: 280, tone: "ok", label: "Atlanta" },
    { x: 575, y: 320, tone: "warn", label: "Miami" },
  ];
  return (
    <svg viewBox="150 100 500 270" className="h-[280px] w-full">
      <rect x="150" y="100" width="500" height="270" fill="#f9f9f8" rx="8" />
      {/* abstract US shape */}
      <path
        d="M180 180 Q200 140 260 140 L420 130 Q520 130 580 170 Q620 200 610 260 Q600 320 520 330 L280 335 Q210 330 185 290 Q170 240 180 180 Z"
        fill="#eef1e6"
        stroke="rgba(0,0,0,0.08)"
      />
      {dots.map((d, i) => (
        <g key={i}>
          <circle
            cx={d.x}
            cy={d.y}
            r={6}
            fill={
              d.tone === "ok" ? "#16a34a" : d.tone === "warn" ? "#d97706" : "#dc2626"
            }
            opacity={0.85}
          />
          <circle cx={d.x} cy={d.y} r={12} fill="none" stroke={d.tone === "ok" ? "#16a34a" : d.tone === "warn" ? "#d97706" : "#dc2626"} strokeOpacity={0.2} />
          <text
            x={d.x + 10}
            y={d.y - 8}
            fontFamily="ui-monospace, monospace"
            fontSize="10"
            fill="#6b6b6b"
          >
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
