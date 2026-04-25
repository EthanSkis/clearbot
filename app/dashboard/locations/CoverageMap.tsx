import type { LocationRow } from "./LocationsClient";

type Tone = "ok" | "warn" | "bad";

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

export function CoverageMapServer({ rows }: { rows: LocationRow[] }) {
  const byState = rows.reduce<Record<string, LocationRow[]>>((acc, r) => {
    const s = (r.state ?? "").toUpperCase();
    if (!s) return acc;
    (acc[s] ||= []).push(r);
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
          const tones: Tone[] = locs.map((l) =>
            l.overdue > 0 ? "bad" : l.due > 0 ? "warn" : "ok"
          );
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
                locs.slice(0, 4).map((l, i) => {
                  const n = Math.min(locs.length, 4);
                  const spread = 8;
                  const offset = n === 1 ? 0 : (i - (n - 1) / 2) * spread;
                  return (
                    <circle
                      key={l.id}
                      cx={x + CELL / 2 + offset}
                      cy={y + CELL - 11}
                      r={3}
                      fill={TONE_HEX[tones[i]]}
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
